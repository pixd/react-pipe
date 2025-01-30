import type { OnParentPipeStreamEmit } from './ParentPipe';
import type { OnParentPipeStreamTerminate } from './ParentPipe';

export type DownstreamConnection<
  TValue extends any = any,
> = {
  onStreamEmit: OnParentPipeStreamEmit<TValue>;
  onStreamTerminate: OnParentPipeStreamTerminate<TValue>;
};
