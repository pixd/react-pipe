import type { Instruction } from './types';
import type { HandleStream } from './types';
import type { StreamInstruction } from './types';
import { INSTRUCTION_ENTITY_TYPE } from './types';
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
>(streamInstructionType: TStreamInstructionType, createStreamHandler: () => HandleStream): StreamInstruction<TStreamInstructionType> {
  return {
    ...createInstruction(STREAM_INSTRUCTION_TYPE),
    streamInstructionType,
    createStreamHandler,
  };
}
