import { useMemo, useEffect } from 'react';

import { isDebugInstruction, isPipe, isPipeWithDebugInstruction, isPipeWithNonEmptyDisplayName }
  from './check';
import { deepCopy } from './deepCopy';
import { PIPE, Adjunct, BasePipe, BasePipeWithDebugInstruction, BasePipeWithDisplayName,
  ChildPipeLink, ConnectedPipes, DebugInstruction, FilledStreamGroup, ParentRelease,
  ParentTerminate, PipeState, ReleaseLink, StreamGroupValues, Stream, StreamGroup } from './types';

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
  displayName?: string;
};

export function useBasePipe<
  TValue extends any = any,
  TAdjunct extends null | Adjunct = null | Adjunct,
  TAdjuncts extends [] | [TAdjunct] | [TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | (TAdjunct)[] = (TAdjunct)[],
>(
  createFill: () => Fill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts: TAdjuncts,
): [BasePipe<TValue>, Release<TValue>] {
  const [pipe, release, unmountTerminate] = useMemo(() => {

    const fill = createFill();
    // WTF? Why should I use `as` here?
    const connectedPipes = adjuncts.filter(isPipe) as ConnectedPipes<TAdjuncts>;

    const displayName = fill.displayName || getNonEmptyDisplayName(adjuncts);
    const debugInstruction = getDebugInstruction(adjuncts);
    const debug = debugInstruction?.createDebugger(displayName);

    // if (displayName === 'unknown') {
    //   throw new Error();
    // }

    const state: PipeState<TAdjuncts> = {
      streamGroups: {},
      releaseLinks: [],
      childPipeLinks: [],
      operative: true,
    };

    // let prevStreamHead: null | symbol = null;

    const pipe: BasePipe<TValue> = createPipe(state.childPipeLinks, displayName, debugInstruction);

    const release = (streamHead: symbol, value: TValue): void => {
      if (state.operative) {
        // if (prevStreamHead) {
        //   childPipeLinks.forEach((childPipeLink) => {
        //     childPipeLink.onTerminate(childPipeLink.selfIndex, prevStreamHead!);
        //   });
        //
        //   prevStreamHead = streamHead;
        // }

        state.childPipeLinks.forEach((childPipeLink) => {
          const releaseLink = pushReleaseLink(state.releaseLinks, childPipeLink.selfIndex, streamHead, value);
          childPipeLink.onRelease(childPipeLink.selfIndex, streamHead, releaseLink.stream);
        });
      }
    };

    const terminate = (): void => {
      if (state.operative) {
        state.operative = false;

        Object.getOwnPropertySymbols(state.streamGroups).forEach((streamHead) => {
          delete state.streamGroups[streamHead];
        });

        // childPipeLinks.forEach((childPipeLink) => {
        //   childPipeLink.onTerminate(childPipeLink.selfIndex);
        // });
      }
    };

    const handleParentRelease = (parentPipeIndex: number, streamHead: symbol, stream: Stream): void => {
      if (state.operative) {
        let prevPipeState = deepCopy(state);

        const streamGroup = state.streamGroups[streamHead] ?? (state.streamGroups[streamHead] = createStreamGroup(streamHead, connectedPipes.length));

        if ( ! streamGroup.members[parentPipeIndex]) {
          streamGroup.members[parentPipeIndex] = stream;
        }

        debug?.parentPipeRelease(deepCopy({ parentPipeIndex, streamHead, stream, prevPipeState, pipeState: deepCopy(state) }));


        if (checkStreamGroup(streamGroup)) {
          prevPipeState = deepCopy(state);
          delete state.streamGroups[streamHead];
          debug?.streamGroupRelease(deepCopy({ streamHead, prevPipeState, pipeState: deepCopy(state) }));

          streamGroup.members.forEach((stream) => stream.release());
          Promise.resolve().then(() => fill(streamHead, getStreamGroupValues(streamGroup), release));
        }
      }
    };

    const handleParentTerminate = (pipeIndex: number, streamHead: symbol): void => {
      if (state.operative) {
        terminate();
      }
    };

    let unmountTerminate = () => {};

    if (connectedPipes.length) {
      connectedPipes.forEach((pipeHolder, index) => pipeHolder.connect(index, handleParentRelease, handleParentTerminate));
    }
    else {
      unmountTerminate = fill(Symbol(), [] as any, release) ?? unmountTerminate;
    }

    Promise.resolve().then(() => {
      debug?.pipeCreated(deepCopy({ pipeState: deepCopy(state) }));
    });

    return [pipe, release, unmountTerminate];
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => {
      unmountTerminate();
    };
  }, []); // eslint-disable-line

  return [pipe, release];
}

function createPipe<
  TValue extends any = any,
>(childPipeLinks: ChildPipeLink[], displayName?: string, debugInstruction?: DebugInstruction): BasePipe<TValue> {
  return {
    type: PIPE,
    displayName,
    debugInstruction,
    connect(selfIndex, onRelease, onTerminate) {
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
  TAdjuncts extends (null | Adjunct)[] = (null | Adjunct)[],
>(streamHead: symbol, length: number): StreamGroup<TAdjuncts> {
  return {
    streamHead,
    members: Array(length).fill(null),
  } as StreamGroup<TAdjuncts>;
}

function checkStreamGroup<
  TAdjuncts extends (null | Adjunct)[] = (null | Adjunct)[],
>(streamGroup: StreamGroup<TAdjuncts>): streamGroup is FilledStreamGroup<TAdjuncts> {
  return streamGroup.members.every(Boolean);
}

function getStreamGroupValues<
  TAdjuncts extends (null | Adjunct)[] = (null | Adjunct)[],
>(streamGroup: FilledStreamGroup<TAdjuncts>): StreamGroupValues<TAdjuncts> {
  return streamGroup.members.map((stream) => stream.value) as StreamGroupValues<TAdjuncts>;
}

export function getDisplayName(adjuncts: (null | Adjunct)[]) {
  const displayName = adjuncts.find<BasePipeWithDisplayName>(isPipeWithNonEmptyDisplayName)?.displayName;
  return displayName == null ? null : `${displayName} / [*]`;
}

export function getNonEmptyDisplayName(adjuncts: (null | Adjunct)[]) {
  const displayName = adjuncts.find<BasePipeWithDisplayName>(isPipeWithNonEmptyDisplayName)?.displayName;
  return displayName == null ? 'unknown' : `${displayName} / [*]`;
}

export function getDebugInstruction(adjuncts: (null | Adjunct)[]) {
  return adjuncts.find<DebugInstruction>(isDebugInstruction)
    ?? adjuncts.find<BasePipeWithDebugInstruction>(isPipeWithDebugInstruction)?.debugInstruction;
}
