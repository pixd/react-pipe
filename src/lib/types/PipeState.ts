import { Adjunct } from './Adjunct';
import { DownstreamConnection } from './DownstreamConnection';
import { ParentPipes } from './ParentPipe';
import { StreamGroups } from './StreamGroup';

export type PipeState<
  TValue extends any = any,
  TError extends any = any,
  TAdjuncts extends Adjunct[] = Adjunct[],
> = {
  /**
   * Available if process.env.NODE_ENV === 'development'
   */
  displayName?: string;

  parentPipes: ParentPipes<TAdjuncts>;
  streamGroups: StreamGroups<TAdjuncts>;
  dataPipe: CommonPipeState<TValue>;
  errorPipe: CommonPipeState<TError>;
};

export type CommonPipeState<
  TValue extends any = any,
> = {
  uniqKey: symbol;
  downstreamConnections: DownstreamConnection<TValue>[];
};
