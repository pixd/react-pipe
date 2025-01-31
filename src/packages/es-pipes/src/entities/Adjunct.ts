import type { Instruction } from './Instruction';
import type { BasePipe } from './Pipe';

export type Adjunct = undefined | null | BasePipe | Instruction;
