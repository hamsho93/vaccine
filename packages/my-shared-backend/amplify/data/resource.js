import { a, defineData } from '@aws-amplify/backend';
const schema = a.schema({
    // Optional: If you want to store vaccine history
    VaccineHistory: a.model({
        sessionId: a.string(),
        rawData: a.string(),
        structuredData: a.json(),
        processingNotes: a.string().array(),
        cdcVersion: a.string(),
    }).authorization(allow => [allow.guest()]),
});
export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'identityPool',
    },
});
