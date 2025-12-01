import { defineFunction } from '@aws-amplify/backend';
export const vaccineApi = defineFunction({
    name: 'vaccine-api',
    entry: './handler.ts',
    timeoutSeconds: 60,
    memoryMB: 1024,
});
