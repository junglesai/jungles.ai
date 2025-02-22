import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  TransactionMessage, 
  VersionedTransaction, 
  Keypair,
  TransactionInstruction 
} from '@solana/web3.js';
import { sha256 } from 'js-sha256';
import { getProvider } from './phantom';
export const PROGRAM_ID = new PublicKey(import.meta.env.VITE_SOLANA_PROGRAM_ID);

export const initializeDebateOnChain = async (
  connection: Connection,
  publicKey: PublicKey,
  sendTransaction: (transaction: VersionedTransaction, connection: Connection) => Promise<string>,
) => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const debateKeypair = Keypair.generate();
      const agent1Pubkey = Keypair.generate().publicKey;
      const agent2Pubkey = Keypair.generate().publicKey;

      const [junglePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("jungle")],
        PROGRAM_ID
      );

      const jungleAccount = await connection.getAccountInfo(junglePDA);
      if (!jungleAccount) throw new Error("Jungle account not found");
      
      const jungleAuthority = new PublicKey(jungleAccount.data.slice(8, 40)); 

      const discriminator = Buffer.from(
        sha256.digest("global:initialize_debate").slice(0, 8)
      );

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: debateKeypair.publicKey, isSigner: true, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: jungleAuthority, isSigner: false, isWritable: true },
          { pubkey: junglePDA, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([
          discriminator,
          agent1Pubkey.toBuffer(),
          agent2Pubkey.toBuffer()
        ]),
      });

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);

      const provider = getProvider();
      transaction.sign([debateKeypair]);
      const { signature } = await provider.signAndSendTransaction(transaction);

      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });

      return {
        debateAddress: debateKeypair.publicKey.toBase58(),
        agent1: agent1Pubkey.toBase58(),
        agent2: agent2Pubkey.toBase58(),
        signature: signature,
      };

    } catch (error: any) {
      attempt++;
      if (error.toString().includes('TransactionExpiredBlockheightExceeded') && attempt < MAX_RETRIES) {
        console.log(`Transaction expired, retrying (${attempt}/${MAX_RETRIES})...`);
        continue;
      }
      throw error;
    }
  }

  throw new Error('Failed to send transaction after max retries');
}; 