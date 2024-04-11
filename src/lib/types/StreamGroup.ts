import { BasePipe } from './Pipe';
import { Stream } from './Stream';

export type StreamGroup<TConnectedPipes extends BasePipe[] = BasePipe[]> = TConnectedPipes extends BasePipe<infer TValue>[] ? (null | Stream<TValue>)[] : never;

export type FilledStreamGroup<TConnectedPipes extends BasePipe[] = BasePipe[]> = TConnectedPipes extends BasePipe<infer TValue>[] ? Stream<TValue, true>[] : never;
