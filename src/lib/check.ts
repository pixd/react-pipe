import { DEBUG_INSTRUCTION, PIPE, INSTRUCTION, Adjunct, BasePipe, BasePipeWithDebugInstruction,
  BasePipeWithDisplayName, DebugInstruction, Instruction } from './types';

export function isPipe(adjunct: null | Adjunct): adjunct is BasePipe {
  return !! adjunct && adjunct.type === PIPE;
}

export function isInstruction(adjunct: null | Adjunct): adjunct is Instruction {
  return !! adjunct && adjunct.type === INSTRUCTION;
}

export function isDebugInstruction(adjunct: null | Adjunct): adjunct is DebugInstruction {
  return isInstruction(adjunct) && adjunct.instructionType === DEBUG_INSTRUCTION;
}

export function isPipeWithDebugInstruction(adjunct: null | Adjunct): adjunct is BasePipeWithDebugInstruction {
  return isPipe(adjunct) && !! adjunct.debugInstruction;
}

export function isPipeWithDisplayName(adjunct: null | Adjunct): adjunct is BasePipeWithDisplayName {
  return isPipe(adjunct) && adjunct.displayName != null;
}

export function isPipeWithNonEmptyDisplayName(adjunct: null | Adjunct): adjunct is BasePipeWithDisplayName {
  return isPipe(adjunct) && !! adjunct.displayName;
}
