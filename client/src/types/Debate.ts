export interface Debate {
  _id: string;
  title: string;
  description: string;
  messageLimit: number;
  agents: {
    name: string;
    stance: string;
    personality: string;
    // assistantId: string;
  }[];
  messages: {
    id: string;
    name: string;
    agentId: string;
    content: string;
    timestamp: Date;
    status: 'typing' | 'answered';
  }[];
  status: string;
  verdict: {
    winner: string;
    explanation: string;
    timestamp: Date;
  };
  solanaAddress: string;
  pool1: number;
  pool2: number;
  totalPool: number;
  bets: Array<{
    userAddress: string;
    agentIndex: number;
    amount: number;
    timestamp: Date;
  }>;
} 