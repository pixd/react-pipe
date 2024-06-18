import { useMemo, useEffect } from 'react';

import { isDebugInstruction, isPipe, isPipeWithDebugInstruction } from './check';
import { deepCopy } from './deepCopy';
import { isFinal, Final } from './FINAL';
import { MOUNT_STREAM_HEAD } from './mountStreamHead';
import { PIPE_ENTITY_TYPE, Adjunct, BasePipe, BasePipeWithDebugInstruction, CommonPipeState, DataPipe,
  DownstreamConnection, Debugger, DebugInstruction, OnParentStream, OnParentTerminate, PipeType,
  PipeState, Stream, StreamGroup, StreamGroupMembers, StreamGroupValues } from './types';

export type Emit<
  TValue extends any = any,
> = {
  (
    value: TValue,
  ): void;
};

export type Fill<
  TValue extends any = any,
  TStreamGroupValues extends any[] = any[],
> = {
  (
    streamGroupValues: TStreamGroupValues,
    emitStream: Emit<TValue | Final<TValue>>,
    emitError: Emit,
  ): null | (() => void);
  displayName?: string;
};

export type PipeKit<
  TValue extends any = any,
> = [DataPipe<TValue>, undefined | (() => void)];

export function useBasePipe<
  TValue extends any = any,
  TAdjuncts extends [] | [Adjunct] | [Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | [Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct, Adjunct] | Adjunct[] = Adjunct[],
>(
  createFill: () => Fill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts?: TAdjuncts,
): DataPipe<TValue>

export function useBasePipe(createFill: () => Fill, adjuncts: Adjunct[]): DataPipe {
  const [pipe, onUnmount] = useMemo(() => {
    return createPipeKit(createFill, adjuncts);
  }, []); // eslint-disable-line

  useEffect(() => onUnmount, [onUnmount]);

  return pipe;
}

function createPipeKit(createFill: () => Fill, adjuncts: Adjunct[]): PipeKit {
  const state: PipeState = {
    upstreamPipes: adjuncts.filter(isPipe),
    streamGroups: {},
    dataPipe: {
      uniqKey: Symbol(),
      downstreamConnections: [],
      operative: true,
    },
    errorPipe: {
      uniqKey: Symbol(),
      downstreamConnections: [],
      operative: true,
    },
  };

  const fill = createFill();

  let displayName = fill.displayName || null;
  let debugInstruction: null | DebugInstruction = null;
  let debug: null | Debugger = null;

  const emitValue = (streamGroup: StreamGroup, value: any): void => {
    if (state.dataPipe.operative && isStreamGroupActive(streamGroup)) {
      const streamHead = Symbol();

      const streamReleaseCounter: boolean[] = Array(state.dataPipe.downstreamConnections.length).fill(false);

      streamGroup.emitValueGroups[streamHead] = streamReleaseCounter;

      if (isFinal(value)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value, valueType: 'data', finally: true, streamGroup, pipeState: state }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value, valueType: 'data', finally: false, streamGroup, pipeState: state }));
        }
      }

      if (state.dataPipe.downstreamConnections.length) {
        state.dataPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(getEmittedValue(value), () => {
            streamReleaseCounter[index] = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamRelease(deepCopy({ streamHead, stream, streamGroup, pipeState: state }));
            }

            if (streamReleaseCounter.every(Boolean)) {
              delete streamGroup.emitValueGroups[streamHead];
              tryReleaseStreamGroup(streamGroup);
            }
          });

          downstreamConnection.onStream(streamHead, stream);
        });
      }
      else {
        delete streamGroup.emitValueGroups[streamHead];
        tryReleaseStreamGroup(streamGroup);
      }
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        if ( ! state.dataPipe.operative) {
          // TODO Log this
          // Is it normal case?
          return;
        }

        if (isStreamGroupFinished(streamGroup)) {
          // TODO Log this
          // Warn, cause it's not normal case. User pipe fill method still active after FINAL.
          return;
        }
      }
    }
  };

  const emitError = (streamGroup: StreamGroup, error: any): void => {
    if (state.errorPipe.operative && isStreamGroupActive(streamGroup)) {
      const streamHead = Symbol();

      const streamReleaseCounter: boolean[] = Array(state.errorPipe.downstreamConnections.length).fill(false);

      streamGroup.emitErrorGroups[streamHead] = streamReleaseCounter;

      if (isFinal(error)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value: error, valueType: 'error', finally: true, streamGroup, pipeState: state }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value: error, valueType: 'error', finally: false, streamGroup, pipeState: state }));
        }
      }

      if (state.errorPipe.downstreamConnections.length) {
        state.errorPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(getEmittedValue(error), () => {
            streamReleaseCounter[index] = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamRelease(deepCopy({ streamHead, stream, streamGroup, pipeState: state }));
            }

            if (streamReleaseCounter.every(Boolean)) {
              delete streamGroup.emitErrorGroups[streamHead];
              tryReleaseStreamGroup(streamGroup);
            }
          });

          downstreamConnection.onStream(streamHead, stream);
        });
      }
      else {
        delete streamGroup.emitErrorGroups[streamHead];
        tryReleaseStreamGroup(streamGroup);
      }
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        if ( ! state.errorPipe.operative) {
          // TODO Log this
          // Is it normal case?
          return;
        }

        if (isStreamGroupFinished(streamGroup)) {
          // TODO Log this
          // Warn, cause it's not normal case. User pipe fill method still active after FINAL.
          return;
        }
      }
    }
  };

  const handleParentPipeStream = (parentPipeIndex: number, streamHead: symbol, stream: Stream): void => {
    if (state.dataPipe.operative) {
      let prevPipeState = state;
      if (process.env.NODE_ENV === 'development') {
        prevPipeState = deepCopy(state);
      }

      if (state.streamGroups[streamHead]?.members[parentPipeIndex]) {
        // TODO Log this
        // Warn, cause it's not normal case. Some upstream pipe emit a stream with previously used
        // stream head which has not released.
        stream.release();
      }

      const streamGroup = state.streamGroups[streamHead] ??= createStreamGroup(streamHead, state.upstreamPipes.length);
      streamGroup.members[parentPipeIndex] = stream;

      if (process.env.NODE_ENV === 'development') {
        debug?.onParentPipeStream(deepCopy({ parentPipeIndex, streamHead, stream, streamGroup, prevPipeState, pipeState: state }));
      }

      if (isStreamGroupFulfilled(streamGroup)) {
        let prevPipeState = state;
        if (process.env.NODE_ENV === 'development') {
          prevPipeState = deepCopy(state);
        }

        streamGroup.status = 'active';

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupFulfill(deepCopy({ streamGroup, prevPipeState, pipeState: state }));
        }

        streamGroup.finish = fill(
          getFulfilledStreamGroupValues(streamGroup),
          (...args) => emitValue(streamGroup, ...args),
          (...args) => emitError(streamGroup, ...args),
        );
      }
    }
    else {
      // TODO Log this
      // Is it normal case?
      stream.release();
    }
  };

  const handleParentPipeTerminate = (parentPipeIndex: number, streamHead: symbol): void => {
    let prevPipeState = state;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(state);
      debug?.onParentPipeTerminate(deepCopy({ parentPipeIndex, streamHead, pipeState: state }));
    }

    terminateStreamGroup(state.streamGroups[streamHead]);

    if (process.env.NODE_ENV === 'development') {
      debug?.onParentPipeTerminated(deepCopy({ parentPipeIndex, streamHead, prevPipeState, pipeState: state }));
    }
  };

  const handleEmit = (value: any) => {
    // TODO Log this
    const mountStreamGroup = state.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);
    mountStreamGroup.status = 'active';

    emitValue(mountStreamGroup, value);
  };

  const handleCancel = () => {
    let prevPipeState = state;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(state);
      debug?.onPipeCancel(deepCopy({ pipeState: state }));
    }

    Object.getOwnPropertySymbols(state.streamGroups).forEach((streamHead) => {
      terminateStreamGroup(state.streamGroups[streamHead]);
    });

    if (process.env.NODE_ENV === 'development') {
      debug?.onPipeCanceled(deepCopy({ prevPipeState, pipeState: state }));
    }
  };

  const finishStreamGroup = (streamGroup: StreamGroup) => {
    streamGroup.status = 'finished';
    streamGroup.finish?.();

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupFinished(deepCopy({ streamGroup, pipeState: state }));
    }
  };

  const tryReleaseStreamGroup = (streamGroup: StreamGroup) => {
    if (isStreamGroupFinished(streamGroup)) {
      if ( ! Object.values(streamGroup.emitValueGroups).length && ! Object.values(streamGroup.emitErrorGroups).length) {
        releaseStreamGroup(streamGroup);
      }
    }
  };

  const releaseStreamGroup = (streamGroup: StreamGroup) => {
    let prevPipeState = state;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(state);
      debug?.onStreamGroupRelease(deepCopy({ streamGroup, pipeState: state }));
    }

    delete state.streamGroups[streamGroup.streamHead];
    streamGroup.members.forEach((stream) => stream?.release());

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupReleased(deepCopy({ streamGroup, prevPipeState, pipeState: state }));
    }
  };

  const terminateStreamGroup = (streamGroup: StreamGroup) => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupTerminate(deepCopy({ streamGroup, pipeState: state }));
    }

    if (isStreamGroupActive(streamGroup)) {
      finishStreamGroup(streamGroup);

      if (state.dataPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.emitValueGroups).forEach((streamHead) => {
          streamGroup.emitValueGroups[streamHead].forEach((released, index) => {
            if ( ! released) {
              state.dataPipe.downstreamConnections[index].onTerminate(streamHead);
            }
          });
        });
      }

      if (state.errorPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.emitErrorGroups).forEach((streamHead) => {
          streamGroup.emitErrorGroups[streamHead].forEach((released, index) => {
            if ( ! released) {
              state.errorPipe.downstreamConnections[index].onTerminate(streamHead);
            }
          });
        });
      }

      if ( ! state.dataPipe.downstreamConnections.length && ! state.errorPipe.downstreamConnections.length) {
        releaseStreamGroup(streamGroup);
      }
    }
    else {
      releaseStreamGroup(streamGroup);
    }
  };

  if (state.upstreamPipes.length) {
    state.upstreamPipes.forEach((upstreamPipe, index) => {
      const { connectionIndex } = upstreamPipe.connect(
        (...args) => handleParentPipeStream(index, ...args),
        (...args) => handleParentPipeTerminate(index, ...args)
      );

      if (process.env.NODE_ENV === 'development') {
        if (index === 0 && ! displayName) {
          displayName = `${upstreamPipe.displayName} / ${connectionIndex + 1}`;
        }
      }
    });
  }

  const pipe: BasePipe = createPipe('data', state.dataPipe, handleEmit, handleCancel, () => null);
  const errorPipe: BasePipe = createPipe('error', state.errorPipe, handleEmit, handleCancel, () => null);

  const dataPipe = pipe as DataPipe;
  dataPipe.error = errorPipe;

  if (process.env.NODE_ENV === 'development') {
    displayName = displayName || 'unknown';
    debugInstruction = getDebugInstruction(adjuncts);
    debug = debugInstruction?.createDebugger(displayName) ?? null;

    pipe.displayName = displayName;
    pipe.debugInstruction = debugInstruction;
    pipe.uniqKey = state.dataPipe.uniqKey = Symbol(pipe.displayName);

    errorPipe.displayName = `${displayName} (error)`;
    errorPipe.debugInstruction = debugInstruction;
    errorPipe.uniqKey = state.errorPipe.uniqKey = Symbol(errorPipe.displayName);

    handleCancel.displayName = `Cancel ${displayName}`;

    debug?.onPipeCreate(deepCopy({ pipeState: state }));
  }

  if (state.upstreamPipes.length === 0) {
    let prevPipeState = state;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(state);
    }

    const mountStreamGroup = state.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);

    if (process.env.NODE_ENV === 'development') {
      debug?.onMountStream(deepCopy({ streamHead: MOUNT_STREAM_HEAD, streamGroup: mountStreamGroup, prevPipeState, pipeState: state }));
      prevPipeState = deepCopy(state);
    }

    mountStreamGroup.status = 'active';

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupFulfill(deepCopy({ streamGroup: mountStreamGroup, prevPipeState, pipeState: state }));
    }

    mountStreamGroup.finish = fill(
      [],
      (...args) => emitValue(mountStreamGroup, ...args),
      (...args) => emitError(mountStreamGroup, ...args),
    );
  }

  return [dataPipe, undefined];
}

export function createPipe<
  TValue extends any = any,
>(pipeType: PipeType, pipeState: CommonPipeState, emit: (value: TValue) => void, cancel: () => void, die: () => void): BasePipe<TValue> {
  return {
    entityType: PIPE_ENTITY_TYPE,
    type: pipeType,
    uniqKey: pipeState.uniqKey,
    displayName: null,
    debugInstruction: null,
    connect(onStream, onTerminate) {
      const downstreamConnection = createDownstreamConnection(onStream, onTerminate);
      const connectionNum = pipeState.downstreamConnections.push(downstreamConnection);

      return {
        connectionIndex: connectionNum - 1,
      };
    },
    emit,
    cancel,
    die,
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
  const uniqKey = Symbol();

  return {
    uniqKey,
    streamHead,
    status: 'idle',
    members: createStreamGroupMembers(length),
    emitValueGroups: {},
    emitErrorGroups: {},
    finish: null,
  };
}

function createStreamGroupMembers<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(length: number): StreamGroupMembers<TAdjuncts> {
  return Array(length).fill(null) as StreamGroupMembers<TAdjuncts>;
}

function isStreamGroupFulfilled<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(streamGroup: StreamGroup<TAdjuncts>): boolean {
  return streamGroup.members.every(Boolean);
}

function isStreamGroupActive(streamGroup: StreamGroup): boolean {
  return streamGroup.status === 'active';
}

function isStreamGroupFinished(streamGroup: StreamGroup): boolean {
  return streamGroup.status === 'finished';
}

function getFulfilledStreamGroupValues<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(streamGroup: StreamGroup<TAdjuncts>): StreamGroupValues<TAdjuncts> {
  return streamGroup.members.map((stream) => stream?.value) as StreamGroupValues<TAdjuncts>;
}

function getEmittedValue<
  TValue extends any = any,
>(value: TValue | Final<TValue>): TValue {
  if (isFinal(value)) {
    return value.value;
  }
  else {
    return value;
  }
}

export function getDebugInstruction(adjuncts: Adjunct[]): null | DebugInstruction {
  return null
    ?? adjuncts.find<DebugInstruction>(isDebugInstruction)
    ?? adjuncts.find<BasePipeWithDebugInstruction>(isPipeWithDebugInstruction)?.debugInstruction
    ?? null;
}
