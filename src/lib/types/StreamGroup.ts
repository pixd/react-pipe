import { BasePipe } from './Pipe';
import { Stream } from './Stream';

type StreamGroupMembers<TConnectedPipes extends any> = TConnectedPipes extends BasePipe<infer TValue>[]
  ? (null | Stream<TValue>)[]
  : TConnectedPipes extends [BasePipe<infer TValue>, ...(infer TRestConnectedPipes)]
    ? [null | Stream<TValue>, ...StreamGroupMembers<TRestConnectedPipes>]
    : [];

export type StreamGroup<TConnectedPipes extends BasePipe[] = BasePipe[]> = {
  streamHead: symbol;
  members: StreamGroupMembers<TConnectedPipes>;
};

type FilledStreamGroupMembers<TConnectedPipes extends any> = TConnectedPipes extends BasePipe<infer TValue>[]
  ? Stream<TValue>[]
  : TConnectedPipes extends [BasePipe<infer TValue>, ...(infer TRestConnectedPipes)]
    ? [Stream<TValue>, ...StreamGroupMembers<TRestConnectedPipes>]
    : [];

export type FilledStreamGroup<TConnectedPipes extends BasePipe[] = BasePipe[]> = {
  streamHead: symbol;
  members: FilledStreamGroupMembers<TConnectedPipes>;
};
