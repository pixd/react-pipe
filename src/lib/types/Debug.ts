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
  onPipeResetStart: (data: { pipeState: PipeState }) => void;
  onPipeResetComplete: (data: { prevPipeState: PipeState, pipeState: PipeState }) => void;
  onMountStream: (data: { streamHead: symbol, streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onParentPipeStreamEmit: (data: { parentPipeIndex: number, streamHead: symbol, stream: Stream, pipeState: PipeState }) => void;
  onParentPipeStreamTerminateStart: (data: { parentPipeIndex: number, streamHead: symbol, pipeState: PipeState }) => void;
  onParentPipeStreamTerminateComplete: (data: { parentPipeIndex: number, streamHead: symbol, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamRelease: (data: { streamHead: symbol, stream: Stream, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupCreate: (data: { streamHead: symbol, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupUpdate: (data: { parentPipeIndex: number, streamHead: symbol, stream: Stream, streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupFinish: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupFulfill: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupReleaseStart: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupReleaseComplete: (data: { streamGroup: StreamGroup, prevPipeState: PipeState, pipeState: PipeState }) => void;
  onStreamGroupTerminateStart: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onStreamGroupTerminateComplete: (data: { streamGroup: StreamGroup, pipeState: PipeState }) => void;
  onEmit: (data: { streamHead: symbol, value: any, valueType: 'data' | 'error', finally: boolean, streamGroup: StreamGroup, pipeState: PipeState }) => void;
};
