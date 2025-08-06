import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { vaccineParser } from './functions/vaccine-parser/resource';
import { vaccineCatchup } from './functions/vaccine-catchup/resource';

export const backend = defineBackend({
  auth,
  data,
  vaccineParser,
  vaccineCatchup,
});