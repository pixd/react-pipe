import { useMemo, useEffect } from 'react';

import { isDebugInstruction, isPipe, isPipeWithDebugInstruction } from './check';
import { deepCopy } from './deepCopy';
import { PIPE, Adjunct, BasePipe, BasePipeWithDebugInstruction, DataPipe, DownstreamConnection,
  Debugger, DebugInstruction, FilledStreamGroup, OnParentStream, OnParentTerminate, PipeState,
  StreamGroupValues, Stream, StreamGroup } from './types';

export type Emit<
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
    emitStream: Emit<TValue>,
    emitError: Emit,
  ): null | (() => void);
  displayName?: string;
};

export type PipeKit<
  TValue extends any = any,
> = [DataPipe<TValue>, null | (() => void)];

export function useBasePipe<
  TValue extends any = any,
  TAdjunct extends Adjunct = Adjunct,
  TAdjuncts extends [] | [TAdjunct] | [TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | [TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct, TAdjunct] | (TAdjunct)[] = (TAdjunct)[],
>(
  createFill: () => Fill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts?: TAdjuncts,
): DataPipe<TValue>

export function useBasePipe(createFill: () => Fill, adjuncts: Adjunct[]): DataPipe {
  const [pipe, onUnmount] = useMemo(() => {
    return createPipeKit(createFill, adjuncts);
  }, []); // eslint-disable-line

  if (onUnmount) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return onUnmount;
    }, []); // eslint-disable-line
  }

  return pipe;
}

function createPipeKit(createFill: () => Fill, adjuncts: Adjunct[]): PipeKit {
  const state: PipeState = {
    operative: true,
    streamGroups: {},
    upstreamPipes: adjuncts.filter(isPipe),
    downstreamConnections: [],
    errorPipeDownstreamConnections: [],
  };

  const fill = createFill();

  const displayName = fill.displayName || getNonEmptyDisplayName(adjuncts);
  const errorPipeDisplayName = `${displayName} (error)`;

  let debugInstruction: null | DebugInstruction = null;
  let debug: null | Debugger = null;
  if (process.env.NODE_ENV === 'development') {
    debugInstruction = getDebugInstruction(adjuncts);
    debug = debugInstruction?.createDebugger(displayName) ?? null;
  }

  const createStreamHead = getStreamHeadCreator(displayName);

  const emitStream = (streamHead: symbol, streamGroup: FilledStreamGroup, value: any): void => {
    if (state.operative) {
      if (process.env.NODE_ENV === 'development') {
        debug?.onStreamEmit(deepCopy({ streamHead, value, pipeState: state }));
      }

      if (state.downstreamConnections.length) {
        const streamReleaseCounter: boolean[] = [];

        state.downstreamConnections.forEach((downstreamConnection, index) => {
          streamReleaseCounter[index] = false;

          const stream = createStream(value, () => {
            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamRelease(deepCopy({ streamHead, stream, pipeState: state }));
            }

            streamReleaseCounter[index] = true;

            if (streamReleaseCounter.every(Boolean)) {
              if (process.env.NODE_ENV === 'development') {
                debug?.onStreamGroupRelease(deepCopy({ streamGroup, pipeState: state }));
              }

              streamGroup.release();
            }
          });

          downstreamConnection.onStream(streamHead, stream);
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

  const emitError = (streamHead: symbol, streamGroup: FilledStreamGroup, error: any): void => {
    if (state.operative) {
      if (process.env.NODE_ENV === 'development') {
        debug?.onErrorEmit(deepCopy({ streamHead, error, pipeState: state }));
      }

      if (state.errorPipeDownstreamConnections.length) {
        const streamReleaseCounter: boolean[] = [];

        state.errorPipeDownstreamConnections.forEach((downstreamConnection, index) => {
          streamReleaseCounter[index] = false;

          const stream = createStream(error, () => {
            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamRelease(deepCopy({ streamHead, stream, pipeState: state }));
            }

            streamReleaseCounter[index] = true;

            if (streamReleaseCounter.every(Boolean)) {
              if (process.env.NODE_ENV === 'development') {
                debug?.onStreamGroupRelease(deepCopy({ streamGroup, pipeState: state }));
              }

              streamGroup.release();
            }
          });

          downstreamConnection.onStream(streamHead, stream);
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

  const handleParentPipeStream = (parentPipeIndex: number, streamHead: symbol, stream: Stream): void => {
    if (state.operative) {
      let prevPipeState = state;
      if (process.env.NODE_ENV === 'development') {
        prevPipeState = deepCopy(state);
      }

      const streamGroup = state.streamGroups[streamHead]
        ?? (state.streamGroups[streamHead] = createStreamGroup(streamHead, state.upstreamPipes.length));

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

        fill(
          getStreamGroupValues(streamGroup),
          (...args) => emitStream(streamHead, streamGroup, ...args),
          (...args) => emitError(streamHead, streamGroup, ...args),
        );
      }
    }
  };

  const handleParentPipeTerminate = (_parentPipeIndex: number): void => {
    if (state.operative) {
      terminate();
    }
  };

  let onUnmount = null;

  if (state.upstreamPipes.length) {
    state.upstreamPipes.forEach((upstreamPipe, index) => upstreamPipe.connect(
      (...args) => handleParentPipeStream(index, ...args),
      (...args) => handleParentPipeTerminate(index, ...args)
    ));
  }
  else {
    const mountStreamHead = createStreamHead('mount');
    const mountStreamGroup = createStreamGroup(mountStreamHead, 0) as FilledStreamGroup;

    onUnmount = fill(
      getStreamGroupValues(mountStreamGroup),
      (...args) => emitStream(mountStreamHead, mountStreamGroup, ...args),
      (...args) => emitError(mountStreamHead, mountStreamGroup, ...args),
    );
  }

  const errorPipe: BasePipe = createPipe(state.errorPipeDownstreamConnections);
  errorPipe.displayName = errorPipeDisplayName;
  errorPipe.debugInstruction = debugInstruction;

  const pipe: BasePipe = createPipe(state.downstreamConnections);
  pipe.displayName = displayName;
  pipe.debugInstruction = debugInstruction;

  const dataPipe = pipe as DataPipe;
  dataPipe.error = errorPipe;

  if (process.env.NODE_ENV === 'development') {
    debug?.onPipeCreate(deepCopy({ pipeState: state }));
  }

  return [dataPipe, onUnmount];
}

function createPipe<
  TValue extends any = any,
>(downstreamConnections: DownstreamConnection[]): BasePipe<TValue> {
  return {
    type: PIPE,
    connections: 0,
    connect(onStream, onTerminate) {
      this.connections ++;
      const downstreamConnection = createDownstreamConnection(onStream, onTerminate);
      downstreamConnections.push(downstreamConnection);
    },
  };
}

function createDownstreamConnection<
  TValue extends any = any,
>(onStream: OnParentStream<TValue>, onTerminate: OnParentTerminate): DownstreamConnection<TValue> {
  return {
    onStream,
    onTerminate,
  };
}

function getStreamHeadCreator(displayName: string) {
  let emitNum = 0;
  return function createStreamHead(optionalDesc?: string) {
    const desc = optionalDesc ?? `emit #${ ++ emitNum}`;
    return Symbol(`${displayName} (${desc})`);
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
  return null
    ?? adjuncts.find<DebugInstruction>(isDebugInstruction)
    ?? adjuncts.find<BasePipeWithDebugInstruction>(isPipeWithDebugInstruction)?.debugInstruction
    ?? null;
}
