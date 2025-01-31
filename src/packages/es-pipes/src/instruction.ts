import type { Instruction } from './entities';
import type { HandleStream } from './entities';
import type { StreamInstruction } from './entities';
import { INSTRUCTION_ENTITY_TYPE } from './entities';
import { STREAM_INSTRUCTION_TYPE } from './entities';

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
