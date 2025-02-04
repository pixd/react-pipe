import type { DebugInstruction } from '../entities';
import { createDebugInstruction } from '../instruction';
import { createDebugger } from './createDebugger';

export type ExtendedDebugInstruction = DebugInstruction & {
  (displayName: string): DebugInstruction;
};

export const extendedDebugInstruction = Object.assign(
  (displayName: string): DebugInstruction => {
    return createDebugInstruction(createDebugger, displayName);
  },
  createDebugInstruction(createDebugger),
) as ExtendedDebugInstruction;
