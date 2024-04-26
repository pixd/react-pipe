import { createInstruction } from './instruction';
import { DEBUG_INSTRUCTION, Debugger, DebugInstruction } from './types';

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
    onPipeCreate: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe created`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onParentPipeStream: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe received a stream`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex);
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream           ', 'font-weight: bold; color: #03A9F4;', data.stream);
      console.log('%c prev pipe state  ', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupFulfill: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c stream group had been fulfilled`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group   ', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c prev pipe state', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamRelease: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c stream had been released`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream     ', 'font-weight: bold; color: #03A9F4;', data.stream);
      console.log('%c pipe state ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupRelease: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe released a stream group`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamEmit: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe emitted a stream`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head  ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c emitted value', 'font-weight: bold; color: #03A9F4;', data.value);
      console.log('%c pipe state   ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onErrorEmit: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe emitted an error`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head  ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c emitted error', 'font-weight: bold; color: #03A9F4;', data.error);
      console.log('%c pipe state   ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
  }
}
