import { Debate } from '../models/Debate.js';
import { generateResponseWithCompletion } from './openai.js';

export const generateNextMessage = async (debateId: string, agent: { name: string, stance: string, personality: string }, lastMessage: { content: string }) => {
  const debate = await Debate.findById(debateId);
  if (!debate) throw new Error('Debate not found');

  const response = await generateResponseWithCompletion(
    debate.title,
    agent.stance,
    agent.personality,
    lastMessage?.content
  );
  return response;
};


export const clearThread = async (debateId: string) => {
  await Debate.findOneAndUpdate({ _id: debateId }, { $set: { messages: [], threadId: null } });
};