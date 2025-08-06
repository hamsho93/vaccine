import { defineFunction } from '@aws-amplify/backend';

export const vaccineCatchup = defineFunction({
  name: 'vaccine-catchup',
  entry: './handler.ts',
});