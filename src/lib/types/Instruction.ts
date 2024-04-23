export const INSTRUCTION = Symbol('INSTRUCTION');

export type Instruction<TInstructionType extends symbol = symbol> = {
  type: typeof INSTRUCTION;
  instructionType: TInstructionType
};
