import type { BasePipe } from './Pipe';
import type { Stream } from './Stream';

export type ParentPipes<
  TAdjuncts extends any = any,
> = TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
  ? TAdjunct extends BasePipe
    ? [TAdjunct, ...ParentPipes<TRestAdjuncts>]
    : ParentPipes<TRestAdjuncts>
  : TAdjuncts extends (infer TAdjunct)[]
    ? Extract<TAdjunct, BasePipe>[]
    : [];

export type OnParentPipeStreamEmit<
  TValue extends any = any,
> = {
  (
    stream: Stream<TValue>,
  ): void;
};

export type OnParentPipeStreamTerminate<
  TValue extends any = any,
> = {
  (
    stream: Stream<TValue>,
  ): void;
};
