import type { Adjunct } from './entities';
import type { BasePipe } from './entities';
import type { BasePipeWithCreateDebugger } from './entities';
import type { BasePipeWithDisplayName } from './entities';
import type { DataBarrel } from './entities';
import type { DebugInstruction } from './entities';
import type { Final } from './entities';
import type { Instruction } from './entities';
import type { StreamGroup } from './entities';
import type { ControlInstruction } from './entities';
import { DEBUG_INSTRUCTION_TYPE } from './entities';
import { DISPLAY_NAME_INSTRUCTION_TYPE } from './entities';
import { FINAL_TYPE } from './entities';
import { INSTRUCTION_ENTITY_TYPE } from './entities';
import { PIPE_ENTITY_TYPE } from './entities';
import { CONTROL_INSTRUCTION_TYPE } from './entities';
import { dataBarrelStatus } from './entities';
import { streamGroupStatus } from './entities';

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
  return getIsPipe(adjunct) && !! adjunct.displayName;
}

export function getIsControlInstruction(adjunct: Adjunct): adjunct is ControlInstruction {
  return getIsInstruction(adjunct) && adjunct.instructionType === CONTROL_INSTRUCTION_TYPE;
}

export function getIsStreamEmitInstruction(adjunct: Adjunct): adjunct is Omit<ControlInstruction, 'createStreamEmitHandler'> & { createStreamEmitHandler: NonNullable<ControlInstruction['createStreamEmitHandler']> } {
  return getIsControlInstruction(adjunct) && !! adjunct.createStreamEmitHandler;
}

export function getIsStreamTerminateInstruction(adjunct: Adjunct): adjunct is Omit<ControlInstruction, 'createStreamTerminateHandler'> & { createStreamTerminateHandler: NonNullable<ControlInstruction['createStreamTerminateHandler']> } {
  return getIsControlInstruction(adjunct) && !! adjunct.createStreamTerminateHandler;
}

export function getIsStreamGroupFulfilled(streamGroup: StreamGroup): boolean {
  return streamGroup.members.every(Boolean);
}

export function getIsStreamGroupOpen(streamGroup: StreamGroup): boolean {
  return streamGroup.status === streamGroupStatus.open;
}

export function getIsStreamGroupClosed(streamGroup: StreamGroup): boolean {
  return streamGroup.status === streamGroupStatus.closed;
}

export function getIsStreamGroupRetired(streamGroup: StreamGroup): boolean {
  return streamGroup.status === streamGroupStatus.retired;
}

export function getIsStreamGroupDeleted(streamGroup: StreamGroup): boolean {
  return streamGroup.status === streamGroupStatus.deleted;
}

export function getIsDataBarrelActive(dataBarrel: DataBarrel): boolean {
  return dataBarrel.status === dataBarrelStatus.active;
}

export function getIsDataBarrelDeleted(dataBarrel: DataBarrel): boolean {
  return dataBarrel.status === dataBarrelStatus.deleted;
}

export function getIsFinal(value: any): value is Final {
  return (value as any)?.type === FINAL_TYPE;
}
