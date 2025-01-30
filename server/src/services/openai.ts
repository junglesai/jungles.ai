import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ChatModel } from 'openai/resources/chat/index.mjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Agent {
  name: string;
  stance: string;
  personality: string;
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const examples = JSON.parse(
  readFileSync(join(__dirname, '../../examples.json'), 'utf-8')
);

export const createAssistant = async (agent: Agent) => {
  const assistant = await openai.beta.assistants.create({
    name: agent.name,
    instructions: `You are ${agent.name}, a debater with ${agent.personality} personality.
      Your stance is: ${agent.stance}.
      Engage in the debate professionally, staying true to your stance and personality.
      Keep responses concise and focused.`,
    model: process.env.DEBATE_MODEL as ChatModel
  });

  const newAssistant = {
    ...assistant,
    id: assistant.id,
    name: agent.name,
    stance: agent.stance,
    personality: agent.personality,
  }
  return newAssistant;
};

export const createDebateThread = async () => {
  return await openai.beta.threads.create();
};

export const generateResponse = async (
  threadId: string,
  assistantId: string,
  topic: string,
  previousMessage?: string
) => {
  try {
    // Check for active runs
    const runs = await openai.beta.threads.runs.list(threadId);
    const activeRun = runs.data.find(run => 
      ['in_progress', 'queued'].includes(run.status)
    );

    if (activeRun) {
      await openai.beta.threads.runs.cancel(threadId, activeRun.id);
    }

    if (previousMessage) {
      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: previousMessage
      });
    }

    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      instructions: `Continue the debate about: ${topic}. 
        Respond to the previous argument if there is one.
        Keep your response under 150 words.`
    });

    // Wait for completion with increased timeout
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    let attempts = 0;
    const maxAttempts = 60; // Increased to 60 seconds timeout
    const checkInterval = 2000; // Check every 2 seconds instead of 1

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      attempts++;
      
      if (runStatus.status === 'failed') {
        throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
      }
      if (runStatus.status === 'cancelled') {
        throw new Error('Run was cancelled');
      }
      if (runStatus.status === 'expired') {
        throw new Error('Run expired');
      }
    }

    if (attempts >= maxAttempts) {
      await openai.beta.threads.runs.cancel(threadId, run.id);
      throw new Error('Response generation timed out after 60 seconds');
    }

    const messages = await openai.beta.threads.messages.list(threadId);
    const content = messages.data[0].content[0];
    
    if (content.type === 'text') {
      return content.text.value;
    }
    throw new Error('Unexpected message content type');
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error; // Propagate the actual error
  }
}; 


export const removeThread = async (threadId: string) => {
  await openai.beta.threads.del(threadId);
};

export const createDebateUsingAssistant = async (prompt: string) => {
  try {
  const thread = await createDebateThread();
  const threadId = thread.id;
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.DEBATE_CREATOR_ID as string,
    instructions: prompt ? `Create a new debate topic: ${prompt}` : `Create a new debate topic.`
  });

      // Wait for completion with increased timeout
      let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
      let attempts = 0;
      const maxAttempts = 60; // Increased to 60 seconds timeout
      const checkInterval = 2000; // Check every 2 seconds instead of 1
  
      while (runStatus.status !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
        attempts++;
        
        if (runStatus.status === 'failed') {
          throw new Error(`Run failed: ${runStatus.last_error?.message || 'Unknown error'}`);
        }
        if (runStatus.status === 'cancelled') {
          throw new Error('Run was cancelled');
        }
        if (runStatus.status === 'expired') {
          throw new Error('Run expired');
        }
      }
  
      if (attempts >= maxAttempts) {
        await openai.beta.threads.runs.cancel(threadId, run.id);
        throw new Error('Response generation timed out after 60 seconds');
      }
  
      const messages = await openai.beta.threads.messages.list(threadId);
      const content = messages.data[0].content[0];
      if (content.type === 'text') {
        return content.text.value;
      }
      throw new Error('Unexpected message content type');
    } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error; // Propagate the actual error
  }
};

export const createDebate = async (prompt: string) => {
  const systemPrompt = `
You are a debate creator.
You create debates about general and actual topics or according to user prompt.
The debate title and description should be short and precise, just like the examples in these instructions.

Each debate has exact 2 agents with name, stance and personality, the name should be related to the debate topic and be short, for example for a debate on "AI Rights and Consciousness" the agent names would be something like:
TechnoRights and HumanFirst

Their stance should also be short and precise:
TechnoRights - Pro-AI rights
HumanFirst - Against AI rights

The debate title would be "AI Rights and Consciousness"
The debate description would be "Should AI systems be granted legal rights?"

The debate title should be very short and precise, for example: "Bitcoin vs Ethereum"
The debate description should be very short and precise, for example: "Which cryptocurrency is the better investment: Bitcoin or Ethereum?"

The personality of the agent should be a well in-depth description of the agent's personality in order to give it a unique identity, ton, slang, style and also cover the possibility of a topic which the agent might not be familiar with.
When a user prompt you with an idea or without an idea your job is to generate a short and precise debate according to this JSON schema examples:

${examples}`;

const userPrompt = prompt ? prompt : `Create a new debate topic.`;

const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: userPrompt }
];

const Debate = z.object({
  title: z.string(),
  description: z.string(),
  agent1: z.object({
    name: z.string(),
    stance: z.string(),
    personality: z.string(),
  }),
  agent2: z.object({
    name: z.string(),
    stance: z.string(),
    personality: z.string(),
  }),
});

  const debate = await openai.beta.chat.completions.parse({
    model: process.env.DEBATE_MODEL as ChatModel,
    messages: messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    })),
    temperature: 0.9,
    max_tokens: 1024,
    top_p: 0.7,
    frequency_penalty: 1.0,
    presence_penalty: 1.0,
    response_format: zodResponseFormat(Debate, "debate")
  });

  const response = debate.choices[0].message.parsed;
  return response;
};

export const generateResponseWithCompletion = async (
  topic: string,
  stance: string,
  personality: string,
  previousMessage?: string
) => {
  try {
    const systemPrompt = `You are a debater with ${personality} personality.
      Your stance is: ${stance}.
      Engage in the debate professionally, staying true to your stance and personality.
      Keep responses concise and under 150 words.`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Debate topic: ${topic}` }
    ];

    if (previousMessage) {
      messages.push({ role: "user", content: previousMessage });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.DEBATE_MODEL as string,
      messages: messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      })),
      temperature: 0.9,
      max_tokens: 1024,
      top_p: 0.7,
      frequency_penalty: 1.0,
      presence_penalty: 1.0,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
};
