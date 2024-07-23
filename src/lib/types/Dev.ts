import { Instruction } from './Instruction';
import { PipeState } from './PipeState';
import { Stream } from './Stream';
import { StreamGroup } from './StreamGroup';

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
  onStreamGroupCreate: (message: string, data: { streamHead: symbol, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupEvent: (message: string, data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onEmit: (message: string, data: { streamHead: symbol, value: any, valueType: 'data' | 'error', finally: boolean, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamEvent: (message: string, data: { streamHead: symbol, stream?: Stream, parentPipeIndex?: number, parentPipeUniqKey?: symbol, pipeState: PipeState }) => void;
};
