import { sha256 } from 'js-sha256';
import { Connection, PublicKey, Keypair, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isMainnet = process.env.NODE_ENV === 'production';
const RPC_URL = isMainnet ? process.env.SOLANA_MAINNET_RPC_URL : process.env.SOLANA_DEVNET_RPC_URL;

if (!process.env.SOLANA_PROGRAM_ID || !RPC_URL || !process.env.SOLANA_JUNGLE_PDA) {
  throw new Error('Missing Solana configuration');
}

const PROGRAM_ID = new PublicKey(process.env.SOLANA_PROGRAM_ID);
const JUNGLE_PDA = new PublicKey(process.env.SOLANA_JUNGLE_PDA);
const connection = new Connection(RPC_URL, "confirmed");
const keypairFile = readFileSync(path.join(__dirname, "./deploy-wallet.json"));
const keypair = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(keypairFile.toString()))
);

export async function finalizeDebate(solanaAddress: string, isAgentA: boolean) {
    try {
      const debateAccount = new PublicKey(solanaAddress);
      const accountInfo = await connection.getAccountInfo(debateAccount);
      if (!accountInfo) {
        throw new Error('Debate account not found');
      }

      const accountData = accountInfo.data;

      const agent_a = new PublicKey(accountData.slice(8, 40));
      const agent_b = new PublicKey(accountData.slice(40, 72));
      const finalized = accountData[8 + 32 + 32 + 8 + 8] === 1;
      if (finalized) {
        return;
      }
    // Choose winner pubkey based on winner string
    const winnerPubkey = isAgentA ? agent_a : agent_b;


      const discriminator = Buffer.from(sha256.digest("global:finalize_debate").slice(0, 8));
      const data = Buffer.concat([
        discriminator,
        winnerPubkey.toBuffer()
      ]);

      const jungleAccount = new PublicKey(JUNGLE_PDA);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: debateAccount, isSigner: false, isWritable: true },
          { pubkey: keypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: jungleAccount, isSigner: false, isWritable: false }, 
        ],
        programId: PROGRAM_ID,
        data,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: keypair.publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);
      transaction.sign([keypair]);

      const MAX_RETRIES = 3;
      let attempt = 0;
      
      while (attempt < MAX_RETRIES) {
        try {
          const signature = await connection.sendTransaction(transaction);
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          await connection.confirmTransaction({
            signature,
            blockhash,
            lastValidBlockHeight
          });
          return signature;
        } catch (error: any) {
          attempt++;
          if (error.toString().includes('TransactionExpiredBlockheightExceeded') && attempt < MAX_RETRIES) {
            console.log(`Transaction expired, retrying (${attempt}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // Exponential backoff
            continue;
          }
          throw error;
        }
      }
      
      throw new Error('Failed to send transaction after max retries');
    } catch (error) {
      console.error('Error finalizing debate on chain:', error);
      throw error;
    }
  }