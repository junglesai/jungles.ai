import express, { Router, Request, Response } from 'express';
import { Debate } from '../models/Debate.js';
import { clearThread } from '../services/debateService.js';
import { debateManager } from '../services/debateManagerService.js';
import { createDebate } from '../services/openai.js';
import { verifyTransaction } from '../utils/verifyTransaction.js';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const router: Router = express.Router();

const isMainnet = process.env.NODE_ENV === 'production';
const RPC_URL = isMainnet ? process.env.SOLANA_MAINNET_RPC_URL : process.env.SOLANA_DEVNET_RPC_URL;

if (!process.env.SOLANA_PROGRAM_ID || !RPC_URL) {
  throw new Error('Missing Solana configuration');
}

const connection = new Connection(RPC_URL, "confirmed");


router.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 9;
    const lastId = req.query.lastId as string;
    const search = req.query.search as string;
    const sort = req.query.sort as string;
    const deployer = req.query.deployer as string;
    let query: any = {};
    let sortQuery: any = { _id: -1 }; // default sort

    // Always use _id for pagination
    if (lastId) {
      query._id = { $lt: lastId };
    }

    // Build sort query
    switch (sort) {
      case 'recent':
        sortQuery = { startTime: -1, _id: -1 };
        break;
      case 'pool':
        sortQuery = { totalPool: -1, _id: -1 };
        break;
      case 'messages':
        sortQuery = { 'messages.length': -1, _id: -1 };
        break;
    }
    
    // Add search query
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const debates = await Debate.find(query)
      .sort(sortQuery)
      .limit(limit + 1);

    const hasNextPage = debates.length > limit;
    const items = debates.slice(0, limit);

    let myDebates = [];
    if (deployer) { 
      myDebates = await Debate.find({ deployer });
    }
    
    res.json({
      items,
      myDebates,
      pagination: {
        hasNextPage,
        nextLastId: hasNextPage ? items[items.length - 1]._id : null,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching debates' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const debate = await Debate.findById(req.params.id);
    res.json(debate);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching debate' });
  }
});


router.get('/:id/messages', async (req: Request, res: Response) => {
  try {
    const debate = await Debate.findById(req.params.id);

    const lastMessage = debate.messages[debate.messages.length - 1];
    if (lastMessage?.timestamp < new Date(Date.now() - 45000) && debate.status === 'active') {
      if (lastMessage?.status === 'typing') {
        debate.messages.pop();
        await debate.save();
      }
      debateManager.continueDebate(req.params.id);
    }
    res.json(debate);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching debate' });
  }
});

router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const result = await debateManager.startDebate(req.params.id);
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error starting debate' });
  }
});

router.post('/:id/pause', async (req: Request, res: Response) => {
  try {
    const result = await debateManager.pauseDebate(req.params.id);
    if (result.success) {
      res.json({ message: result.message });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error pausing debate' });
  }
});

router.post('/:id/clear', async (req: Request, res: Response) => {
  try {
    await clearThread(req.params.id);
    res.json({ message: 'Thread cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing thread' });
  }
});

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { signature, debateAddress, agent1, agent2, prompt } = req.body;
    const verify = await verifyTransaction(signature, debateAddress, agent1, agent2);

    if (verify.error) {
      throw new Error('Failed to verify transaction');
    }

    const debateResponse = await createDebate(prompt);
    if (!debateResponse) {
      throw new Error('Failed to create debate');
    }

    const newDebate = {
      ...debateResponse,
      agents: [debateResponse.agent1, debateResponse.agent2],
      signature: signature,
      solanaAddress: debateAddress,
      deployer: verify.deployer,
    }
    const debate = new Debate(newDebate);
    const savedDebate = await debate.save();

    res.json({
      ...debateResponse,
      _id: savedDebate._id,
      signature: savedDebate.signature,
      solanaAddress: savedDebate.solanaAddress,
      deployer: savedDebate.deployer
    });
    } catch (error) {
    res.status(500).json({ message: error });
  }
});

// Update pool size
router.post('/:id/update-pool', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const debate = await Debate.findById(id);
    
    if (!debate || !debate.solanaAddress) {
      throw new Error('Debate not found');
    }

    const debateAccount = new PublicKey(debate.solanaAddress);
    const accountInfo = await connection.getAccountInfo(debateAccount);
    
    if (!accountInfo) {
      throw new Error('Debate account not found on chain');
    }

    // Skip 8 bytes discriminator + 64 bytes for agent pubkeys
    const data = accountInfo.data;
    const pool1 = data.readBigUInt64LE(8 + 64);
    const pool2 = data.readBigUInt64LE(8 + 64 + 8);
    const totalPool = Number(pool1) + Number(pool2);

    // Update debate in database
    await Debate.findByIdAndUpdate(id, {
      totalPool,
      'agents.0.pool': Number(pool1),
      'agents.1.pool': Number(pool2)
    });

    res.json({ 
      totalPool,
      agent1Pool: Number(pool1),
      agent2Pool: Number(pool2)
    });

  } catch (error) {
    console.error('Error updating pool:', error);
    res.status(500).json({ message: 'Error updating pool size' });
  }
});

export default router;