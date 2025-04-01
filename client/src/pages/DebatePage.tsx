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

  // Initial fetch of pools when debate loads
  // useEffect(() => {
  //   if (debate?.solanaAddress) {
  //     fetchPools();
  //   }
  // }, [debate?.solanaAddress]);

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Verdict, Counter & Betting */}
        <div className="lg:w-1/3 w-full order-1">
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
            />
          </div>
        </div>

        {/* Right Column - Chat Interface */}
        <div className="lg:w-2/3 w-full order-2">
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
    </div>
  );
};

export default DebatePage; 