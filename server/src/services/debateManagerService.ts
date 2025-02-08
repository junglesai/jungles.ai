import { EventEmitter } from 'events';
import { Debate, IDebate } from '../models/Debate.js';
import { generateNextMessage } from '../services/debateService.js'; // Your existing agent service
import { createDebateThread, generateResponse } from '../services/openai.js';
import { finalizeDebate } from './programService.js';

class DebateManager extends EventEmitter {
  private activeDebates: Map<string, NodeJS.Timeout>;

  constructor() {
    super();
    this.activeDebates = new Map();
  }

  async startDebate(debateId: string) {
    try {
      const debate = await Debate.findById(debateId);
      if (!debate) throw new Error('Debate not found');

      debate.status = 'active';
      await debate.save();
      this.continueDebate(debateId);
      
      return { success: true, message: 'Debate started successfully' };
    } catch (error) {
      console.error('Error starting debate:', error);
      return { success: false, message: 'Failed to start debate' };
    }
  }

  async pauseDebate(debateId: string) {
    try {
      const debate = await Debate.findById(debateId);
      if (!debate) throw new Error('Debate not found');

      // Clear the timeout for this debate
      const timeout = this.activeDebates.get(debateId);
      if (timeout) {
        clearTimeout(timeout);
        this.activeDebates.delete(debateId);
      }

      // Update debate status
      debate.status = 'paused';
      await debate.save();

      return { success: true, message: 'Debate paused successfully' };
    } catch (error) {
      console.error('Error pausing debate:', error);
      return { success: false, message: 'Failed to pause debate' };
    }
  }

   async continueDebate(debateId: string) {
    try {
      const debate = await Debate.findById(debateId);
      if (!debate || debate.status === 'paused' || debate.status === 'completed') return;

      // Check if there's a typing message
      const hasTypingMessage = debate.messages.some((msg: { status: string }) => msg.status === 'typing');
      if (hasTypingMessage && debate.messages[debate.messages.length - 1].timestamp > new Date(Date.now() - 45000)) {
        return;
      } 
        
      // Check if message limit reached
      if (debate.messages.filter((m: { status: string }) => m.status === 'answered').length >= debate.messageLimit) {
        await this.generateVerdict(debate);
        debate.status = 'completed';
        await debate.save();
        return;
      }

      // Get the next agent using last answered message
      const agents = debate.agents;
      const lastMessage = debate.messages.filter((m: { status: string }) => m.status === 'answered').pop();
      const lastAgent = lastMessage?.agentId;
      const nextAgent = agents.find((agent: { name: string }) => agent.name !== lastAgent) || agents[0];

      // Add typing message first
      const typingMessage = {
        agentId: nextAgent.name,
        content: '',
        timestamp: new Date(),
        status: 'typing'
      };
      debate.messages.push(typingMessage);
      await debate.save();

      if (debate.messages.length > 1) {
        const delay = parseInt(process.env.VITE_DEBATE_DELAY || '10000');
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.emit('newMessage', { debateId, message: typingMessage });

      // Generate response
      const response = await generateNextMessage(debateId, nextAgent, lastMessage);

      // Update the message with the response
      const messageIndex = debate.messages.length - 1;
      const answeredMessage = {
        agentId: nextAgent.name,
        content: response,
        timestamp: new Date(),
        status: 'answered'
      };
      debate.messages[messageIndex] = answeredMessage;
      debate.messages.length++;
      const timer = 1000;
      await debate.save().then(() => {
        this.emit('newMessage', { debateId, message: answeredMessage });
        
        // Schedule next message only after save and emit
            const timeout = setTimeout(() => {
            this.continueDebate(debateId);
            }, timer);
        
        this.activeDebates.set(debateId, timeout);
      });

    } catch (error) {
      console.error('Error in debate continuation:', error);
    }
  }

  private async generateVerdict(debate: IDebate) {
    try {
      // Format all debate messages for the judge
      const debateHistory = debate.messages.map((msg: { agentId: string; content: string })  => 
        `${msg.agentId}: ${msg.content}`
      ).join('\n\n');

      const newThread = await createDebateThread();
      const response = await generateResponse(
        newThread.id,
        process.env.JUDGE_ASSISTANT_ID!,
        debate.title,
        `Here is the complete debate:\n\n${debateHistory}\n\nPlease analyze this debate and determine the winner with explanation.`
      );

      // Parse the verdict response
      const verdict = JSON.parse(response);
      debate.verdict = {
        winner: verdict.winner,
        explanation: verdict.explanation,
        timestamp: new Date()
      };

      await finalizeDebate(debate.solanaAddress, verdict.winner);
      
      await debate.save();
      this.emit('verdictGenerated', { debateId: debate._id, verdict: debate.verdict });
    } catch (error) {
      console.error('Error generating verdict:', error);
    }
  }
}

export const debateManager = new DebateManager(); 