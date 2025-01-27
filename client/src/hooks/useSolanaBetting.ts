import { useState, useEffect } from 'react';
import axios from 'axios';

interface Agent {
  name: string;
  stance: string;
  personality: string;
}

interface Debate {
  _id: string;
  agents: Agent[];
}

export const useSolanaBetting = (debateId: string) => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const response = await axios.get<Debate>(`/api/debates/${debateId}`);
        setAgents(response.data.agents);
      } catch (error) {
        console.error('Error fetching debate agents:', error);
      }
    };

    fetchDebate();
  }, [debateId]);

  const placeBet = async (agentName: string, amount: number) => {
    setLoading(true);
    try {
      // Implement betting logic here
      await axios.post(`/api/debates/${debateId}/bets`, {
        agentName,
        amount
      });
    } catch (error) {
      console.error('Error placing bet:', error);
    } finally {
      setLoading(false);
    }
  };

  return { placeBet, loading, agents };
}; 