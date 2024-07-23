import { DEBUG_INSTRUCTION_TYPE, DISPLAY_NAME_INSTRUCTION_TYPE, INSTRUCTION_ENTITY_TYPE,
  PIPE_ENTITY_TYPE, Adjunct, BasePipe, BasePipeWithCreateDebugger, BasePipeWithDisplayName,
  DebugInstruction, Instruction } from './types';

export function isPipe(adjunct: Adjunct): adjunct is BasePipe {
  return !! adjunct && adjunct.entityType === PIPE_ENTITY_TYPE;
}

export function isInstruction(adjunct: Adjunct): adjunct is Instruction {
  return !! adjunct && adjunct.entityType === INSTRUCTION_ENTITY_TYPE;
}

export function isDisplayNameInstruction(adjunct: Adjunct): adjunct is DebugInstruction {
  return isInstruction(adjunct) && adjunct.instructionType === DISPLAY_NAME_INSTRUCTION_TYPE;
}

export function isDebugInstruction(adjunct: Adjunct): adjunct is DebugInstruction {
  return isInstruction(adjunct) && adjunct.instructionType === DEBUG_INSTRUCTION_TYPE;
}

export function isInstructionWithDisplayName(adjunct: Adjunct): adjunct is (Instruction & { displayName: string }) {
  return (isDisplayNameInstruction(adjunct) && !! adjunct.displayName) || (isDebugInstruction(adjunct) && !! adjunct.displayName);
}

export function isPipeWithCreateDebugger(adjunct: Adjunct): adjunct is BasePipeWithCreateDebugger {
  return isPipe(adjunct) && !! adjunct.createDebugger;
}

export function isPipeWithDisplayName(adjunct: Adjunct): adjunct is BasePipeWithDisplayName {
  return isPipe(adjunct) && adjunct.displayName != null;
}

export function isPipeWithNonEmptyDisplayName(adjunct: Adjunct): adjunct is BasePipeWithDisplayName {
  return isPipe(adjunct) && !! adjunct.displayName;
}
