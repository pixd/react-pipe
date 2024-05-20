import { DEBUG_INSTRUCTION_TYPE, PIPE_ENTITY_TYPE, INSTRUCTION_ENTITY_TYPE, Adjunct, BasePipe, BasePipeWithDebugInstruction,
  BasePipeWithDisplayName, DebugInstruction, Instruction } from './types';

export function isPipe(adjunct: Adjunct): adjunct is BasePipe {
  return !! adjunct && adjunct.entityType === PIPE_ENTITY_TYPE;
}

export function isInstruction(adjunct: Adjunct): adjunct is Instruction {
  return !! adjunct && adjunct.entityType === INSTRUCTION_ENTITY_TYPE;
}

export function isDebugInstruction(adjunct: Adjunct): adjunct is DebugInstruction {
  return isInstruction(adjunct) && adjunct.instructionType === DEBUG_INSTRUCTION_TYPE;
}

export function isPipeWithDebugInstruction(adjunct: Adjunct): adjunct is BasePipeWithDebugInstruction {
  return isPipe(adjunct) && !! adjunct.debugInstruction;
}

export function isPipeWithDisplayName(adjunct: Adjunct): adjunct is BasePipeWithDisplayName {
  return isPipe(adjunct) && adjunct.displayName != null;
}

export function isPipeWithNonEmptyDisplayName(adjunct: Adjunct): adjunct is BasePipeWithDisplayName {
  return isPipe(adjunct) && !! adjunct.displayName;
}
