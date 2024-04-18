import { useMemo, useEffect } from 'react';

import { isDebugInstruction } from './debug';
import { deepCopy } from './deepCopy';
import { Adjunct, BasePipe, DebugInstruction, FilledStreamGroup, Instruction, ParentRelease,
  ParentTerminate, StreamGroupValues, Stream, StreamGroup, PIPE } from './types';

type ChildPipeLink<
  TValue extends any = any,
> = {
  selfIndex: number;
  onRelease: ParentRelease<TValue>;
  onTerminate: ParentTerminate;
};

type ReleaseLink<
  TValue extends any = any,
> = {
  childIndex: number;
  streamHead: symbol;
  stream: Stream<TValue>;
};

export type Release<
  TValue extends any = any,
> = {
  (
    streamHead: symbol,
    value: TValue,
  ): void;
};

export type Terminate = {
  (): void;
};

export type Fill<
  TValue extends any = any,
  TStreamGroupValues extends any[] = any[],
> = {
  (
    streamHead: symbol,
    streamGroupValues: TStreamGroupValues,
    release: Release<TValue>,
  ): void | null | (() => void);
};

type InnerState = {
  streamGroups: Record<symbol, StreamGroup>,
  releaseLinks: ReleaseLink[],
  childPipeLinks: ChildPipeLink[],
};

export function useBasePipe<
  TValue extends any = any,
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
>(
  createFill: () => Fill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts: TAdjuncts,
): [BasePipe<TValue>, Release<TValue>] {
  const [pipe, release, unmountTerminate] = useMemo(() => {
    const fill = createFill() as Fill<TValue, StreamGroupValues<BasePipe[]>>;
    const connectedPipes = adjuncts.filter(isPipe) as BasePipe[];
    const instructions = adjuncts.filter(isInstruction) as Instruction[];
    const debugInstruction = instructions.find(isDebugInstruction);

    const debugStreamGroups = debugInstruction
      ? createDebugStreamGroups(debugInstruction)
      : () => null;
    const debugStreamGroupRelease = debugInstruction
      ? createDebugStreamGroupRelease(debugInstruction)
      : () => null;

    const innerState: InnerState = {
      streamGroups: {},
      releaseLinks: [],
      childPipeLinks: [],
    };

    let operative: boolean = true;
    // let prevStreamHead: null | symbol = null;

    const pipe: BasePipe<TValue> = createPipe(innerState.childPipeLinks);

    const release = (streamHead: symbol, value: TValue): void => {
      if (operative) {
        // if (prevStreamHead) {
        //   childPipeLinks.forEach((childPipeLink) => {
        //     childPipeLink.onTerminate(childPipeLink.selfIndex, prevStreamHead!);
        //   });
        //
        //   prevStreamHead = streamHead;
        // }

        innerState.childPipeLinks.forEach((childPipeLink) => {
          const releaseLink = pushReleaseLink(innerState.releaseLinks, childPipeLink.selfIndex, streamHead, value);
          childPipeLink.onRelease(childPipeLink.selfIndex, streamHead, releaseLink.stream);
        });
      }
    };

    const terminate = (): void => {
      if (operative) {
        operative = false;

        Object.getOwnPropertySymbols(innerState.streamGroups).forEach((streamHead) => {
          delete innerState.streamGroups[streamHead];
        });

        // childPipeLinks.forEach((childPipeLink) => {
        //   childPipeLink.onTerminate(childPipeLink.selfIndex);
        // });
      }
    };

    const handleParentRelease = (pipeIndex: number, streamHead: symbol, stream: Stream): void => {
      if (operative) {
        const streamGroup = innerState.streamGroups[streamHead] ?? (innerState.streamGroups[streamHead] = createStreamGroup(streamHead, connectedPipes.length));

        if ( ! streamGroup.members[pipeIndex]) {
          streamGroup.members[pipeIndex] = stream;
        }

        const prevInnerState = deepCopy(innerState);

        if (checkStreamGroup(streamGroup)) {
          delete innerState.streamGroups[streamHead];
          debugStreamGroupRelease(streamHead, deepCopy(innerState), prevInnerState);

          streamGroup.members.forEach((stream) => stream.release());
          Promise.resolve().then(() => fill(streamHead, getStreamGroupValues(streamGroup), release));
        }
        else {
          // TODO What a pipe address is?
          debugStreamGroups('???', deepCopy(innerState), prevInnerState);
        }
      }
    };

    const handleParentTerminate = (pipeIndex: number, streamHead: symbol): void => {
      if (operative) {
        terminate();
      }
    };

    let unmountTerminate = () => {};

    if (connectedPipes.length) {
      connectedPipes.forEach((pipeHolder, index) => pipeHolder.connect(index, handleParentRelease, handleParentTerminate));
    }
    else {
      unmountTerminate = fill(Symbol(), [], release) ?? unmountTerminate;
    }

    return [pipe, release, unmountTerminate];
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => {
      unmountTerminate();
    };
  }, []); // eslint-disable-line

  return [pipe, release];
}

function isPipe(adjunct: Adjunct): adjunct is BasePipe {
  return adjunct.type === PIPE;
}

function isInstruction(adjunct: Adjunct): adjunct is Instruction {
  return 'type' in adjunct;
}

function createPipe<
  TValue extends any = any,
>(childPipeLinks: ChildPipeLink[]): BasePipe<TValue> {
  return {
    type: PIPE,
    connect(selfIndex: number, onRelease: ParentRelease<TValue>, onTerminate: ParentTerminate): void {
      childPipeLinks.push(createChildPipeLink(selfIndex, onRelease, onTerminate));
    },
  };
}

function createChildPipeLink<
  TValue extends any = any,
>(selfIndex: number, onRelease: ParentRelease<TValue>, onTerminate: ParentTerminate): ChildPipeLink {
  return {
    selfIndex,
    onRelease,
    onTerminate,
  };
}

function createStream<
  TValue extends any = any,
>(value: TValue, release: () => void): Stream<TValue> {
  return {
    value,
    release,
  };
}

function createReleaseLink<
  TValue extends any = any,
>(childIndex: number, streamHead: symbol, stream: Stream<TValue>): ReleaseLink {
  return {
    childIndex,
    streamHead,
    stream,
  };
}

function pushReleaseLink<
  TValue extends any = any,
>(releaseLinks: ReleaseLink[], childIndex: number, streamHead: symbol, value: TValue): ReleaseLink {
  const stream = createStream(value, () => releaseLinks.splice(releaseLinks.length, 1));

  const releaseLink = createReleaseLink(childIndex, streamHead, stream);

  releaseLinks.push(releaseLink);

  return releaseLink;
}

function createStreamGroup<
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(streamHead: symbol, length: number): StreamGroup<TConnectedPipes> {
  return {
    streamHead,
    members: Array(length).fill(null),
  } as StreamGroup<TConnectedPipes>;
}

function checkStreamGroup<
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(streamGroup: StreamGroup<TConnectedPipes>): streamGroup is FilledStreamGroup<TConnectedPipes> {
  return streamGroup.members.every(Boolean);
}

function getStreamGroupValues<
  TConnectedPipes extends BasePipe[] = BasePipe[],
>(streamGroup: FilledStreamGroup<TConnectedPipes>): StreamGroupValues<TConnectedPipes> {
  return streamGroup.members.map((stream) => stream.value) as StreamGroupValues<TConnectedPipes>;
}

function createDebugStreamGroups(debugInstruction: DebugInstruction) {
  return (pipeAddress: string, value: any, prevValue: any) => {
    debugInstruction.log('streamGroups change', pipeAddress, value, prevValue);
  };
}

function createDebugStreamGroupRelease(debugInstruction: DebugInstruction) {
  return (streamHead: symbol, value: any, prevValue: any) => {
    debugInstruction.log('streamGroup release', streamHead.toString(), value, prevValue);
  };
}
