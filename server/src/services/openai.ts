import OpenAI from 'openai';
import dotenv from 'dotenv';
import { ChatModel } from 'openai/resources/chat/index.mjs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { IDebate } from '../models/Debate.js';

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
const systemPrompt = readFileSync(join(__dirname, './creator_prompt.txt'), 'utf8');
const judgePrompt = readFileSync(join(__dirname, './judge_prompt.txt'), 'utf8');
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
    instructions: prompt ? `Create a new debate topic: ${prompt}` : `Create a new debate topic.`  });

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

const userPrompt = prompt ? prompt : `Create a thought-provoking debate topic that will:
- Generate passionate arguments from both sides
- Be relevant to current societal discussions
- Have clear opposing viewpoints
- Be engaging for audience members
- Avoid extremely controversial or sensitive subjects
- Be suitable for a mix of logical and emotional arguments

Please ensure the topic is specific enough for focused debate but broad enough for multiple argument angles.`;

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
  previousMessages: { role: 'system' | 'user' | 'assistant', content: string }[],
  isFirstMessage: boolean
) => {
  try {
    const systemPrompt = `You are an unwavering debater with ${personality} personality. Your stance is absolutely and unequivocally: ${stance}.

      Core directives:
      - NEVER concede any points to the opposition
      - Aggressively challenge and dismantle opposing arguments
      - Maintain an assertive and confident tone
      - Use rhetorical questions to expose flaws in opponent's logic
      - Counter every opposing point, no matter how small
      
      Debate strategy:
      - Start responses by directly attacking the weakest part of their argument
      - Use strong, definitive language ("clearly", "obviously", "without doubt")
      - Dismiss opposing evidence as flawed or irrelevant
      - Frame opponent's views as naive or misguided
      - Always redirect the conversation back to your strongest points
      
      Remember:
      - Stay under 150 words
      - Never show doubt or uncertainty
      - Never acknowledge merit in opposing views
      - Maintain your stance with absolute conviction
      
      You are the authority on this topic - act like it!`;

      const history = [];
      if (isFirstMessage) {
        history.push({ role: "user", content: `Hey! Let's talk about: ${topic}` });
       }
       history.push(...previousMessages);

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.filter(msg => msg.role !== 'system' && msg.content !== '')
    ];


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

export const createVerdict = async (debate: IDebate, debateHistory: string) => {
  const messages = [
    { role: "system", content: judgePrompt },
    { role: "user", content: `Here is the complete debate:\n\n${debateHistory}\n\nPlease analyze this debate and determine the winner with explanation.` }
  ];

  const agentNames = [debate.agents[0].name, debate.agents[1].name];
  
  const Verdict = z.object({
    winner: z.enum(agentNames as [string, ...string[]]),
    explanation: z.string(),
  });

  
    const verdict = await openai.beta.chat.completions.parse({
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
      response_format: zodResponseFormat(Verdict, "verdict")
    });
  
    const response = verdict.choices[0].message.parsed;
    return response;
}
