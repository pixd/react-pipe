import { OnParentPipeStreamEmit } from './OnParentPipeStreamEmit';
import { OnParentPipeStreamTerminate } from './OnParentPipeStreamTerminate';

export type DownstreamConnection<
  TValue extends any = any,
> = {
  onStreamEmit: OnParentPipeStreamEmit<TValue>;
  onStreamTerminate: OnParentPipeStreamTerminate;
};
