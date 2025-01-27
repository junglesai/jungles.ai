import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

const PROGRAM_ID_PATH = path.join(__dirname, '..', 'program_id.json');

function main() {
  try {
    // Generate new keypair for program ID
    const programKeypair = Keypair.generate();
    const programId = programKeypair.publicKey.toString();

    // Save program ID and secret key
    const programInfo = {
      programId,
      secretKey: Array.from(programKeypair.secretKey)
    };

    fs.writeFileSync(PROGRAM_ID_PATH, JSON.stringify(programInfo, null, 2));
    console.log(`New program ID generated and saved to ${PROGRAM_ID_PATH}`);
    console.log(`Program ID: ${programId}`);

  } catch (error) {
    console.error('Failed to generate program ID:', error);
    process.exit(1);
  }
}

main(); 