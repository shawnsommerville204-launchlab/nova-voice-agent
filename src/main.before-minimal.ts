import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createAgent } from './agent.ts';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx) => {
    console.log('NOVA: entry started');

    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: 'assemblyai/universal-3-5-pro',
        language: 'en',
      }),

      tts: new inference.TTS({
        model: 'fishaudio/s2.1-pro',
        voice: '9a9cf47702da476aa4629e2506d4a857',
      }),
    });

    console.log('NOVA: session created');

    await session.start({
      agent: createAgent(),
      room: ctx.room,
    });

    console.log('NOVA: session started');

    await ctx.connect();

    console.log('NOVA: connected');

    session.generateReply({
      instructions: "Say: Hey, I'm Nova. What are you working on?",
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'my-voice-agent',
  }),
);
