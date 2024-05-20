export const INSTRUCTION_ENTITY_TYPE = Symbol('INSTRUCTION_ENTITY_TYPE');

export type Instruction<
  TInstructionType extends symbol = symbol,
> = {
  entityType: typeof INSTRUCTION_ENTITY_TYPE;
  instructionType: TInstructionType;
};

export const STREAM_INSTRUCTION_TYPE = Symbol('STREAM_INSTRUCTION_TYPE');

export type StreamInstruction = Instruction<typeof STREAM_INSTRUCTION_TYPE> & {
  handleStream: HandleStream;
};

export type HandleStream = {
  (): void;
};
