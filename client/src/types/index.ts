export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  balance: number;
} 

interface Verdict {
  winner: string;
  explanation: string;
  timestamp: Date;
}

interface Debate {
  verdict?: Verdict;
  status: string;
  agents: Array<{ name: string; stance: string }>;
  messages: Array<{ status: string }>;
  messageLimit: number;
} 