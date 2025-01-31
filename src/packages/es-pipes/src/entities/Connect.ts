import type { OnParentPipeStreamEmit } from './ParentPipe';
import type { OnParentPipeStreamTerminate } from './ParentPipe';

export type Connect<
  TValue extends any = any,
> = {
  (
    onStreamEmit: OnParentPipeStreamEmit<TValue>,
    onStreamTerminate: OnParentPipeStreamTerminate,
  ): number;
}

export type DownstreamConnection<
  TValue extends any = any,
> = {
  onStreamEmit: OnParentPipeStreamEmit<TValue>;
  onStreamTerminate: OnParentPipeStreamTerminate<TValue>;
};
