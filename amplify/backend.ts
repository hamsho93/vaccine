import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { vaccineApi } from './api/resource';

export const backend = defineBackend({
  auth,
  data,
  vaccineApi,
});