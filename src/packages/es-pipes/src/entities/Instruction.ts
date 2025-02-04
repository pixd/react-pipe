import type { DataBarrel } from './DataBarrel';
import type { PipeState } from './Pipe';
import type { Stream } from './Stream';
import type { StreamGroup } from './StreamGroup';

export const INSTRUCTION_ENTITY_TYPE = Symbol('INSTRUCTION_ENTITY_TYPE');

export type Instruction<
  TInstructionType extends symbol = symbol,
> = {
  entityType: typeof INSTRUCTION_ENTITY_TYPE;
  instructionType: TInstructionType;
};

export const DISPLAY_NAME_INSTRUCTION_TYPE = Symbol('DISPLAY_NAME_INSTRUCTION_TYPE');

export type DisplayNameInstruction = Instruction<typeof DISPLAY_NAME_INSTRUCTION_TYPE> & {
  displayName: string;
};

export const DEBUG_INSTRUCTION_TYPE = Symbol('DEBUG_INSTRUCTION_TYPE');

export type DebugInstruction = Instruction<typeof DEBUG_INSTRUCTION_TYPE> & {
  createDebugger: CreateDebugger;
  displayName?: string;
};

export type CreateDebugger = {
  (displayName: string): Debugger;
};

export type Debugger = {
  onPipeCreate: (message: string, data: { pipeState: PipeState }) => void;
  onPipeEvent: (message: string, data: { stream?: Stream, dataBarrel?: DataBarrel, streamGroup?: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupCreate: (message: string, data: { parentPipeIndex?: number, stream?: Stream, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupEvent: (message: string, data: { parentPipeIndex?: number, stream?: Stream, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onEmit: (message: string, data: { dataBarrel: DataBarrel, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onDataBarrelEvent: (message: string, data: { dataBarrel: DataBarrel, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamEvent: (message: string, data: { stream: Stream, dataBarrel: DataBarrel, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onError: (error: Error, pipeState: PipeState) => void;
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
  (debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, stream: Stream): boolean;
};

export type HandleTerminateStream = {
  (debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, stream: Stream): boolean;
};

export const LATEST_INSTRUCTION_TYPE = Symbol('LATEST_INSTRUCTION_TYPE');

export type LatestInstruction = ControlInstruction<typeof LATEST_INSTRUCTION_TYPE>;

export const LEADING_INSTRUCTION_TYPE = Symbol('LEADING_INSTRUCTION_TYPE');

export type LeadingInstruction = ControlInstruction<typeof LEADING_INSTRUCTION_TYPE>;

export const ONCE_INSTRUCTION_TYPE = Symbol('ONCE_INSTRUCTION_TYPE');

export type OnceInstruction = ControlInstruction<typeof ONCE_INSTRUCTION_TYPE>;

export const FORK_INSTRUCTION_TYPE = Symbol('FORK_INSTRUCTION_TYPE');

export type ForkInstruction = ControlInstruction<typeof FORK_INSTRUCTION_TYPE>;
