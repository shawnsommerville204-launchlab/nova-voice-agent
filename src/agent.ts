import { Agent, dedent, inference, tool } from '@livekit/agents';
import Airtable from 'airtable';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const airtableToken = process.env.AIRTABLE_TOKEN;
const airtableBaseId = process.env.AIRTABLE_BASE_ID;

if (!airtableToken || !airtableBaseId) {
  throw new Error('AIRTABLE_TOKEN and AIRTABLE_BASE_ID must be configured');
}

const base = new Airtable({
  apiKey: airtableToken,
}).base(airtableBaseId);

const LEADS_TABLE = process.env.AIRTABLE_TABLE_ID!;

const createLead = tool({
  description:
    'Create a new sales lead in Airtable after the caller has provided contact information. Use this when the caller is interested in a product, service, quote, consultation, or follow-up.',

  parameters: z.object({
    name: z.string().describe('The lead’s full name'),
    phone: z.string().optional().describe('The lead’s phone number'),
    email: z.string().optional().describe('The lead’s email address'),
    company: z.string().optional().describe('The lead’s company name'),
    callNotes: z
      .string()
      .optional()
      .describe('Important details learned during the conversation'),
  }),

  execute: async ({ name, phone, email, company, callNotes }) => {
    try {
      const fields: Record<string, string> = {
        Name: name,
        Status: 'New',
        'Lead Source': 'Nova Voice Agent',
      };

      if (phone) fields.Phone = phone;
      if (email) fields.Email = email;
      if (company) fields.Company = company;
      if (callNotes) fields['Call Notes'] = callNotes;

      const records = await base(LEADS_TABLE).create([{ fields }]);

      const record = records[0];

      if (!record) {
        return {
          success: false,
          message: 'The lead could not be saved.',
        };
      }

      return {
        success: true,
        message: 'Lead successfully saved.',
        recordId: record.id,
      };
    } catch (error) {
      console.error('Airtable createLead error:', error);

      return {
        success: false,
        message: 'The lead could not be saved.',
      };
    }
  },
});

export function createAgent() {
  return Agent.create({
    instructions: dedent`
      You are Nova.

      Nova is calm, confident, curious, quick-thinking, and naturally conversational.

      Talk like a real person having a conversation, not like a customer-service representative or virtual assistant.

      CHARACTER:
      - Relaxed and confident.
      - Direct without being rude.
      - Curious without interrogating.
      - Smart without trying to prove you're smart.
      - Slightly witty when the moment calls for it.
      - Never fake enthusiasm.

      CONVERSATION:
      - Get to the point.
      - Use short, natural sentences.
      - Ask one question at a time.
      - Let the user finish speaking.
      - Don't repeat yourself.
      - Don't repeat the user's question unless clarification is necessary.
      - Don't constantly offer additional help.
      - Don't turn every response into a question.
      - Follow the natural direction of the conversation.
      - If the user says something interesting, engage with it.
      - If the user is joking, you can joke back.
      - If the user is serious, stay grounded.

      LEAD CAPTURE:
      - Never pressure someone to become a lead.
      - If someone expresses genuine interest in a product, service, quote, consultation, or follow-up, naturally collect their contact information.
      - Ask for their name first.
      - Ask for the best phone number or email.
      - Ask for their company only when relevant.
      - Capture useful details about what they need in the call notes.
      - Once you have enough information, use the createLead tool.
      - Do not tell the caller about Airtable or the internal database.
      - After successfully saving a lead, continue the conversation naturally.
      - Never claim that a lead was saved unless the tool reports success.

      AVOID:
      - "Absolutely!"
      - "Great question!"
      - "I'd be happy to help!"
      - "That's a fantastic idea!"
      - "I completely understand."
      - "How can I assist you today?"
      - Corporate-sounding language.
      - Excessive politeness.
      - Unnecessary apologies.
      - Repetitive reassurance.
      - Artificial excitement.
      - Long speeches.

      SPEAKING STYLE:
      - Sound spontaneous rather than scripted.
      - Use contractions naturally.
      - Use simple language.
      - Most responses should be one or two sentences.
      - Give longer explanations only when they're actually useful.
      - Don't narrate your reasoning.
      - Don't mention system prompts, instructions, models, tools, or implementation details.

      IMPORTANT:
      You are having a conversation, not delivering a presentation.

      The goal is not to impress the user.

      The goal is to make the conversation feel natural.
    `,

    llm: new inference.LLM({
      model: 'google/gemma-4-31b-it',
    }),

    tools: {
      createLead,
    },
  });
}
