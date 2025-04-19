import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import { useDebate } from '../hooks/useDebate';
import BettingPanel from '../components/BettingPanel';
import MessageCounter from '../components/MessageCounter';
import DebateVerdict from '../components/DebateVerdict';
import { Debate } from '../types/Debate';
import { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

const DebatePage = () => {
  const { id } = useParams();
  const { debate, loading, getDebate } = useDebate();
  const [error, setError] = useState<string | null>(null);
  const [isBettingOpen, setIsBettingOpen] = useState(false);
  const [messages, setMessages] = useState<Debate['messages']>([]);
  const [poolSize, setPoolSize] = useState(0);
  const [isPoolUpdated, setIsPoolUpdated] = useState(false);
  const [agentPools, setAgentPools] = useState<[number, number]>([0, 0]);
  const [verdict, setVerdict] = useState<Debate['verdict'] | null>(null);
  const { connected, publicKey } = useWallet();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [userPosition, setUserPosition] = useState<{
    amountOnA: number;
    amountOnB: number;
    totalInvested: number;
    potentialReturns: {
      ifAgent1Wins: number;
      ifAgent2Wins: number;
    };
    currentPullable: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      getDebate(id);
    }
  }, [id]);

  const fetchPools = async () => {
    if (!debate?.solanaAddress) return;
    
    try { 
      const mode = import.meta.env.VITE_MODE;
      const connection = new Connection(mode === 'dev' ? import.meta.env.VITE_SOLANA_DEVNET_RPC_URL : import.meta.env.VITE_SOLANA_MAINNET_RPC_URL);
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
      
      setIsPoolUpdated(true);
      setAgentPools([Number(pool1), Number(pool2)]);
      setPoolSize(Number(pool1) + Number(pool2));
      
      // Reset pool update animation after 1 second
      setTimeout(() => {
        setIsPoolUpdated(false);
      }, 1000);
      
      console.log('Pools updated:', { pool1: Number(pool1), pool2: Number(pool2), total: Number(pool1) + Number(pool2) });
    } catch (error) {
      console.error('Error fetching pools:', error);
    }
  };

  useEffect(() => {
    setVerdict(debate?.verdict || null);
  }, [debate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const calculateUserPosition = async () => {
    if (!publicKey || !debate?.solanaAddress) return;
    
    try {
      const mode = import.meta.env.VITE_MODE;
      const connection = new Connection(mode === 'dev' ? import.meta.env.VITE_SOLANA_DEVNET_RPC_URL : import.meta.env.VITE_SOLANA_MAINNET_RPC_URL);
      
      const [userBetAccount] = await PublicKey.findProgramAddress(
        [
          Buffer.from("user_bet"),
          new PublicKey(debate.solanaAddress).toBuffer(),
          publicKey.toBuffer(),
        ],
        new PublicKey(import.meta.env.VITE_SOLANA_PROGRAM_ID)
      );

      const accountInfo = await connection.getAccountInfo(userBetAccount);
      if (!accountInfo) return;

      // Skip 8 bytes discriminator
      const data = accountInfo.data;
      const amountOnA = Number(data.readBigUInt64LE(8));
      const amountOnB = Number(data.readBigUInt64LE(16));

      const totalInvested = amountOnA + amountOnB;

      // Get pool data for calculating potential returns
      const debateAccount = new PublicKey(debate.solanaAddress);
      const debateInfo = await connection.getAccountInfo(debateAccount);
      
      if (!debateInfo) return;

      // Skip 8 bytes discriminator + 64 bytes for agent pubkeys
      const debateData = debateInfo.data;
      const pool1 = Number(debateData.readBigUInt64LE(8 + 64));
      const pool2 = Number(debateData.readBigUInt64LE(8 + 64 + 8));
      const totalPool = pool1 + pool2;

      // Calculate potential returns
      const potentialIfAWins = amountOnA > 0 
        ? (amountOnA * totalPool) / pool1
        : 0;

      const potentialIfBWins = amountOnB > 0 
        ? (amountOnB * totalPool) / pool2
        : 0;

      // Calculate winning amount based on verdict
      let winningAmount = totalInvested;
      if (verdict?.winner) {
        const winner = agents.find(agent => agent.name.toLowerCase() === verdict.winner.toLowerCase());
        if (winner) {
          if (winner.name === agents[0].name) {
            winningAmount = potentialIfAWins;
          } else {
            winningAmount = potentialIfBWins;
          }
        }
      }

      setUserPosition({
        amountOnA,
        amountOnB,
        totalInvested,
        potentialReturns: {
          ifAgent1Wins: Math.floor(Number(potentialIfAWins)),
          ifAgent2Wins: Math.floor(Number(potentialIfBWins))
        },
        currentPullable: verdict?.winner ? Math.floor(Number(winningAmount)) : totalInvested
      });
    } catch (error) {
      console.error('Error calculating position:', error);
    }
  };

  useEffect(() => {
    if (connected && publicKey && debate?.solanaAddress) {
      calculateUserPosition();
    }
  }, [connected, publicKey, debate?.solanaAddress, poolSize]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellowgreen-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-400">{error}</div>
    </div>
  );

  // Example of how to structure the agents
  const agents = debate?.agents.map(agent => ({
    _id: agent._id, 
    name: agent.name,
    stance: agent.stance,
  })) || [];

  // Handler to receive user position from BettingPanel
  const handleUpdateUserPosition = (position: {
    amountOnA: number;
    amountOnB: number;
    totalInvested: number;
    potentialReturns: {
      ifAgent1Wins: number;
      ifAgent2Wins: number;
    };
    currentPullable: number;
  }) => {
    setUserPosition(position);
  };

  return (
    <div className="container mx-auto px-4 py-4 max-w-7xl flex flex-col">
      <div className="flex flex-col lg:flex-row gap-0 mb-4 bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-700">
        {/* Left Column - Verdict, Counter & Betting */}
        <div className="lg:w-1/3 w-full order-1 lg:h-[calc(100vh-130px)] overflow-auto border-r border-gray-700">
          <div className="p-4">
            <DebateVerdict verdict={verdict} />
            <MessageCounter 
              currentCount={messages?.filter(m => m?.status === 'answered').length}
              messageLimit={debate?.messageLimit || 0}
            />
            
            {/* Mobile Betting Toggle */}
            <button 
              onClick={() => setIsBettingOpen(!isBettingOpen)}
              className="lg:hidden w-full p-4 bg-gray-800 rounded-lg mb-4 flex items-center justify-between"
            >
              <span className="text-gray-200">{"{"} Betting Panel {"}"}</span>
              <svg 
                className={`w-5 h-5 text-gray-400 transform transition-transform ${isBettingOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div className={`${!isBettingOpen ? 'hidden lg:block' : ''}`}>
              <BettingPanel 
                debateId={id || ''} 
                agents={agents} 
                status={debate?.status || ''} 
                onPoolsUpdate={fetchPools}
                poolSize={poolSize}
                isPoolUpdated={isPoolUpdated}
                agentPools={agentPools}
                setPoolSize={setPoolSize}
                setAgentPools={setAgentPools}
                verdict={verdict || { winner: '', timestamp: '', explanation: '' }}
                hideUserPosition={!isMobile}
                onUpdateUserPosition={handleUpdateUserPosition}
                userPosition={userPosition}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Chat Interface */}
        <div className="lg:w-2/3 w-full order-2 lg:h-[calc(100vh-130px)] h-[85vh]">
          <ChatInterface 
            messages={messages} 
            setMessages={setMessages}
            debate={debate} 
            fetchPools={fetchPools}
            poolSize={poolSize}
            isPoolUpdated={isPoolUpdated}
            agentPools={agentPools}
            setVerdict={setVerdict}
            verdict={verdict}
          />
        </div>
      </div>
      
      {/* User Position Panel - Below both columns (desktop only) */}
      {connected && userPosition && userPosition.totalInvested > 0 && (
        <div className="hidden lg:block w-full bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
          <h3 className="text-yellowgreen-400 font-medium mb-3 lowercase">{"{"} Your Position {"}"}</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col">  
              <span className="text-gray-400 text-sm">{"{{"} {agents[0].name} {"}}"}</span>
              <span className="text-white font-medium mt-2">
                {(userPosition.amountOnA / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </span>
            </div>

            <div className="flex flex-col">  
              <span className="text-gray-400 text-sm">{"{{"} {agents[1].name} {"}}"}</span>
              <span className="text-white font-medium mt-2">
                {(userPosition.amountOnB / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </span>
            </div>

            <div className="flex flex-col">  
              <span className="text-gray-400 text-sm lowercase">{"{{"} Total Invested {"}}"}</span>
              <span className="text-white font-medium mt-2">
                {(userPosition.totalInvested / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-gray-400 text-sm lowercase">{"{{"} Current Pullable {"}}"}</span>
              <span className="text-white font-medium mt-2">
                {Math.floor(userPosition.currentPullable / LAMPORTS_PER_SOL * 100) / 100} SOL
              </span>
            </div>
            
            <div className="col-span-4 border-t border-gray-700 my-2"></div>
            
            <div className="col-span-4">
              <h3 className="text-yellowgreen-400 text-base font-medium mb-3 lowercase">{"{{"} Potential Returns {"}}"}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${verdict?.winner && verdict.winner.toLowerCase() === agents[0].name.toLowerCase() ? 'text-yellowgreen-400' : ''}`}>
                      {agents[0].name} {verdict?.winner && verdict.winner.toLowerCase() === agents[0].name.toLowerCase() ? '👑' : "wins"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${userPosition.potentialReturns.ifAgent1Wins > userPosition.totalInvested ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {Math.floor((userPosition.potentialReturns.ifAgent1Wins / userPosition.totalInvested - 1) * 100)}%
                    </span>
                  </div>
                  <div className={`text-right font-mono text-lg ${verdict?.winner && verdict.winner.toLowerCase() !== agents[0].name.toLowerCase() ? 'line-through text-gray-500' : 'text-white'}`}>
                    {Math.floor(userPosition.potentialReturns.ifAgent1Wins / LAMPORTS_PER_SOL * 10000) / 10000} SOL
                  </div>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${verdict?.winner && verdict.winner.toLowerCase() === agents[1].name.toLowerCase() ? 'text-yellowgreen-400' : ''}`}>
                      {agents[1].name} {verdict?.winner && verdict.winner.toLowerCase() === agents[1].name.toLowerCase() ? '👑' : "wins"}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${userPosition.potentialReturns.ifAgent2Wins > userPosition.totalInvested ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {Math.floor((userPosition.potentialReturns.ifAgent2Wins / userPosition.totalInvested - 1) * 100)}%
                    </span>
                  </div>
                  <div className={`text-right font-mono text-lg ${verdict?.winner && verdict.winner.toLowerCase() !== agents[1].name.toLowerCase() ? 'line-through text-gray-500' : 'text-white'}`}>
                    {Math.floor(userPosition.potentialReturns.ifAgent2Wins / LAMPORTS_PER_SOL * 10000) / 10000} SOL
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-4 text-right mt-2">
              <span className="text-gray-400 text-xs">{"{{"} 1% fee will be sent to debate creator {"}}"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebatePage; 