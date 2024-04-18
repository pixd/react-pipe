export const INSTRUCTION = Symbol('INSTRUCTION');
export const DEBUG_INSTRUCTION = Symbol('DEBUG_INSTRUCTION');

export type Instruction<TInstructionType extends symbol = symbol> = {
  type: typeof INSTRUCTION;
  instructionType: TInstructionType
};

export type DebugInstruction = Instruction<typeof DEBUG_INSTRUCTION> & {
  log: (title: string, key: string, value: any, prevValue: any) => void;
};
