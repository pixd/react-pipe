import { Instruction } from './Instruction';

export const DEBUG_INSTRUCTION = Symbol('DEBUG_INSTRUCTION');

export type DebugInstruction = Instruction<typeof DEBUG_INSTRUCTION> & {
  createDebugger: (displayName?: string) => Debugger;
};

export type Debugger = {
  pipeCreated: (data: { pipeState: any } ) => void;
  parentPipeRelease: (data: { parentPipeIndex: number, streamHead: symbol, stream: any, prevPipeState: any, pipeState: any } ) => void;
  streamGroupRelease: (data: { streamHead: symbol, prevPipeState: any, pipeState: any } ) => void;
};
