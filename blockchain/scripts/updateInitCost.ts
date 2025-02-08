import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Program } from "@coral-xyz/anchor";
import { AiDebate } from "../target/types/ai_debate";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Set all required environment variables
process.env.ANCHOR_PROVIDER_URL = process.env.NODE_ENV === 'production' 
  ? process.env.SOLANA_MAINNET_RPC_URL! 
  : process.env.SOLANA_DEVNET_RPC_URL!;

const walletPath = path.join(__dirname, '..', 'deploy-wallet.json');
const wallet = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(walletPath, 'utf8'))));
process.env.ANCHOR_WALLET = walletPath;

async function updateInitCost() {
  try {
    // Configure provider
    anchor.setProvider(anchor.AnchorProvider.env());
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const program = anchor.workspace.AiDebate as Program<AiDebate>;

    // Get jungle PDA
    const [junglePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("jungle")],
      program.programId
    );

    const newCost = new anchor.BN(0.05 * LAMPORTS_PER_SOL);
    
    // Log initial state
    console.log("Jungle PDA:", junglePda.toString());
    
    const jungleAccount = await program.account.jungle.fetch(junglePda);
    console.log("Jungle authority:", jungleAccount.authority.toString());
    console.log("Current init cost:", jungleAccount.initCost.toString());
    
    // Update cost
    const tx = await program.methods
      .updateInitCost(newCost)
      .accounts({
        authority: provider.publicKey,
      })
      .signers([wallet])
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Verify update
    const updatedJungle = await program.account.jungle.fetch(junglePda);
    console.log("New init cost:", updatedJungle.initCost.toString());
    console.log("Expected cost:", newCost.toString());

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateInitCost().then(() => process.exit(0));
