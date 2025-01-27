import { createInstruction } from './instruction';
import type { Debugger } from './types';
import type { DebugInstruction } from './types';
import type { DisplayNameInstruction } from './types';
import type { PipeState } from './types';
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

const neutralColor = 'font-weight: bold; color: #03A9F4;';

function createDebugger(displayName: string = 'unknown'): Debugger {
  return {
    onPipeCreate: (message, data) => log(
      displayName,
      message,
      data.pipeState,
    ),
    onPipeEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
    ),
    onStreamGroupCreate: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      data.parentPipeIndex != null ? ['%c parent pipe index', neutralColor, data.parentPipeIndex] : null,
      ['%c streamGroup', neutralColor, data.streamGroup],
    ),
    onStreamGroupEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      data.parentPipeIndex != null ? ['%c parent pipe index', neutralColor, data.parentPipeIndex] : null,
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onEmit: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      ['%c papa', neutralColor, data.papa],
      ['%c data barrel', neutralColor, data.dataBarrel],
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onDataBarrelEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      ['%c papa', neutralColor, data.papa],
      ['%c data barrel', neutralColor, data.dataBarrel],
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onStreamEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      ['%c stream', neutralColor, data.stream],
      ['%c stream group', neutralColor, data.streamGroup],
    ),
  }
}

function log(displayName: string, message: string, pipeState: PipeState, ...logs: (null | [string, ...any[]])[]) {
  const completeLogs = [
    ...logs,
    ['%c pipe state', 'font-weight: bold; color: #4CAF50;', pipeState] as const,
  ];
  const maxTitleLength = completeLogs.reduce((maxTitleLength, log) => Math.max(maxTitleLength, (log?.[0] ?? '').length), 0);

  console.groupCollapsed(`%c ${displayName}:%c ${message}`, 'font-weight: bold; color: inherit;', 'font-weight: lighter; color: gray;');
  completeLogs.forEach((log) => {
    if (log) {
      const [title, ...restLog] = log;
      console.log(title.padEnd(maxTitleLength), ...restLog);
    }
  });
  console.groupEnd();
}
