import type { JSONSchema7 } from 'json-schema';

export const templateCreateSchema = {
  type: 'object',
  required: ['title', 'templateId'],
  properties: {
    title: { type: 'string', minLength: 1 },
    templateId: { type: 'string', minLength: 1 },
    templateBody: { type: 'string', nullable: true },
  },
  additionalProperties: false,
} as JSONSchema7;

