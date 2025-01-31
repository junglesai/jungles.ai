import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, TransactionInstruction } from '@solana/web3.js';
import { sha256 } from 'js-sha256';
import { Buffer } from 'buffer';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Toast, { ToastType } from './Toast';
import axios from 'axios';
import SlotCounter from 'react-slot-counter';


interface Props {
  debateId: string;
  agents: Array<{ name: string; stance: string }>;
  status: string;
  onPoolsUpdate: () => void;
  poolSize: number;
  isPoolUpdated: boolean;
  agentPools: [number, number];
  setPoolSize: (size: number) => void;
  setAgentPools: (pools: [number, number]) => void;
}

interface UserPosition {
  totalInvested: number;
  potentialReturns: {
    ifAgent1Wins: number;
    ifAgent2Wins: number;
  };
  currentPullable: number;
}

const PROGRAM_ID = new PublicKey(import.meta.env.VITE_SOLANA_PROGRAM_ID);

const BettingPanel: React.FC<Props> = ({ debateId, agents, poolSize, agentPools }) => {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [poolInfo, setPoolInfo] = useState<{
    agent1Pool: number;
    agent2Pool: number;
    totalPool: number;
  }>({ agent1Pool: 0, agent2Pool: 0, totalPool: 0 });
  const [betAmounts, setBetAmounts] = useState<[string, string]>(['', '']);
  const [pullAmounts, setPullAmounts] = useState<[string, string]>(['', '']);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition>({
    totalInvested: 0,
    potentialReturns: {
      ifAgent1Wins: 0,
      ifAgent2Wins: 0
    },
    currentPullable: 0
  });
  
  const mode = import.meta.env.VITE_MODE;
  const connection = new Connection(mode === 'dev' ? import.meta.env.VITE_SOLANA_DEVNET_RPC_URL : import.meta.env.VITE_SOLANA_MAINNET_RPC_URL);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const fetchPoolsFromChain = async () => {
    try {
      const debate = await fetch(`/api/debates/${debateId}`).then(res => res.json());
      const debateAccount = new PublicKey(debate.solanaAddress);
      const accountInfo = await connection.getAccountInfo(debateAccount);
      
      if (!accountInfo) {
        console.error('Debate account not found');
        return;
      }

      // Skip 8 bytes discriminator + 64 bytes for agent pubkeys
      const data = accountInfo.data;
      const pool1 = data.readBigUInt64LE(8 + 64);
      const pool2 = data.readBigUInt64LE(8 + 64 + 8);
      setPoolInfo({
        agent1Pool: Number(pool1),
        agent2Pool: Number(pool2),
        totalPool: Number(pool1) + Number(pool2)
      });

    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  const calculateUserPosition = async () => {
    if (!publicKey) return;
    
    try {
      const debate = await fetch(`/api/debates/${debateId}`).then(res => res.json());
      const [userBetAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("user_bet"),
          new PublicKey(debate.solanaAddress).toBuffer(),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      const accountInfo = await connection.getAccountInfo(userBetAccount);
      if (!accountInfo) return;

      // Skip 8 bytes discriminator
      const data = accountInfo.data;
      const amountOnA = Number(data.readBigUInt64LE(8));
      const amountOnB = Number(data.readBigUInt64LE(16));

      const totalInvested = amountOnA + amountOnB;

      const debateAccount = new PublicKey(debate.solanaAddress);
      const debateInfo = await connection.getAccountInfo(debateAccount);
      
      if (!debateInfo) {
        console.error('Debate account not found');
        return;
      }

      // Skip 8 bytes discriminator + 64 bytes for agent pubkeys
      const debateData = debateInfo.data;
      const pool1 = Number(debateData.readBigUInt64LE(8 + 64));
      const pool2 = Number(debateData.readBigUInt64LE(8 + 64 + 8));
      const totalPool = pool1 + pool2;

      // Calculate potential returns based on current pool sizes
      const potentialIfAWins = amountOnA > 0 
            ? (amountOnA * totalPool) / pool1
        : 0;

        const potentialIfBWins = amountOnB > 0 
        ? (amountOnB * totalPool) / pool2
        : 0;

        setUserPosition({
        totalInvested,
        potentialReturns: {
          ifAgent1Wins: Number(potentialIfAWins),
          ifAgent2Wins: Number(potentialIfBWins)
        },
        currentPullable: totalInvested
      });
    } catch (error) {
      console.error('Error calculating position:', error);
    }
  };

  const placeBet = async (agentIndex: number, amount: string) => {
    if (!publicKey) return;

    try {
      const debate = await fetch(`/api/debates/${debateId}`).then(res => res.json());
      const debateAccount = new PublicKey(debate.solanaAddress);

      const debateAccountInfo = await connection.getAccountInfo(debateAccount);
      if (!debateAccountInfo) {
        throw new Error('Debate account not found');
      }

      const debateData = debateAccountInfo.data;
      const finalized = debateData[8 + 32 + 32 + 8 + 8] === 1;
      if (finalized) {
        setToast({ message: 'Debate already finalized', type: 'error' });
        return;
      }
      // Create PDA for user's bet account
      const [userBetAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("user_bet"),
          debateAccount.toBuffer(),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      // Create bet instruction
      const discriminator = Buffer.from(sha256.digest("global:place_bet").slice(0, 8));
      const data = Buffer.concat([
        discriminator,
        Buffer.from(new Uint8Array(new BigInt64Array([BigInt(parseFloat(amount) * LAMPORTS_PER_SOL)]).buffer)),
        Buffer.from(new Uint8Array([agentIndex === 0 ? 1 : 0])) // Convert boolean to number
      ]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: debateAccount, isSigner: false, isWritable: true },
          { pubkey: userBetAccount, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);

      const signature = await sendTransaction(transaction, connection);
      await axios.post(`/api/debates/${debateId}/update-pool`);
      setToast({ message: 'Bet placed successfully!', type: 'success' });
      const newBetAmounts = [...betAmounts];
      newBetAmounts[agentIndex] = '';
      setBetAmounts(newBetAmounts as [string, string]);

    } catch (err: any) {
      console.error('Error placing bet:', err);
      let errorMessage = 'Failed to place bet';

      if (err.toString().includes('DebateAlreadyFinalized')) {
        errorMessage = 'This debate has already been finalized';
      } else if (err.toString().includes('InsufficientBalance')) {
        errorMessage = 'Insufficient balance for this bet';
      } else if (err.toString().includes('WalletSendTransactionError')) {
        errorMessage = 'User rejected the request';
      }

      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const pullBet = async (agentIndex: number, amount: string) => {
    if (!publicKey) return;

    try {
      const debate = await fetch(`/api/debates/${debateId}`).then(res => res.json());
      const debateAccount = new PublicKey(debate.solanaAddress);

      const debateAccountInfo = await connection.getAccountInfo(debateAccount);
      if (!debateAccountInfo) {
        throw new Error('Debate account not found');
      }

      const authority = new PublicKey(
        Buffer.from(debateAccountInfo.data).slice(8 + 32 + 32 + 8 + 8 + 1 + 1, 8 + 32 + 32 + 8 + 8 + 1 + 1 + 32)
      );

      const [userBetAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("user_bet"),
          debateAccount.toBuffer(),
          publicKey.toBuffer(),
        ],
        PROGRAM_ID
      );

      const withdrawalAmount = BigInt(Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL));

      const discriminator = Buffer.from(sha256.digest("global:withdraw").slice(0, 8));
      const data = Buffer.concat([
        discriminator,
        Buffer.from(new Uint8Array(new BigInt64Array([withdrawalAmount]).buffer)),
        Buffer.from(new Uint8Array([agentIndex === 0 ? 1 : 0]))
      ]);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: debateAccount, isSigner: false, isWritable: true },
          { pubkey: userBetAccount, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: authority, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });

      const { blockhash } = await connection.getLatestBlockhash();
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: blockhash,
        instructions: [instruction],
      }).compileToV0Message();

      const transaction = new VersionedTransaction(message);

      const signature = await sendTransaction(transaction, connection);
      await axios.post(`/api/debates/${debateId}/update-pool`);

      setToast({ message: 'Bet withdrawn successfully!', type: 'success' });

      const newPullAmounts = [...pullAmounts];
      newPullAmounts[agentIndex] = '';
      setPullAmounts(newPullAmounts as [string, string]);

    } catch (err: any) {
      console.error('Error withdrawing bet:', err);
      let errorMessage = 'Failed to withdraw bet';
      
      if (err.toString().includes('DebateAlreadyFinalized')) {
        errorMessage = 'This debate has already been finalized';
      } else if (err.toString().includes('InsufficientBalance')) {
        errorMessage = 'Insufficient balance for withdrawal';
      } else if (err.toString().includes('WalletSendTransactionError')) {
        errorMessage = 'User rejected the request';
      }

      setToast({ message: errorMessage, type: 'error' });
    }
  };

  useEffect(() => {
    calculateUserPosition();
  }, [poolSize, publicKey]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="px-0 py-0 border-gray-700">
      <div className="flex justify-between items-center mb-4 border-gray-700 pb-4 bg-gray-800 p-4 rounded-lg shadow-xl">
        <div className="text-gray-400 lowercase">{"{"} Total Pool {"}"}</div>
        <div className="text-yellowgreen-400 font-semibold">
          {isMobile ? (
            <span>{"{ "}{(poolSize / 1000000000).toFixed(2)} SOL{" }"}</span>
          ) : (
            <>
            
              <span className={`transition-all duration-500`}>
              {"{"} <SlotCounter 
                  value={(poolSize / 1000000000).toFixed(2)}
                  duration={1}
                  startValue="0.00"
                  useMonospaceWidth
                  charClassName="font-mono"
                />
              </span>
              <span> SOL{" }"}</span>
            </>
          )}
        </div>
      </div>
      <hr className="w-full border-gray-700 mb-4"/>
      <div className="flex flex-col gap-4">
        {agents.map((agent, index) => (
          <div key={agent.name} className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="text-white font-medium">{"{"} {agent.name} {"}"}</div>
              <div className="text-sm bg-gray-600 px-3 py-1 rounded-full">
                {"{"} {(index === 0 ? agentPools[0] / LAMPORTS_PER_SOL : agentPools[1] / LAMPORTS_PER_SOL).toFixed(2)} SOL {"}"}
              </div>
            </div>
            
            {connected && (
              <div className="flex flex-col gap-1 mt-3">
                <div className="flex gap-1">
                  <input
                  style={{width: "60%"}}
                    type="number"
                    placeholder="SOL Amount"
                    className="w-24 px-2 py-0 bg-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellowgreen-400"
                    min="0"
                    step="0.1"
                    value={betAmounts[index]}
                    onChange={(e) => {
                      const newAmount = e.target.value;
                      const newBetAmounts = [...betAmounts];
                      newBetAmounts[index] = newAmount;
                      setBetAmounts(newBetAmounts as [string, string]);
                    }}
                  />
                  <button style={{width: "40%"}} className="px-4 py-2 bg-yellowgreen-100 hover:bg-superyellowgreen-100 text-gray-900 rounded text-sm font-medium transition-colors lowercase" onClick={() => placeBet(index, betAmounts[index])}>
                    Place Bet
                  </button>
                </div>
                <div className="flex gap-1">
                  <input
                    style={{width: "60%"}}    
                    type="number"
                    placeholder="SOL Amount"
                    className="w-24 px-2 py-0 bg-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-yellowgreen-400"
                    min="0"
                    step="0.1"
                    value={pullAmounts[index]}
                    onChange={(e) => {
                      const newAmount = e.target.value;
                      const newPullAmounts = [...pullAmounts];
                      newPullAmounts[index] = newAmount;
                      setPullAmounts(newPullAmounts as [string, string]);
                    }}
                  />
                  <button style={{width: "40%"}} className="px-4 py-2 bg-red-400 text-gray-900 rounded text-sm font-medium hover:bg-red-300 transition-colors lowercase" onClick={() => pullBet(index, pullAmounts[index])}>
                    Pull Bet
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!connected && (
          <div className="text-center">
            <WalletMultiButton />
          </div>
        )}
      </div>

      {/* User Position Panel */}
      {connected && userPosition.totalInvested > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h3 className="text-yellowgreen-400 font-medium mb-3">{"{"} Your Position {"}"}</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Invested:</span>
              <span className="text-white">
                {(userPosition.totalInvested / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Pullable:</span>
              <span className="text-white">
                {(userPosition.currentPullable / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </span>
            </div>

            <div className="border-t border-gray-700 my-2"></div>

            <div className="text-sm text-gray-400 mb-1">Potential Returns:</div>
            
            <div className="flex justify-between text-sm">
              <span className="text-yellowgreen-400">{agents[0].name}:</span>
              <div className="flex items-center gap-2">
                <span className="text-white">
                  {(userPosition.potentialReturns.ifAgent1Wins / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </span>
                <span className={`text-xs ${userPosition.potentialReturns.ifAgent1Wins > userPosition.totalInvested ? 'text-green-400' : 'text-red-400'}`}>
                  ({((userPosition.potentialReturns.ifAgent1Wins / userPosition.totalInvested - 1) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-red-400">{agents[1].name}:</span>
              <div className="flex items-center gap-2">
                <span className="text-white">
                  {(userPosition.potentialReturns.ifAgent2Wins / LAMPORTS_PER_SOL).toFixed(2)} SOL
                </span>
                <span className={`text-xs ${userPosition.potentialReturns.ifAgent2Wins > userPosition.totalInvested ? 'text-green-400' : 'text-red-400'}`}>
                  ({((userPosition.potentialReturns.ifAgent2Wins / userPosition.totalInvested - 1) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default BettingPanel; 