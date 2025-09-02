declare module 'yargs';
declare module 'yargs/helpers';

declare module 'prompts' {
  export type PromptObject = any;
  const prompts: (questions: any, options?: any) => Promise<any>;
  export default prompts;
}

