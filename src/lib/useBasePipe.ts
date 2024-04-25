import { useMemo, useEffect } from 'react';

import { isDebugInstruction, isPipe, isPipeWithDebugInstruction } from './check';
import { deepCopy } from './deepCopy';
import { PIPE, Adjunct, BasePipe, BasePipeWithDebugInstruction, ChildPipeLink, ConnectedPipes,
  Debugger, DebugInstruction, FilledStreamGroup, OnParentStream, OnParentTerminate, PipeState,
  StreamGroupValues, Stream, StreamGroup } from './types';

export type EmitStream<
  TValue extends any = any,
> = {
  (
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
    streamGroupValues: TStreamGroupValues,
    emitStream: EmitStream<TValue>,
  ): void | null | (() => void);
  displayName?: string;
};

export function useBasePipe<
  TValue extends any = any,
  TAdjunct extends Adjunct = Adjunct,
  TAdjuncts extends [] | [TAdjunct] | [TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | (TAdjunct)[] = (TAdjunct)[],
>( createFill: () => Fill<TValue, StreamGroupValues<TAdjuncts>>, adjuncts: TAdjuncts): [BasePipe<TValue>, EmitStream<TValue>] {
  const [pipe, emitStream, unmountTerminate] = useMemo(() => {
    const fill = createFill();
    // WTF? Why should I use `as` here?
    const connectedPipes = adjuncts.filter(isPipe) as ConnectedPipes<TAdjuncts>;

    const displayName = fill.displayName || getNonEmptyDisplayName(adjuncts);

    let debugInstruction: null | DebugInstruction = null;
    let debug: null | Debugger = null;

    if (process.env.NODE_ENV === 'development') {
      debugInstruction = getDebugInstruction(adjuncts);
      debug = debugInstruction?.createDebugger(displayName) ?? null;
    }

    const state: PipeState<TAdjuncts> = {
      streamGroups: {},
      childPipeLinks: [],
      operative: true,
    };

    const pipe: BasePipe<TValue> = createPipe(state.childPipeLinks, displayName, debugInstruction);

    let emitNum = 0;
    const getStreamHead = () => Symbol(`${displayName} (emit #${ ++ emitNum})`);

    const emitStream = (optionalStreamHead: null | symbol, value: TValue, streamGroup: FilledStreamGroup<TAdjuncts>): void => {
      if (state.operative) {
        const streamHead = optionalStreamHead ?? getStreamHead();

        if (state.childPipeLinks.length) {
          if (process.env.NODE_ENV === 'development') {
            debug?.onStreamEmit(deepCopy({ streamHead, value, pipeState: state }));
          }

          const streamReleaseCounter: boolean[] = [];

          state.childPipeLinks.forEach((childPipeLink, index) => {
            streamReleaseCounter[index] = false;

            const stream = createStream(value, () => {
              if (process.env.NODE_ENV === 'development') {
                debug?.onStreamRelease(deepCopy({ streamHead, stream, pipeState: state }));
              }

              streamReleaseCounter[index] = true;

              if (streamReleaseCounter.every(Boolean)) {
                if (process.env.NODE_ENV === 'development') {
                  if (streamGroup.members.length) {
                    debug?.onStreamGroupRelease(deepCopy({ streamGroup, pipeState: state }));
                  }
                }

                streamGroup.release();
              }
            });

            childPipeLink.onStream(streamHead, stream);
          });
        }
        else {
          if (process.env.NODE_ENV === 'development') {
            debug?.onStreamGroupRelease(deepCopy({ streamGroup, pipeState: state }));
          }

          streamGroup.release();
        }
      }
    };

    const terminate = (): void => {
      if (state.operative) {
        state.operative = false;

        Object.getOwnPropertySymbols(state.streamGroups).forEach((streamHead) => {
          delete state.streamGroups[streamHead];
        });
      }
    };

    const handleParentStream = (parentPipeIndex: number, streamHead: symbol, stream: Stream): void => {
      if (state.operative) {
        let prevPipeState: PipeState = state;

        if (process.env.NODE_ENV === 'development') {
          prevPipeState = deepCopy(state);
        }

        const streamGroup = state.streamGroups[streamHead] ?? (state.streamGroups[streamHead] = createStreamGroup(streamHead, connectedPipes.length));

        if ( ! streamGroup.members[parentPipeIndex]) {
          streamGroup.members[parentPipeIndex] = stream;
        }
        else {
          stream.release();
        }

        if (process.env.NODE_ENV === 'development') {
          debug?.onParentPipeStream(deepCopy({ parentPipeIndex, streamHead, stream, prevPipeState, pipeState: state }));
        }

        if (checkStreamGroup(streamGroup)) {
          if (process.env.NODE_ENV === 'development') {
            prevPipeState = deepCopy(state);
          }

          delete state.streamGroups[streamHead];

          if (process.env.NODE_ENV === 'development') {
            debug?.onStreamGroupFulfill(deepCopy({ streamGroup, prevPipeState, pipeState: state }));
          }

          fill(getStreamGroupValues(streamGroup), (value) => emitStream(streamHead, value, streamGroup));
        }
      }
    };

    const handleParentTerminate = (_parentPipeIndex: number): void => {
      if (state.operative) {
        terminate();
      }
    };

    const fakeStreamHead = Symbol();
    const fakeStreamGroup = createStreamGroup(fakeStreamHead, 0) as FilledStreamGroup<TAdjuncts>;
    const fakeEmitStream = (value: TValue) => emitStream(null, value, fakeStreamGroup);

    let unmountTerminate = () => {};

    if (connectedPipes.length) {
      connectedPipes.forEach((pipeHolder, index) => pipeHolder.connect(
        (streamHead, stream) => handleParentStream(index, streamHead, stream),
        () => handleParentTerminate(index)
      ));
    }
    else {
      unmountTerminate = fill(getStreamGroupValues(fakeStreamGroup), fakeEmitStream) ?? unmountTerminate;
    }

    if (process.env.NODE_ENV === 'development') {
      debug?.onPipeCreate(deepCopy({ pipeState: state }));
    }

    return [pipe, fakeEmitStream, unmountTerminate];
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => {
      unmountTerminate();
    };
  }, []); // eslint-disable-line

  return [pipe, emitStream];
}

function createPipe<
  TValue extends any = any,
>(childPipeLinks: ChildPipeLink[], displayName?: null | string, debugInstruction?: null | DebugInstruction): BasePipe<TValue> {
  return {
    type: PIPE,
    displayName,
    debugInstruction,
    connections: 0,
    connect(onStream, onTerminate) {
      this.connections ++;
      const childPipeLink = createChildPipeLink(onStream, onTerminate);
      childPipeLinks.push(childPipeLink);
    },
  };
}

function createChildPipeLink<
  TValue extends any = any,
>(onStream: OnParentStream<TValue>, onTerminate: OnParentTerminate): ChildPipeLink<TValue> {
  return {
    onStream,
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

function createStreamGroup<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(streamHead: symbol, length: number): StreamGroup<TAdjuncts> {
  return {
    streamHead,
    members: Array(length).fill(null),
    release() {
      this.members.forEach((stream) => stream?.release());
    },
  } as StreamGroup<TAdjuncts>;
}

function checkStreamGroup<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(streamGroup: StreamGroup<TAdjuncts>): streamGroup is FilledStreamGroup<TAdjuncts> {
  return streamGroup.members.every(Boolean);
}

function getStreamGroupValues<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(streamGroup: FilledStreamGroup<TAdjuncts>): StreamGroupValues<TAdjuncts> {
  return streamGroup.members.map((stream) => stream.value) as StreamGroupValues<TAdjuncts>;
}

export function getDisplayName(adjuncts: Adjunct[]): string {
  const mainPipe = adjuncts.find<BasePipe>(isPipe);
  return mainPipe?.displayName ? `${mainPipe.displayName} / [${mainPipe.connections + 1}]` : '';
}

export function getNonEmptyDisplayName(adjuncts: Adjunct[]): string {
  return getDisplayName(adjuncts) || 'unknown';
}

export function getDebugInstruction(adjuncts: Adjunct[]): null | DebugInstruction {
  return adjuncts.find<DebugInstruction>(isDebugInstruction)
    ?? adjuncts.find<BasePipeWithDebugInstruction>(isPipeWithDebugInstruction)?.debugInstruction
    ?? null;
}
