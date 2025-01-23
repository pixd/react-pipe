import { BasePipe } from './Pipe';

export type ParentPipes<
  TAdjuncts extends any = any,
> = TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
  ? TAdjunct extends BasePipe
    ? [TAdjunct, ...ParentPipes<TRestAdjuncts>]
    : ParentPipes<TRestAdjuncts>
  : TAdjuncts extends (infer TAdjunct)[]
    ? Extract<TAdjunct, BasePipe>[]
    : [];
