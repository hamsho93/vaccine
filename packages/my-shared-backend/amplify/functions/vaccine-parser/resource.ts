import { defineFunction } from '@aws-amplify/backend';

export const vaccineParser = defineFunction({
  name: 'vaccine-parser',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 1024,
});