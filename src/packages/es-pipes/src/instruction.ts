import type { Instruction } from './entities';
import type { ControlInstruction } from './entities';
import type { CreateDebugger } from './entities';
import type { DebugInstruction } from './entities';
import type { DisplayNameInstruction } from './entities';
import { INSTRUCTION_ENTITY_TYPE } from './entities';
import { CONTROL_INSTRUCTION_TYPE } from './entities';
import { DEBUG_INSTRUCTION_TYPE } from './entities';
import { DISPLAY_NAME_INSTRUCTION_TYPE } from './entities';

export function createInstruction<
  TInstructionType extends symbol = symbol,
>(instructionType: TInstructionType): Instruction<TInstructionType> {
  return {
    entityType: INSTRUCTION_ENTITY_TYPE,
    instructionType,
  };
}

export function createDebugInstruction(createDebugger: CreateDebugger, displayName?: string): DebugInstruction {
  return {
    ...createInstruction(DEBUG_INSTRUCTION_TYPE),
    createDebugger,
    displayName,
  };
}

export function createDisplayNameInstruction(displayName: string): DisplayNameInstruction {
  return {
    ...createInstruction(DISPLAY_NAME_INSTRUCTION_TYPE),
    displayName,
  };
}

export function createControlInstruction<
  TControlInstructionType extends symbol = symbol,
>(controlInstructionType: TControlInstructionType, props: Pick<ControlInstruction, 'createStreamEmitHandler' | 'createStreamTerminateHandler'>): ControlInstruction<TControlInstructionType> {
  return {
    ...createInstruction(CONTROL_INSTRUCTION_TYPE),
    controlInstructionType,
    ...props,
  };
}
