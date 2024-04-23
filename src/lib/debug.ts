import { createInstruction } from './instruction';
import { DEBUG_INSTRUCTION, Adjunct, Debugger, DebugInstruction, Instruction } from './types';

type ExtendedDebugInstruction = DebugInstruction & {
  (displayName: string): DebugInstruction;
};

function debugFn(displayName?: string): DebugInstruction {
  return {
    ...createInstruction(DEBUG_INSTRUCTION),
    createDebugger: () => createDebugger(displayName),
  };
}

export const debug = Object.assign(debugFn, {
  ...createInstruction(DEBUG_INSTRUCTION),
  createDebugger: createDebugger,
}) as ExtendedDebugInstruction;

function createDebugger(displayName: string ='unknown'): Debugger {
  return {
    pipeCreated: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe created`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    parentPipeRelease: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c parent pipe release`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex);
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream           ', 'font-weight: bold; color: #03A9F4;', data.stream);
      console.log('%c prev pipe state  ', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    streamGroupRelease: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c stream group release`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c prev pipe state  ', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
  }
}
