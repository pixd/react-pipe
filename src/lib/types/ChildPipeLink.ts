import { OnParentStream } from './OnParentStream';
import { OnParentTerminate } from './OnParentTerminate';

export type ChildPipeLink<
  TValue extends any = any,
> = {
  onStream: OnParentStream<TValue>;
  onTerminate: OnParentTerminate;
};
