import { createInstruction } from './instruction';
import type { Debugger } from './types';
import type { DebugInstruction } from './types';
import type { DisplayNameInstruction } from './types';
import { DEBUG_INSTRUCTION_TYPE } from './types';
import { DISPLAY_NAME_INSTRUCTION_TYPE } from './types';

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
      log(
        ['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState],
      );
      console.groupEnd();
    },
    onPipeEvent: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      log(
        ['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState],
      );
      console.groupEnd();
    },
    onStreamGroupCreate: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      log(
        ['%c papa', 'font-weight: bold; color: #03A9F4;', data.papa],
        ['%c streamGroup', 'font-weight: bold; color: #03A9F4;', data.streamGroup],
        ['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState],
      );
      console.groupEnd();
    },
    onStreamGroupEvent: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      log(
        data.papa ? ['%c papa', 'font-weight: bold; color: #03A9F4;', data.papa] : null,
        ['%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup],
        ['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState],
      );
      console.groupEnd();
    },
    onEmit: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      log(
        ['%c papa', 'font-weight: bold; color: #03A9F4;', data.papa],
        ['%c data barrel', 'font-weight: bold; color: #03A9F4;', data.dataBarrel],
        ['%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup],
        ['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState],
      );
      console.groupEnd();
    },
    onStreamEvent: (message, data) => {
      console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
      log(
        data.parentPipeIndex != null ? ['%c parent pipe index', 'font-weight: bold; color: #03A9F4;', data.parentPipeIndex] : null,
        ['%c stream', 'font-weight: bold; color: #03A9F4;', data.stream],
        ['%c stream group', 'font-weight: bold; color: #03A9F4;', data.streamGroup],
        ['%c pipe state', 'font-weight: bold; color: #4CAF50;', data.pipeState],
      );
      console.groupEnd();
    },
  }
}

function log(...logs: (null | [string, ...any])[]) {
  const maxTitleLength = logs.reduce((maxTitleLength, log) => Math.max(maxTitleLength, (log?.[0] ?? '').length), 0);
  logs.forEach((log) => {
    if (log) {
      const [title, ...restLog] = log;
      console.log(title.padEnd(maxTitleLength), ...restLog);
    }
  });
}
