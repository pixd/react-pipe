import { createDebugInstruction } from '../instruction';
import { createDebugger } from './createDebugger';

export const debugInstruction = createDebugInstruction(createDebugger);
