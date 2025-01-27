import { useState } from 'react';
import { Debate } from '../types/Debate';
import { Message } from '../types/Message';

export const useDebate = () => {
  const [debate, setDebate] = useState<Debate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const startMessageStream = async (debateId: string) => {
    try {
      const response = await fetch(`/api/debates/${debateId}/messages`, {
        method: 'POST',
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const events = text.split('\n\n').filter(Boolean);

        for (const event of events) {
          const data = JSON.parse(event.replace('data: ', ''));
          
          if (data.type === 'debate') {
            setDebate(data.debate);
          } else if (data.type === 'message') {
            setMessages(prev => [...prev, data.message]);
          }
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDebate = async (debateId: string) => {
    try {
      const response = await fetch(`/api/debates/${debateId}/messages`);
      const data = await response.json();
      setDebate(data);
      setMessages(data.messages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching debate:', error);
      setLoading(false);
    }
  }

  return { messages, debate, loading, startMessageStream, getDebate };
}; 