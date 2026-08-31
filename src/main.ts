import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import {
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from '@livekit/agents';
import { fileURLToPath } from 'node:url';
import { createAgent } from './agent.ts';

export default defineAgent({
  entry: async (ctx) => {
    console.log('NOVA STARTING');

    await ctx.connect();

    console.log('NOVA CONNECTED');

    const session = new voice.AgentSession({
      llm: new inference.LLM({
        model: 'google/gemma-4-31b-it',
      }),
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
    });

    console.log('NOVA SESSION ACTIVE');

    await session.generateReply({
      instructions:
        'Greet the caller naturally and ask how you can help them today.',
    });

    console.log('NOVA INITIAL GREETING SENT');
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'my-voice-agent',
  }),
);
