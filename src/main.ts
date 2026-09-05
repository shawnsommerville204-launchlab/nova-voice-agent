import { ServerOptions, cli, defineAgent, inference, voice } from '@livekit/agents';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createAgent } from './agent.ts';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  entry: async (ctx) => {
    const session = new voice.AgentSession({
      stt: new inference.STT({
        model: 'assemblyai/universal-3-5-pro',
        language: 'en',
      }),

      tts: new inference.TTS({
        model: 'fishaudio/s2.1-pro',
        voice: '9a9cf47702da476aa4629e2506d4a857',
      }),

      turnHandling: {
        turnDetection: 'stt',

        endpointing: {
          minDelay: 1000,
          maxDelay: 4000,
        },

        interruption: {
          enabled: false,
        },

        preemptiveGeneration: {
          enabled: false,
        },
      },

      vad: null,
      expressive: false,
    });

    await session.start({
      agent: createAgent(),
      room: ctx.room,
      inputOptions: {
        audioEnabled: true,
        textEnabled: true,
        closeOnDisconnect: false,
      },
    });

    await ctx.connect();

    session.generateReply({
      instructions:
        "Say: Hello, you've reached Kyle Bailey Renovations. I'm Nova. I'd like to get a little information from you about your project, and ill pass that information down to Kyle. What are you looking to have done?",
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'my-voice-agent',
  }),
);
