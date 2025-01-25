import type { Instruction } from './types';
import type { HandleStream } from './types';
import type { LatestInstruction } from './types';
import type { StreamInstruction } from './types';
import { INSTRUCTION_ENTITY_TYPE } from './types';
import { LATEST_STREAM_INSTRUCTION_TYPE } from './types';
import { STREAM_INSTRUCTION_TYPE } from './types';

export function createInstruction<
  TInstructionType extends symbol = symbol,
>(instructionType: TInstructionType): Instruction<TInstructionType> {
  return {
    entityType: INSTRUCTION_ENTITY_TYPE,
    instructionType,
  };
}

export function createStreamInstruction<
  TStreamInstructionType extends symbol = symbol,
>(streamInstructionType: TStreamInstructionType, handleStream: HandleStream): StreamInstruction<TStreamInstructionType> {
  return {
    ...createInstruction(STREAM_INSTRUCTION_TYPE),
    streamInstructionType,
    handleStream,
  };
}

export const latest: LatestInstruction = createStreamInstruction(LATEST_STREAM_INSTRUCTION_TYPE, () => {
  return null;
});
