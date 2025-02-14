import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import process from 'process';
import * as anchor from "@coral-xyz/anchor";
import { Keypair, SystemProgram } from '@solana/web3.js';
import { Wallet } from "@coral-xyz/anchor";

const PROGRAM_NAME = 'ai_debate';
const PROGRAM_ID_PATH = path.join(__dirname, '..', 'program_id.json');
// process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";
// Change devnet to mainnet-beta
process.env.ANCHOR_PROVIDER_URL = "https://api.mainnet-beta.solana.com";
process.env.ANCHOR_WALLET = path.join(__dirname, "..", "deploy-wallet.json");

async function main() {
  try {
    // Check if wallet exists, create if it doesn't
    if (!fs.existsSync(path.join(__dirname, '..', 'deploy-wallet.json'))) {
      console.log('Creating new deploy wallet...');
      execSync('solana-keygen new --no-bip39-passphrase -o deploy-wallet.json', { stdio: 'inherit' });
      
      // Configure local CLI to use this wallet
      execSync('solana config set --keypair deploy-wallet.json', { stdio: 'inherit' });
      
      // Switch to devnet
      execSync('solana config set --url devnet', { stdio: 'inherit' });
      
      // Airdrop some SOL for deployment
      execSync('solana airdrop 2', { stdio: 'inherit' });
      console.log('Wallet created and funded on devnet');
    }

    // Build the program and wait for completion
    console.log('Building program...');
    execSync('anchor build', { stdio: 'inherit' });

    // Wait for file to exist (max 30 seconds)
    const idlPath = path.join(__dirname, '..', 'target', 'idl', `${PROGRAM_NAME}.json`);
    let attempts = 0;
    while (!fs.existsSync(idlPath) && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    if (!fs.existsSync(idlPath)) {
      throw new Error('IDL file not found after build');
    }

    // Get Program ID from target/deploy
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const programId = new anchor.web3.PublicKey(idl.address);

    // Save program ID
    fs.writeFileSync(PROGRAM_ID_PATH, JSON.stringify({ programId }, null, 2));
    console.log(`Program ID saved to ${PROGRAM_ID_PATH}`);

    // Deploy the program
    console.log('Deploying program to devnet...');
    execSync('anchor deploy', { stdio: 'inherit' });

    // Initialize the jungle
    console.log('Initializing jungle...');
    try {
      const keypairFile = path.join(__dirname, '..', 'deploy-wallet.json');
      const deployWalletKeypair = Keypair.fromSecretKey(
        Buffer.from(JSON.parse(fs.readFileSync(keypairFile, 'utf-8')))
    );

      const provider = anchor.AnchorProvider.env();
      anchor.setProvider(provider);

      const program = anchor.workspace.AiDebate;

      const [junglePDA] = anchor.web3.PublicKey.findProgramAddressSync(
          [Buffer.from("jungle")],
          programId
      );

      await program.methods
          .initializeJungle()
          .accounts({
              jungle: junglePDA,
              authority: provider.wallet.publicKey,
              systemProgram: SystemProgram.programId,
          })
          .signers([deployWalletKeypair])
          .rpc();

      console.log('Deployment successful!');
      console.log(`Program ID: ${program.programId.toString()}`);
      console.log(`Jungle PDA: ${junglePDA.toString()}`);

    } catch (error) {
      console.error('Deployment failed:', error);
      process.exit(1);
    }

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

main();
