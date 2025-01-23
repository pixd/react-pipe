import { OnParentPipeStreamEmit } from './OnParentPipeStreamEmit';
import { OnParentPipeStreamTerminate } from './OnParentPipeStreamTerminate';

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
