import type { DataBarrel } from './DataBarrel';
import type { Instruction } from './Instruction';
import type { PipeState } from './PipeState';
import type { Stream } from './Stream';
import type { StreamGroup } from './StreamGroup';

export const DISPLAY_NAME_INSTRUCTION_TYPE = Symbol('DISPLAY_NAME_INSTRUCTION_TYPE');

export type DisplayNameInstruction = Instruction<typeof DISPLAY_NAME_INSTRUCTION_TYPE> & {
  displayName: string;
};

export type CreateDebugger = {
  (displayName: string): Debugger;
};

export const DEBUG_INSTRUCTION_TYPE = Symbol('DEBUG_INSTRUCTION_TYPE');

export type DebugInstruction = Instruction<typeof DEBUG_INSTRUCTION_TYPE> & {
  createDebugger: CreateDebugger;
  displayName?: string;
};

export type Debugger = {
  onPipeCreate: (message: string, data: { pipeState: PipeState }) => void;
  onPipeEvent: (message: string, data: { pipeState: PipeState }) => void;
  // TODO Можно ли обойтись без papa?
  onStreamGroupCreate: (message: string, data: { papa: symbol, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  // TODO Можно ли обойтись без необязательных параметров?
  onStreamGroupEvent: (message: string, data: { papa?: symbol, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onEmit: (message: string, data: { papa: symbol, dataBarrel: DataBarrel, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  // TODO Можно ли обойтись без необязательных параметров?
  onStreamEvent: (message: string, data: { stream: Stream, streamGroup: StreamGroup, parentPipeIndex?: number, parentPipeUniqKey?: symbol, pipeState: PipeState }) => void;
};
