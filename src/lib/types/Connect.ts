import { OnParentStream } from './OnParentStream';
import { OnParentTerminate } from './OnParentTerminate';

export type Connect<
  TValue extends any = any,
> = {
  (
    onStream: OnParentStream<TValue>,
    onTerminate: OnParentTerminate,
  ): void;
}
