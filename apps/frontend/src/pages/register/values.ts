import * as yup from 'yup';
import { sanitizeInput } from '@utils/security';

export const schema = yup.object().shape({
  username: yup
    .string()
    .transform((value) => sanitizeInput(value))
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .required('Username is required'),
  inviteCode: yup
    .array()
    .of(yup.string().required())
    .min(6, 'Invite code must be 6 characters')
    .max(6, 'Invite code must be 6 characters')
    .required('Invite code is required'),
});
