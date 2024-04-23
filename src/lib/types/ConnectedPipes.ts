import { BasePipe } from './Pipe';

export type ConnectedPipes<TAdjuncts extends any> = TAdjuncts extends (infer TAdjunct)[]
  ? Extract<TAdjunct, BasePipe>[]
  : TAdjuncts extends [infer TAdjunct, ...(infer TRestAdjuncts)]
    ? TAdjunct extends BasePipe
        ? [TAdjunct, ...ConnectedPipes<TRestAdjuncts>]
        : ConnectedPipes<TRestAdjuncts>
    : [];
