import { Instruction } from './Instruction';
import { PipeState } from './PipeState';
import { Stream } from './Stream';
import { StreamGroup } from './StreamGroup';

export const DEBUG_INSTRUCTION_TYPE = Symbol('DEBUG_INSTRUCTION_TYPE');

export type DebugInstruction = Instruction<typeof DEBUG_INSTRUCTION_TYPE> & {
  createDebugger: (displayName: string) => Debugger;
};

export type Debugger = {
  onPipeCreate: (data: { pipeState: PipeState }) => void;
  onPipeCancel: (data: { pipeState: PipeState }) => void;
  onPipeCanceled: (data: { prevPipeState: PipeState, pipeState: PipeState }) => void;
  onMountStream: (data: { streamHead: symbol, streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onParentPipeStream: (data: { parentPipeIndex: number, streamHead: symbol, stream: Stream, streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onParentPipeTerminate: (data: { parentPipeIndex: number, streamHead: symbol, pipeState: PipeState }) => void;
  onParentPipeTerminated: (data: { parentPipeIndex: number, streamHead: symbol, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamGroupFulfill: (data: { streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamRelease: (data: { streamHead: symbol, stream: Stream, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupFinished: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupRelease: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupReleased: (data: { streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamGroupTerminate: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onEmit: (data: { streamHead: symbol, value: any, valueType: 'data' | 'error', finally: boolean, streamGroup: StreamGroup, pipeState: PipeState }) => void;
};
