import { Adjunct } from './Adjunct';
import { DownstreamConnection } from './DownstreamConnection';
import { StreamGroups } from './StreamGroups';
import { UpstreamPipes } from './UpstreamPipes';

export type PipeState<
  TValue extends any = any,
  TError extends any = any,
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  operative: boolean;
  streamGroups: StreamGroups<TAdjuncts>;
  upstreamPipes: UpstreamPipes<TAdjuncts>;
  downstreamConnections: DownstreamConnection<TValue>[];
  errorPipeDownstreamConnections: DownstreamConnection<TError>[];
};
