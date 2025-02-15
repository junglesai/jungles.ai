import mongoose from 'mongoose';

export interface IDebate extends mongoose.Document {
  title: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  threadId: string;
  messageLimit: number;
  totalPool: number;
  deployer: string;
  agents: Array<{
    name: string;
    stance: string;
    personality: string;
    _id: string;
  }>;
  messages: Array<{
    agentId: string;
    content: string;
    timestamp: Date;
    length: number;
    status: 'typing' | 'answered';
  }>;
  verdict?: {
    winner: string;
    explanation: string;
    timestamp: Date;
  };
  solanaAddress: string;
  signature: string;
  pool1: number;
  pool2: number;
  agent_a: string;
  bets: Array<{
    userAddress: string;
    agentIndex: number;
    amount: number;
    timestamp: Date;
  }>;
}

const debateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  totalPool: Number,
  deployer: String,
  agents: [{
    name: String,
    stance: String,
    personality: String,
  }],
  messages: [{
    agentId: String,
    content: String,
    timestamp: Date,
    length: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['typing', 'answered'],
      default: 'answered'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  agent_a: String,
  winner: {
    type: String,
    default: null,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: Date,
  threadId: String,
  messageLimit: {
    type: Number,
    required: true,
    validate: {
      validator: (v: number) => v % 2 === 0 && v > 0,
      message: 'Message limit must be a positive even number'
    },
    default: 100
  },
  verdict: {
    winner: String,
    explanation: String,
    timestamp: Date
  },
  solanaAddress: String,
  signature: String,
  pool1: { type: Number, default: 0 },
  pool2: { type: Number, default: 0 },
  bets: [{
    userAddress: String,
    agentIndex: Number,
    amount: Number,
    timestamp: { type: Date, default: Date.now }
  }]
});

debateSchema.statics.startDebateThread = async function(debateId: string) {
  const debate = await this.findById(debateId);
  if (!debate) {
    throw new Error('Debate not found');
  }

  if (debate.threadId) {
    return debate.threadId;
  }

  const { createDebateThread } = await import('../services/openai.js');
  
  const thread = await createDebateThread();
  
  debate.threadId = thread.id;
  await debate.save();
  
  return thread.id;
};

interface DebateModel extends mongoose.Model<any> {
  startDebateThread(debateId: string): Promise<string>;
}

export const Debate = mongoose.model<any, DebateModel>('Debate', debateSchema);

// Create indexes if they don't exist
const createIndexes = async () => {
  try {
    const indexes = await Debate.collection.getIndexes();
    const existingIndexes = Object.keys(indexes);

    if (!existingIndexes.includes('title_text')) {
      await Debate.collection.createIndex({ title: 'text' });
      console.log('Created text index for title');
    }

    if (!existingIndexes.includes('startTime_-1')) {
      await Debate.collection.createIndex({ startTime: -1 });
      console.log('Created index for startTime');
    }

    if (!existingIndexes.includes('messages.length_-1')) {
      await Debate.collection.createIndex({ 'messages.length': -1 });
      console.log('Created index for messages length');
    }

    if (!existingIndexes.includes('totalPool_-1')) {
      await Debate.collection.createIndex({ totalPool: -1 });
      console.log('Created index for totalPool');
    }

    if (!existingIndexes.includes('deployer_1')) {
      await Debate.collection.createIndex({ deployer: 1 });
      console.log('Created index for deployer');
    }
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

createIndexes();
