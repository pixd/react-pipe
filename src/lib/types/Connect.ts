import { OnParentPipeStreamEmit } from './ParentPipe';
import { OnParentPipeStreamTerminate } from './ParentPipe';

export type Connect<
  TValue extends any = any,
> = {
  (
    onStreamEmit: OnParentPipeStreamEmit<TValue>,
    onStreamTerminate: OnParentPipeStreamTerminate,
  ): ConnectionResult;
}

export type ConnectionResult = {
  connectionIndex: number;
};
