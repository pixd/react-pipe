import type { Instruction } from './entities';
import type { HandleEmitStream } from './entities';
import type { ControlInstruction } from './entities';
import { INSTRUCTION_ENTITY_TYPE } from './entities';
import { CONTROL_INSTRUCTION_TYPE } from './entities';

export function createInstruction<
  TInstructionType extends symbol = symbol,
>(instructionType: TInstructionType): Instruction<TInstructionType> {
  return {
    entityType: INSTRUCTION_ENTITY_TYPE,
    instructionType,
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
