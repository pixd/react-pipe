import type { Debugger } from './Dev';
import type { PipeState } from './Pipe';
import type { Stream } from './Stream';

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
  createStreamHandler: () => HandleStream;
};

export type HandleStream = {
  (debug: null | Debugger, pipeState: PipeState, stream: Stream): boolean;
};

export const LATEST_STREAM_INSTRUCTION_TYPE = Symbol('LATEST_STREAM_INSTRUCTION_TYPE');

export type LatestInstruction = StreamInstruction<typeof LATEST_STREAM_INSTRUCTION_TYPE>;

export const LEADING_STREAM_INSTRUCTION_TYPE = Symbol('LEADING_STREAM_INSTRUCTION_TYPE');

export type LeadingInstruction = StreamInstruction<typeof LEADING_STREAM_INSTRUCTION_TYPE>;

export const ONCE_STREAM_INSTRUCTION_TYPE = Symbol('ONCE_STREAM_INSTRUCTION_TYPE');

export type OnceInstruction = StreamInstruction<typeof ONCE_STREAM_INSTRUCTION_TYPE>;
