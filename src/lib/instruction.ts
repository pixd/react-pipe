import { INSTRUCTION_ENTITY_TYPE, STREAM_INSTRUCTION_TYPE, Instruction, HandleStream, StreamInstruction }
  from './types';

export function createInstruction<
  TInstructionType extends symbol = symbol,
>(instructionType: TInstructionType): Instruction<TInstructionType> {
  return {
    entityType: INSTRUCTION_ENTITY_TYPE,
    instructionType,
  };
}

export function createStreamInstruction(handleStream: HandleStream): StreamInstruction {
  return {
    ...createInstruction(STREAM_INSTRUCTION_TYPE),
    handleStream,
  };
}
