import { Debate } from '../models/Debate.js';
import { generateResponseWithCompletion } from './openai.js';

export const generateNextMessage = async (debateId: string, agent: { name: string, stance: string, personality: string }, lastMessage: { content: string }) => {
  const debate = await Debate.findById(debateId);
  if (!debate) throw new Error('Debate not found');

  // Convert debate messages to ChatGPT message format with proper roles
  const messageHistory = debate.messages.map((msg: { agentId: string, content: string }) => ({
    role: msg.agentId === agent.name ? 'assistant' : 'user',
    content: msg.content
  }));


  const response = await generateResponseWithCompletion(
    debate.title,
    agent.stance,
    agent.personality,
    messageHistory,
    messageHistory.length === 0 // Pass isFirstMessage flag
  );
  return response;
};


export const clearThread = async (debateId: string) => {
  await Debate.findOneAndUpdate({ _id: debateId }, { $set: { messages: [], threadId: null } });
};