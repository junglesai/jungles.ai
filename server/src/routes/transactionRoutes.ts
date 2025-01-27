import { Router, RequestHandler } from 'express';
import { Connection, PublicKey, SystemProgram, Keypair, TransactionInstruction } from '@solana/web3.js';
import { sha256 } from 'js-sha256';
import { Debate } from '../models/Debate.js';
import dotenv from 'dotenv';

dotenv.config();

const isMainnet = process.env.NODE_ENV === 'production';
const RPC_URL = isMainnet ? process.env.SOLANA_MAINNET_RPC_URL : process.env.SOLANA_DEVNET_RPC_URL;

if (!process.env.SOLANA_PROGRAM_ID || !RPC_URL) {
  throw new Error('Missing Solana configuration');
}

const PROGRAM_ID = new PublicKey(process.env.SOLANA_PROGRAM_ID);

const router = Router();
const connection = new Connection(RPC_URL, "confirmed");

// Get pool information for a debate
const getPoolInfo: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const debate = await Debate.findById(req.params.debateId);
    if (!debate || !debate.solanaAddress) {
      res.status(404).json({ message: 'Debate not found or not initialized on chain' });
      return;
    }

    const debatePDA = new PublicKey(debate.solanaAddress);
    const accountInfo = await connection.getAccountInfo(debatePDA);
    if (!accountInfo) {
      res.status(404).json({ message: 'Debate account not found on chain' });
      return;
    }

    const data = Buffer.from(accountInfo.data);
    // Skip 8 bytes discriminator
    let offset = 8;
    
    // Skip agent_a pubkey (32 bytes)
    offset += 32;
    
    // Skip agent_b pubkey (32 bytes)
    offset += 32;
    
    // Read pool amounts (u64 = 8 bytes each)
    const pool1 = data.readBigUInt64LE(offset);
    offset += 8;
    const pool2 = data.readBigUInt64LE(offset);

    res.json({
      agent1Pool: Number(pool1),
      agent2Pool: Number(pool2),
      totalPool: Number(pool1 + pool2)
    });

  } catch (error) {
    console.error('Error fetching pool info:', error);
    res.status(500).json({ message: 'Error fetching pool information' });
  }
};

router.get('/pool/:debateId', getPoolInfo);

// Place a bet
const placeBet: RequestHandler = async (req, res, next): Promise<void> => {   
  try {
    const { debateId, agentIndex, amount, walletPublicKey } = req.body;

    const debate = await Debate.findById(debateId);
    if (!debate || !debate.solanaAddress) {
      res.status(404).json({ message: 'Debate not found or not initialized on chain' });
      return;
    }

    const debatePDA = new PublicKey(debate.solanaAddress);
    const userPubkey = new PublicKey(walletPublicKey);

    // Create bet instruction
    const discriminator = Buffer.from(
      sha256.digest("global:place_bet").slice(0, 8)
    );

    const data = Buffer.concat([
      discriminator,
      Buffer.from([agentIndex]), // 0 for agent1, 1 for agent2
      Buffer.from(new Uint8Array(new BigInt64Array([BigInt(amount)]).buffer)), // amount in lamports
    ]);

    // Return transaction data for frontend to sign
    const instruction = {
      keys: [
        { pubkey: debatePDA, isSigner: false, isWritable: true },
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data,
    };

    res.json({ instruction });

  } catch (error) {
    console.error('Error creating bet transaction:', error);
    res.status(500).json({ message: 'Error creating bet transaction' });
  }
};

router.post('/bet', placeBet);

// Prepare initialize debate transaction
const prepareInitializeDebate: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { walletPublicKey } = req.body;
    const userPubkey = new PublicKey(walletPublicKey);
    
    const debateKeypair = Keypair.generate();
    const agent1Pubkey = Keypair.generate().publicKey;
    const agent2Pubkey = Keypair.generate().publicKey;

    const discriminator = Buffer.from(
      sha256.digest("global:initialize_debate").slice(0, 8)
    );

    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: debateKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: userPubkey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.concat([
        discriminator,
        agent1Pubkey.toBuffer(),
        agent2Pubkey.toBuffer()
      ]),
    });

    res.json({ 
      instruction,
      debateKeypair: {
        publicKey: debateKeypair.publicKey.toBase58(),
        secretKey: Array.from(debateKeypair.secretKey)
      },
      agent1: agent1Pubkey.toBase58(),
      agent2: agent2Pubkey.toBase58()
    });

  } catch (error) {
    console.error('Error preparing initialize debate transaction:', error);
    res.status(500).json({ message: 'Error preparing transaction' });
  }
};

router.post('/initialize-debate', prepareInitializeDebate);

const verifyAndCreateDebate: RequestHandler = async (req, res, next): Promise<void> => {
  try {
    const { signature, debateAddress, agent1, agent2, params } = req.body;

    // Check if debate already exists with this signature or address
    const existingDebate = await Debate.findOne({ 
      $or: [
        { signature: signature },
        { solanaAddress: debateAddress }
      ]
    });

    if (existingDebate) {
      res.status(400).json({ message: 'Debate already exists' });
      return;
    }

    // Verify transaction
    const tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      res.status(400).json({ message: 'Transaction not found' });
      return;
    }

    // Verify program ID
    if (!tx.transaction.message.staticAccountKeys.some(key => key.equals(PROGRAM_ID))) {
      res.status(400).json({ message: 'Invalid program ID' });
      return;
    }

    // Create debate in database
    const debate = new Debate({
      title: params.title,
      description: params.description,
      messageLimit: params.messageLimit,
      solanaAddress: debateAddress,
      signature: signature,
      agents: [
        { name: 'agent_a', publicKey: agent1 },
        { name: 'agent_b', publicKey: agent2 }
      ],
      status: 'active'
    });

    await debate.save();

    res.json({ debate });

  } catch (error) {
    console.error('Error verifying transaction:', error);
    res.status(500).json({ message: 'Error verifying transaction' });
  }
};

router.post('/verify-debate', verifyAndCreateDebate);

export default router; 