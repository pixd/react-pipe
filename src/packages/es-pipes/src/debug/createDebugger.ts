import type { Debugger } from '../entities';
import type { PipeState } from '../entities';
import { log } from './log';

const neutralColor = 'font-weight: bold; color: #03A9F4;';

export function createDebugger(displayName: string = 'unknown'): Debugger {
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
      data.stream != null ? ['%c stream', neutralColor, data.stream] : null,
      data.dataBarrel != null ? ['%c data barrel', neutralColor, data.dataBarrel] : null,
      data.streamGroup != null ? ['%c stream group', neutralColor, data.streamGroup] : null,
    ),
    onStreamGroupCreate: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      data.parentPipeIndex != null ? ['%c parent pipe index', neutralColor, data.parentPipeIndex] : null,
      data.stream != null ? ['%c stream', neutralColor, data.stream] : null,
      ['%c streamGroup', neutralColor, data.streamGroup],
    ),
    onStreamGroupEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      data.parentPipeIndex != null ? ['%c parent pipe index', neutralColor, data.parentPipeIndex] : null,
      data.stream != null ? ['%c stream', neutralColor, data.stream] : null,
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onEmit: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      ['%c data barrel', neutralColor, data.dataBarrel],
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onDataBarrelEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      ['%c data barrel', neutralColor, data.dataBarrel],
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onStreamEvent: (message, data) => log(
      displayName,
      message,
      data.pipeState,
      ['%c stream', neutralColor, data.stream],
      ['%c data barrel', neutralColor, data.dataBarrel],
      ['%c stream group', neutralColor, data.streamGroup],
    ),
    onError: (error: Error, pipeState: PipeState) => {
      log(
        displayName,
        error,
        pipeState,
        ['%c error', neutralColor, error],
      );
      console.error(error);
    },
  }
}
