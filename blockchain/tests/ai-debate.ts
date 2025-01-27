import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AiDebate } from "../target/types/ai_debate";
import { assert } from "chai";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { describe, it, before } from "mocha";
import { PublicKey } from "@solana/web3.js";

describe("ai_debate", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();

  const program = anchor.workspace.AiDebate as Program<AiDebate>;

  
  const connection = provider.connection;

  let debateAccount = Keypair.generate();
  let agentA = Keypair.generate().publicKey;
  let agentB = Keypair.generate().publicKey;
  let userBetAccount: anchor.web3.PublicKey;
  let junglePDA: anchor.web3.PublicKey;
  let jungleBump: number;
  let user: Keypair;

  // Using smaller amounts and ensuring they're whole numbers in lamports
  const BET_A_AMOUNT = new anchor.BN(2 * LAMPORTS_PER_SOL);
  const BET_B_AMOUNT = new anchor.BN(1 * LAMPORTS_PER_SOL);
  const WITHDRAWAL_AMOUNT = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
  const ADDITIONAL_BET = new anchor.BN(0.5 * LAMPORTS_PER_SOL);

  const INIT_COST = new anchor.BN(0.1 * LAMPORTS_PER_SOL);

  before(async () => {
    // Create a new user account
    user = Keypair.generate();
    
    // Request airdrops
    const adminAirdrop = await connection.requestAirdrop(
        provider.publicKey,
        10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(adminAirdrop);

    const userAirdrop = await connection.requestAirdrop(
        user.publicKey,
        10 * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(userAirdrop);

    // Find PDAs
    [junglePDA, jungleBump] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("jungle")],
        program.programId
    );

    [userBetAccount] = await anchor.web3.PublicKey.findProgramAddress(
        [
            Buffer.from("user_bet"),
            debateAccount.publicKey.toBuffer(),
            user.publicKey.toBuffer(),
        ],
        program.programId
    );

    // Initialize jungle
    await program.methods
        .initializeJungle()
        .accounts({
            jungle: junglePDA,
            authority: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .rpc();

    // Get initial balances
    const initialUserBalance = await connection.getBalance(user.publicKey);
    const initialAuthorityBalance = await connection.getBalance(provider.publicKey);

    // Initialize debate
    await program.methods
        .initializeDebate(agentA, agentB)
        .accounts({
            debate: debateAccount.publicKey,
            user: user.publicKey,
            jungleAuthority: provider.wallet.publicKey,
            jungle: junglePDA,
            systemProgram: SystemProgram.programId,
        })
        .signers([debateAccount, user])
        .rpc();

    // Verify costs
    const finalUserBalance = await connection.getBalance(user.publicKey);
    const finalAuthorityBalance = await connection.getBalance(provider.publicKey);
    const userCostDiff = (initialUserBalance - finalUserBalance) / LAMPORTS_PER_SOL;
    const authorityDiff = (finalAuthorityBalance - initialAuthorityBalance) / LAMPORTS_PER_SOL;

    console.log({
        userCostDiff,
        authorityDiff,
        initCost: 0.1,
    });
  });

  it("Places multiple bets on both agents", async () => {
    // Place bet on Agent A
    await program.methods
        .placeBet(BET_A_AMOUNT, true)
        .accounts({
            debate: debateAccount.publicKey,
            userBet: userBetAccount,
            user: user.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

    // Place bet on Agent B
    await program.methods
        .placeBet(BET_B_AMOUNT, false)
        .accounts({
            debate: debateAccount.publicKey,
            userBet: userBetAccount,
            user: user.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

    const debate = await program.account.debate.fetch(debateAccount.publicKey);
    assert.equal(debate.totalAgentA.toString(), BET_A_AMOUNT.toString());
    assert.equal(debate.totalAgentB.toString(), BET_B_AMOUNT.toString());
  });

  it("Partially withdraws bets before finalization", async () => {
    // Calculate proportional withdrawal from each pool (in lamports)
    const fromA = WITHDRAWAL_AMOUNT.mul(new anchor.BN(2)).div(new anchor.BN(3));
    const fromB = WITHDRAWAL_AMOUNT.div(new anchor.BN(3));

    // Withdraw from pool A
    await program.methods
        .withdraw(fromA, true)
        .accounts({
            debate: debateAccount.publicKey,
            userBet: userBetAccount,
            user: user.publicKey,
            authority: user.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

    // Withdraw from pool B
    await program.methods
        .withdraw(fromB, false)
        .accounts({
            debate: debateAccount.publicKey,
            userBet: userBetAccount,
            user: user.publicKey,
            authority: user.publicKey,
            systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

    const debate = await program.account.debate.fetch(debateAccount.publicKey);
    const expectedRemainingA = BET_A_AMOUNT.sub(fromA);
    const expectedRemainingB = BET_B_AMOUNT.sub(fromB);

    assert.approximately(
        Number(debate.totalAgentA.toString()) / LAMPORTS_PER_SOL,
        Number(expectedRemainingA.toString()) / LAMPORTS_PER_SOL,
        0.0001
    );
    assert.approximately(
        Number(debate.totalAgentB.toString()) / LAMPORTS_PER_SOL,
        Number(expectedRemainingB.toString()) / LAMPORTS_PER_SOL,
        0.0001
    );
  });

  it("Places another bet after partial withdrawal", async () => {
    await program.methods
      .placeBet(ADDITIONAL_BET, true)
      .accounts({
        debate: debateAccount.publicKey,
        userBet: userBetAccount,
        user: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const debate = await program.account.debate.fetch(debateAccount.publicKey);
    const fromA = WITHDRAWAL_AMOUNT.mul(new anchor.BN(2)).div(new anchor.BN(3));
    const expectedTotalA = BET_A_AMOUNT.sub(fromA).add(ADDITIONAL_BET);

    assert.approximately(
      Number(debate.totalAgentA.toString()) / LAMPORTS_PER_SOL,
      Number(expectedTotalA.toString()) / LAMPORTS_PER_SOL,
      0.0001
    );
  });

  it("Finalizes the debate with Agent A as winner", async () => {
    await program.methods
        .finalizeDebate(agentA)
        .accounts({
            debate: debateAccount.publicKey,
            authority: user.publicKey,
        })
        .signers([user])
        .rpc();

    const debate = await program.account.debate.fetch(debateAccount.publicKey);
    assert.ok(debate.winningAgent.equals(agentA));
    assert.ok(debate.finalized);
  });

  it("Withdraws winnings after finalization", async () => {
    const debate = await program.account.debate.fetch(debateAccount.publicKey);
    const userBet = await program.account.userBet.fetch(userBetAccount);
    const totalPool = Number(debate.totalAgentA) + Number(debate.totalAgentB);
    const expectedWinnings = Math.floor((Number(userBet.amountOnA) * totalPool) / Number(debate.totalAgentA));

    await program.methods
      .withdraw(new anchor.BN(expectedWinnings), true)
      .accounts({
        debate: debateAccount.publicKey,
        userBet: userBetAccount,
        user: user.publicKey,
        authority: user.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const updatedUserBet = await program.account.userBet.fetch(userBetAccount);
    assert.equal(updatedUserBet.amountOnA.toString(), "0");
    assert.equal(updatedUserBet.amountOnB.toString(), "0");
  });

  it("Fails to withdraw after claiming winnings", async () => {
    try {
      await program.methods
        .withdraw(new anchor.BN(LAMPORTS_PER_SOL), true)
        .accounts({
          debate: debateAccount.publicKey,
          userBet: userBetAccount,
          user: user.publicKey,
          authority: user.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();
      assert.fail("Should not be able to withdraw after claiming winnings");
    } catch (err) {
      assert.include(err.toString(), "NoWinningsToWithdraw");
    }
  });

  it("Correctly fetches debate authority", async () => {
    const debateAccountInfo = await program.provider.connection.getAccountInfo(debateAccount.publicKey);
    if (!debateAccountInfo) throw new Error("Debate account not found");

    // Get authority from account data
    const authorityFromData = new PublicKey(
      Buffer.from(debateAccountInfo.data).slice(8 + 32 + 32 + 8 + 8 + 1 + 1 + 32, 8 + 32 + 32 + 8 + 8 + 1 + 1 + 32 + 32)
    );

    // Get authority from anchor account
    const debate = await program.account.debate.fetch(debateAccount.publicKey);
    
    console.log("Authority from data:", authorityFromData.toBase58());
    console.log("Actual authority:", debate.authority.toBase58());
    
    assert.equal(
      authorityFromData.toBase58(),
      debate.authority.toBase58(),
      "Authority offset is incorrect"
    );
  });

  it("Updates initialization cost", async () => {
    const newCost = new anchor.BN(0.2 * LAMPORTS_PER_SOL);
    
    console.log("Provider wallet:", provider.wallet.publicKey.toString());
    console.log("Jungle PDA:", junglePDA.toString());
    
    const jungleAccount = await program.account.jungle.fetch(junglePDA);
    console.log("Jungle authority:", jungleAccount.authority.toString());
    console.log("Current init cost:", jungleAccount.initCost.toString());
    
    try {
        const tx = await program.methods
            .updateInitCost(newCost)
            .accounts({
                authority: provider.wallet.publicKey,
                jungle: junglePDA,
            })
            .signers([provider.wallet.payer])
            .rpc();
        
        console.log("Transaction signature:", tx);
        // Wait for confirmation and check the error
        const confirmation = await provider.connection.confirmTransaction(tx, 'confirmed');
        if (confirmation.value.err) {
            console.error("Transaction error:", confirmation.value.err);
        }
        
    } catch (error) {
        console.error("Error updating init cost:", error);
        throw error;
    }

    // Verify jungle state
    const updatedJungle = await program.account.jungle.fetch(junglePDA);
    console.log("New init cost:", updatedJungle.initCost.toString());
    console.log("Expected cost:", newCost.toString());

    assert.equal(
        updatedJungle.initCost.toString(),
        newCost.toString(),
        "Jungle init cost not updated correctly"
    );
  });
});
