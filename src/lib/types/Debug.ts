import { Instruction } from './Instruction';
import { PipeState } from './PipeState';
import { Stream } from './Stream';
import { StreamGroup } from './StreamGroup';

export const DEBUG_INSTRUCTION = Symbol('DEBUG_INSTRUCTION');

export type DebugInstruction = Instruction<typeof DEBUG_INSTRUCTION> & {
  createDebugger: (displayName?: string) => Debugger;
};

export type Debugger = {
  onPipeCreate: (data: { pipeState: any }) => void;
  onParentPipeStream: (data: { parentPipeIndex: number, streamHead: symbol, stream: Stream, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamGroupFulfill: (data: { streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamRelease: (data: { streamHead: symbol, stream: Stream, pipeState: PipeState }) => void;
  onStreamGroupRelease: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamEmit: (data: { streamHead: symbol, value: any, pipeState: PipeState }) => void;
  onErrorEmit: (data: { streamHead: symbol, error: any, pipeState: PipeState }) => void;
};
