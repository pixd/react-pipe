import type { PipeState } from './types';

export class LibLogicError extends Error {
  constructor(message: string, pipeState: PipeState) {
    super(message + '. See pipe state above.');
    console.error(pipeState);
  }
}

export class UserLogicError extends Error {}
