export const INSTRUCTION_ENTITY_TYPE = Symbol('INSTRUCTION_ENTITY_TYPE');

export type Instruction<
  TInstructionType extends symbol = symbol,
> = {
  entityType: typeof INSTRUCTION_ENTITY_TYPE;
  instructionType: TInstructionType;
};

export const STREAM_INSTRUCTION_TYPE = Symbol('STREAM_INSTRUCTION_TYPE');

export type StreamInstruction<
  TStreamInstructionType extends symbol = symbol,
> = Instruction<typeof STREAM_INSTRUCTION_TYPE> & {
  streamInstructionType: TStreamInstructionType;
  handleStream: HandleStream;
};

export type HandleStream = {
  (): void;
};

export const LATEST_STREAM_INSTRUCTION_TYPE = Symbol('LATEST_STREAM_INSTRUCTION_TYPE');

export type LatestInstruction = StreamInstruction<typeof LATEST_STREAM_INSTRUCTION_TYPE>;
