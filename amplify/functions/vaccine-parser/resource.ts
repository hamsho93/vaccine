import { defineFunction } from '@aws-amplify/backend';

export const vaccineParser = defineFunction({
  name: 'vaccine-parser',
  entry: './handler.ts',
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  },
});