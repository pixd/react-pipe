import { useMemo, useEffect } from 'react';

import { BasePipe, FilledStreamGroup, ParentRelease, ParentTerminate, StreamGroupValues, Stream,
  StreamGroup } from './types';

type Connection = {
  selfIndex: number;
  onRelease: ParentRelease;
  onTerminate: ParentTerminate;
};

function createConnection(selfIndex: number, onRelease: ParentRelease, onTerminate: ParentTerminate): Connection {
  return {
    selfIndex,
    onRelease,
    onTerminate,
  };
}

function createStream<TValue extends any = any>(value: TValue): Stream<TValue> {
  return {
    value,
    operative: true,
  };
}

function createStreamGroup<
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(connectedPipes: TConnectedPipes): StreamGroup<TConnectedPipes> {
  return new Array(connectedPipes.length).fill(null) as StreamGroup<TConnectedPipes>;
}

function checkStreamGroup<
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(streamGroup: StreamGroup<TConnectedPipes>): streamGroup is FilledStreamGroup<TConnectedPipes> {
  return streamGroup.every((stream) => stream?.operative);
}

function getStreamGroupValues<
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(streamGroup: FilledStreamGroup<TConnectedPipes>): StreamGroupValues<TConnectedPipes> {
  return streamGroup.map((stream) => stream.value) as StreamGroupValues<TConnectedPipes>;
}

export type Release<
  TValue extends any = any,
> = {
  (
    streamHead: symbol,
    value: TValue,
    shortLived?: boolean,
  ): void;
};

export type Terminate = {
  (): void;
};

export type Fill<
  TValue extends any = any,
  TConnectedPipes extends BasePipe[] = BasePipe[],
> = {
  (
    streamHead: symbol,
    streamGroupValues: StreamGroupValues<TConnectedPipes>,
    release: Release<TValue>,
    terminate: Terminate,
  ): void | (() => void);
};

export function useBasePipe<
  TValue extends any = any,
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(
  createFill: () => Fill<TValue, TConnectedPipes>,
  connectedPipes: TConnectedPipes,
): [BasePipe<TValue>, Release<TValue>, Terminate] {
  const [pipe, release, terminate, unmountTerminate] = useMemo(() => {
    const fill = createFill();
    let operative = true;

    const outgoingConnections: Connection[] = [];

    const streamGroups: Record<symbol, StreamGroup<TConnectedPipes>> = {};

    const pipe: BasePipe<TValue> = {
      connect(selfIndex: number, onRelease: ParentRelease<TValue>, onTerminate: ParentTerminate): void {
        outgoingConnections.push(createConnection(selfIndex, onRelease, onTerminate));
      },
    };

    const release = (streamHead: symbol, value: TValue, shortLived?: boolean): void => {
      if (operative) {
        const stream = createStream(value);

        outgoingConnections.forEach((childPipeLink) => {
          Promise.resolve().then(() => childPipeLink.onRelease(childPipeLink.selfIndex, streamHead, stream));
        });

        Promise.resolve().then(() => (stream.operative = ! shortLived));
      }
    };

    const terminate = (): void => {
      if (operative) {
        operative = false;

        Object.getOwnPropertySymbols(streamGroups).forEach((streamHead) => {
          delete streamGroups[streamHead];
        });

        outgoingConnections.forEach((childPipeLink) => {
          Promise.resolve().then(() => childPipeLink.onTerminate(childPipeLink.selfIndex));
        });
      }
    };

    const handleParentRelease = (holderIndex: number, streamHead: symbol, stream: Stream): void => {
      if (operative) {
        const streamGroup = streamGroups[streamHead] ?? (streamGroups[streamHead] = createStreamGroup(connectedPipes));

        if (streamGroup[holderIndex] == null) {
          streamGroup[holderIndex] = stream;
          if (checkStreamGroup(streamGroup)) {
            const streamGroupValues = getStreamGroupValues(streamGroup);
            fill(streamHead, streamGroupValues, release, terminate);
            delete streamGroups[streamHead];
          }
        }
      }
    };

    const handleParentTerminate = (): void => {
      if (operative) {
        terminate();
      }
    };

    let unmountTerminate = () => {};

    if (connectedPipes.length) {
      connectedPipes.forEach((pipeHolder, index) => pipeHolder.connect(index, handleParentRelease, handleParentTerminate));
    }
    else {
      unmountTerminate = fill(Symbol(), [] as StreamGroupValues<TConnectedPipes>, release, terminate) ?? unmountTerminate;
    }

    return [pipe, release, terminate, unmountTerminate];
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => {
      unmountTerminate();
    };
  }, []); // eslint-disable-line

  return [pipe, release, terminate];
}
