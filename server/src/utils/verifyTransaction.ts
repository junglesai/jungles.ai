import { Debate } from '../models/Debate.js';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const isMainnet = process.env.NODE_ENV === 'production';
const RPC_URL = isMainnet ? process.env.SOLANA_MAINNET_RPC_URL : process.env.SOLANA_DEVNET_RPC_URL;

if (!process.env.SOLANA_PROGRAM_ID || !RPC_URL) {
  throw new Error('Missing Solana configuration');
}

const PROGRAM_ID = new PublicKey(process.env.SOLANA_PROGRAM_ID);
const connection = new Connection(RPC_URL, "confirmed");

export const verifyTransaction = async (signature: string, debateAddress: string, agent1: string, agent2: string) => {
    try {
        const existingDebate = await Debate.findOne({ 
          $or: [
            { signature: signature },
            { solanaAddress: debateAddress }
          ]
        });
    
        if (existingDebate) {
          return { error: true, message: 'Debate already exists' }
        }
    
        const tx = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0,
        });
    
        if (!tx) {
          return { error: true, message: 'Transaction not found' }
        }
    
        if (!tx.transaction.message.staticAccountKeys.some(key => key.equals(PROGRAM_ID))) {
          return { error: true, message: 'Invalid program ID' }
        }

        const debateAccount = new PublicKey(debateAddress);
        const accountInfo = await connection.getAccountInfo(debateAccount);
        if (!accountInfo) {
        return { error: true, message: 'Debate account not found' }
        }

        const data = accountInfo.data;
        const agent1OnChain = new PublicKey(data.slice(8, 40));
        const agent2OnChain = new PublicKey(data.slice(40, 72));

        if (!agent1OnChain.equals(new PublicKey(agent1)) || !agent2OnChain.equals(new PublicKey(agent2))) {
        return { error: true, message: 'Agent addresses do not match on-chain data' }
        }
    
        return { error: false, message: 'Debate created', debateAddress, agent1, agent2, signature };
      } catch (error) {
        console.error('Error verifying transaction:', error);
        return { error: true, message: 'Error verifying transaction' }
      }
}