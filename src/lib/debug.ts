import { createInstruction } from './instruction';
import { DEBUG_INSTRUCTION, DebugInstruction, Instruction } from './types';

export function debug(name: string): DebugInstruction {
  return {
    ...createInstruction(DEBUG_INSTRUCTION),
    log: (title: string, key: string, value: any, prevValue: any) => {
      const match = key.match(/^Symbol\((.+)\)$/);
      let superKey = match ? match[1] : key;
      superKey = name ? name + ': ' + superKey : superKey;

      console.groupCollapsed('%c' + title + ' %c' + superKey, 'color: gray; font-weight: lighter;', 'color: inherit;');
      console.log('%cprev value%c', 'color: #9E9E9E; font-weight: bold;', 'color: inherit;', prevValue);
      console.log('%cnext value%c', 'color: #4CAF50; font-weight: bold;', 'color: inherit;', value);
      console.groupEnd();
    },
  };
}

export function isDebugInstruction(instruction: Instruction): instruction is DebugInstruction {
  return instruction.instructionType === DEBUG_INSTRUCTION;
}
