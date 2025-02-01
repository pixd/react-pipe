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

export const CONTROL_INSTRUCTION_TYPE = Symbol('CONTROL_INSTRUCTION_TYPE');

export type ControlInstruction<
  TControlInstructionType extends symbol = symbol,
> = Instruction<typeof CONTROL_INSTRUCTION_TYPE> & {
  controlInstructionType: TControlInstructionType;
  createStreamEmitHandler?: () => HandleEmitStream;
  createStreamTerminateHandler?: () => HandleTerminateStream;
};

export type HandleEmitStream = {
  (debug: null | Debugger, pipeState: PipeState, stream: Stream): boolean;
};

export type HandleTerminateStream = {
  (debug: null | Debugger, pipeState: PipeState, stream: Stream): boolean;
};

export const LATEST_INSTRUCTION_TYPE = Symbol('LATEST_INSTRUCTION_TYPE');

export type LatestInstruction = ControlInstruction<typeof LATEST_INSTRUCTION_TYPE>;

export const LEADING_INSTRUCTION_TYPE = Symbol('LEADING_INSTRUCTION_TYPE');

export type LeadingInstruction = ControlInstruction<typeof LEADING_INSTRUCTION_TYPE>;

export const ONCE_INSTRUCTION_TYPE = Symbol('ONCE_INSTRUCTION_TYPE');

export type OnceInstruction = ControlInstruction<typeof ONCE_INSTRUCTION_TYPE>;

export const FORK_INSTRUCTION_TYPE = Symbol('FORK_INSTRUCTION_TYPE');

export type ForkInstruction = ControlInstruction<typeof FORK_INSTRUCTION_TYPE>;
