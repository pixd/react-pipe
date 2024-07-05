import { createInstruction } from './instruction';
import { DEBUG_INSTRUCTION_TYPE, Debugger, DebugInstruction } from './types';

type ExtendedDebugInstruction = DebugInstruction & {
  (displayName: string): DebugInstruction;
};

function debugFn(displayName: string): DebugInstruction {
  return {
    ...createInstruction(DEBUG_INSTRUCTION_TYPE),
    // TODO displayName should not be hardcoded
    createDebugger: () => createDebugger(displayName),
  };
}

export const debug = Object.assign(debugFn, {
  ...createInstruction(DEBUG_INSTRUCTION_TYPE),
  createDebugger: createDebugger,
}) as ExtendedDebugInstruction;

function createDebugger(displayName: string ='unknown'): Debugger {
  return {
    onPipeCreate: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe created`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onPipeResetStart: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe is resetting`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onPipeResetComplete: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe resetted`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c prev pipe state  ', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onMountStream: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe mount`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head    ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c streamGroup    ', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c prev pipe state', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onParentPipeStreamEmit: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe received a stream`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex);
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream           ', 'font-weight: bold; color: #03A9F4;', data.stream);
      console.log('%c pipe state       ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onParentPipeStreamTerminateStart: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe is terminating a stream`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex);
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c pipe state       ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onParentPipeStreamTerminateComplete: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe terminated a stream`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex);
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c prev pipe state  ', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupFulfill: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c stream group had been fulfilled`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamRelease: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c stream had been released`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream      ', 'font-weight: bold; color: #03A9F4;', data.stream);
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupCreate: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe created`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream head', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c streamGroup', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupUpdate: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe updated`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex);
      console.log('%c stream head      ', 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream           ', 'font-weight: bold; color: #03A9F4;', data.stream);
      console.log('%c streamGroup      ', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state       ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupFinish: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe finished a stream group`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupReleaseStart: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe is releasing a stream group`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupReleaseComplete: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe released a stream group`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group   ', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c prev pipe state', 'font-weight: bold; color: #9E9E9E;', data.prevPipeState);
      console.log('%c next pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupTerminateStart: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe is terminating a stream group`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupTerminateComplete: (data) => {
      console.groupCollapsed(`%c ${displayName}:%c pipe is terminated a stream group`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onEmit: (data) => {
      const finallyText = data.finally ? 'finally' : '';
      const errorText = data.valueType === 'error' ? 'an error' : 'a value';
      const message = [`%c ${displayName}:%c pipe`, finallyText, 'emitted', errorText].filter(Boolean).join(' ');
      console.groupCollapsed(message, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c emitted value'.padEnd(message.length, ' '), 'font-weight: bold; color: #03A9F4;', data.value);
      console.log('%c stream head  '.padEnd(message.length, ' '), 'font-weight: bold; color: #03A9F4;', data.streamHead);
      console.log('%c stream group '.padEnd(message.length, ' '), 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state   '.padEnd(message.length, ' '), 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
  }
}
