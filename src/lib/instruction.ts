import { INSTRUCTION, Instruction } from './types';

export function createInstruction<
  TInstructionType extends symbol = symbol,
>(instructionType: TInstructionType): Instruction<TInstructionType> {
  return {
    type: INSTRUCTION,
    instructionType,
  };
}
