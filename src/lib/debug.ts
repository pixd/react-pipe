import { createInstruction } from './instruction';
import { DEBUG_INSTRUCTION_TYPE, DISPLAY_NAME_INSTRUCTION_TYPE, Debugger, DebugInstruction,
  DisplayNameInstruction } from './types';

export function displayName(displayName: string): DisplayNameInstruction {
  return {
    ...createInstruction(DISPLAY_NAME_INSTRUCTION_TYPE),
    displayName,
  };
}

type ExtendedDebugInstruction = DebugInstruction & {
  (displayName: string): DebugInstruction;
};

export const debug = Object.assign(
  (displayName: string): DebugInstruction => {
    return {
      ...createInstruction(DEBUG_INSTRUCTION_TYPE),
      createDebugger,
      displayName,
    };
  },
  {
    ...createInstruction(DEBUG_INSTRUCTION_TYPE),
    createDebugger,
  },
) as ExtendedDebugInstruction;

function createDebugger(displayName: string = 'unknown'): Debugger {
  return {
    onPipeCreate: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onPipeEvent: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupCreate: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      console.log('%c papa', 'font-weight: bold; color: #03A9F4;', data.papa);
      console.log('%c streamGroup', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamGroupEvent: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      data.papa && console.log('%c papa', 'font-weight: bold; color: #03A9F4;', data.papa);
      console.log('%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state  ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onEmit: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      data.dataType === 'error'
        ? console.log('%c emitted data', 'font-weight: bold; color: #03A9F4;', data.data)
        : console.log('%c emitted error', 'font-weight: bold; color: #03A9F4;', data.data);
      console.log('%c papa  ', 'font-weight: bold; color: #03A9F4;', data.papa);
      console.log('%c stream group ', 'font-weight: bold; color: #03A9F4;', data.streamGroup);
      console.log('%c pipe state   ', 'font-weight: bold; color: #4CAF50;', data.pipeState);
      console.groupEnd();
    },
    onStreamEvent: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');

      const logs: [string, ...any][] = [];
      data.parentPipeIndex != null && logs.push(['%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex]);
      logs.push(['%c papa', 'font-weight: bold; color: #03A9F4;', data.papa]);
      logs.push(['%c stream', 'font-weight: bold; color: #03A9F4;', data.stream]);
      logs.push(['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState]);

      const maxTitleLength = logs.reduce((maxTitleLength, log) => Math.max(maxTitleLength, log[0].length), 0);
      logs.forEach((log) => {
        const [title, ...restLog] = log;
        console.log(title.padEnd(maxTitleLength), ...restLog);
      });

      console.groupEnd();
    },
  }
}
