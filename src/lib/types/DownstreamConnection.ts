import { OnParentPipeStreamEmit } from './ParentPipe';
import { OnParentPipeStreamTerminate } from './ParentPipe';

export type DownstreamConnection<
  TValue extends any = any,
> = {
  onStreamEmit: OnParentPipeStreamEmit<TValue>;
  onStreamTerminate: OnParentPipeStreamTerminate<TValue>;
};
