import { Adjunct } from './Adjunct';
import { DownstreamConnection } from './DownstreamConnection';
import { StreamGroups } from './StreamGroup';
import { UpstreamPipes } from './UpstreamPipes';

export type PipeState<
  TValue extends any = any,
  TError extends any = any,
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  upstreamPipes: UpstreamPipes<TAdjuncts>;
  streamGroups: StreamGroups<TAdjuncts>;
  dataPipe: CommonPipeState<TValue>;
  errorPipe: CommonPipeState<TError>;
};

export type CommonPipeState<
  TValue extends any = any,
> = {
  uniqKey: symbol;
  downstreamConnections: DownstreamConnection<TValue>[];
  operative: boolean;
};
