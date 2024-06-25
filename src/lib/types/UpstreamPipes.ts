import { BasePipe } from './Pipe';

export type UpstreamPipes<
  TAdjuncts extends any = any,
> = TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
  ? TAdjunct extends BasePipe
    ? [TAdjunct, ...UpstreamPipes<TRestAdjuncts>]
    : UpstreamPipes<TRestAdjuncts>
  : TAdjuncts extends (infer TAdjunct)[]
    ? Extract<TAdjunct, BasePipe>[]
    : [];
