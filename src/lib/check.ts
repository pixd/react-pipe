import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { BasePipeWithCreateDebugger } from './types';
import type { BasePipeWithDisplayName } from './types';
import type { DebugInstruction } from './types';
import type { Final } from './types';
import type { Instruction } from './types';
import type { StreamGroup } from './types';
import { EStreamGroupStatus } from './types';
import { DEBUG_INSTRUCTION_TYPE } from './types';
import { DISPLAY_NAME_INSTRUCTION_TYPE } from './types';
import { FINAL_TYPE } from './types';
import { INSTRUCTION_ENTITY_TYPE } from './types';
import { PIPE_ENTITY_TYPE } from './types';

export function getIsPipe(adjunct: Adjunct): adjunct is BasePipe {
  return !! adjunct && adjunct.entityType === PIPE_ENTITY_TYPE;
}

export function getIsInstruction(adjunct: Adjunct): adjunct is Instruction {
  return !! adjunct && adjunct.entityType === INSTRUCTION_ENTITY_TYPE;
}

export function getIsDisplayNameInstruction(adjunct: Adjunct): adjunct is DebugInstruction {
  return getIsInstruction(adjunct) && adjunct.instructionType === DISPLAY_NAME_INSTRUCTION_TYPE;
}

export function getIsDebugInstruction(adjunct: Adjunct): adjunct is DebugInstruction {
  return getIsInstruction(adjunct) && adjunct.instructionType === DEBUG_INSTRUCTION_TYPE;
}

export function getIsInstructionWithDisplayName(adjunct: Adjunct): adjunct is (Instruction & { displayName: string }) {
  return (getIsDisplayNameInstruction(adjunct) && !! adjunct.displayName) || (getIsDebugInstruction(adjunct) && !! adjunct.displayName);
}

export function getIsPipeWithCreateDebugger(adjunct: Adjunct): adjunct is BasePipeWithCreateDebugger {
  return getIsPipe(adjunct) && !! adjunct.createDebugger;
}

export function getIsPipeWithDisplayName(adjunct: Adjunct): adjunct is BasePipeWithDisplayName {
  return getIsPipe(adjunct) && adjunct.displayName != null;
}

export function getIsPipeWithNonEmptyDisplayName(adjunct: Adjunct): adjunct is BasePipeWithDisplayName {
  return getIsPipe(adjunct) && !! adjunct.displayName;
}

export function getIsStreamGroupFulfilled(streamGroup: StreamGroup): boolean {
  return streamGroup.members.every(Boolean);
}

export function getIsStreamGroupOpen(streamGroup: StreamGroup): boolean {
  return streamGroup.status === EStreamGroupStatus.open;
}

export function getIsStreamGroupClosed(streamGroup: StreamGroup): boolean {
  return streamGroup.status === EStreamGroupStatus.closed;
}

export function getIsStreamGroupRetired(streamGroup: StreamGroup): boolean {
  return streamGroup.status === EStreamGroupStatus.retired;
}

export function getIsStreamGroupDeleted(streamGroup: StreamGroup): boolean {
  return streamGroup.status === EStreamGroupStatus.deleted;
}

export function getIsFinal(value: any): value is Final {
  return (value as any)?.type === FINAL_TYPE;
}
