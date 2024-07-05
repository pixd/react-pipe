import { useMemo, useEffect } from 'react';

import { isDebugInstruction, isPipe, isPipeWithDebugInstruction } from './check';
import { deepCopy } from './deepCopy';
import { isFinal, Final } from './FINAL';
import { MOUNT_STREAM_HEAD } from './mountStreamHead';
import { PIPE_ENTITY_TYPE, Adjunct, BasePipe, BasePipeWithDebugInstruction, CommonPipeState, DataPipe,
  DownstreamConnection, Debugger, DebugInstruction, OnParentPipeStreamEmit, OnParentPipeStreamTerminate, PipeType,
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
  const pipeState: PipeState = {
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
    if (pipeState.dataPipe.operative && isStreamGroupActive(streamGroup)) {
      const streamHead = Symbol();

      const streamReleaseCounter: boolean[] = Array(pipeState.dataPipe.downstreamConnections.length).fill(false);

      streamGroup.emitValueGroups[streamHead] = streamReleaseCounter;

      if (isFinal(value)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value, valueType: 'data', finally: true, streamGroup, pipeState }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value, valueType: 'data', finally: false, streamGroup, pipeState }));
        }
      }

      if (pipeState.dataPipe.downstreamConnections.length) {
        pipeState.dataPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(getEmittedValue(value), () => {
            streamReleaseCounter[index] = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamRelease(deepCopy({ streamHead, stream, streamGroup, pipeState }));
            }

            if (streamReleaseCounter.every(Boolean)) {
              delete streamGroup.emitValueGroups[streamHead];
              tryReleaseStreamGroup(streamGroup);
            }
          });

          downstreamConnection.onStreamEmit(streamHead, stream);
        });
      }
      else {
        delete streamGroup.emitValueGroups[streamHead];
        tryReleaseStreamGroup(streamGroup);
      }
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        if ( ! pipeState.dataPipe.operative) {
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
    if (pipeState.errorPipe.operative && isStreamGroupActive(streamGroup)) {
      const streamHead = Symbol();

      const streamReleaseCounter: boolean[] = Array(pipeState.errorPipe.downstreamConnections.length).fill(false);

      streamGroup.emitErrorGroups[streamHead] = streamReleaseCounter;

      if (isFinal(error)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value: error, valueType: 'error', finally: true, streamGroup, pipeState }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit(deepCopy({ streamHead, value: error, valueType: 'error', finally: false, streamGroup, pipeState }));
        }
      }

      if (pipeState.errorPipe.downstreamConnections.length) {
        pipeState.errorPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(getEmittedValue(error), () => {
            streamReleaseCounter[index] = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamRelease(deepCopy({ streamHead, stream, streamGroup, pipeState }));
            }

            if (streamReleaseCounter.every(Boolean)) {
              delete streamGroup.emitErrorGroups[streamHead];
              tryReleaseStreamGroup(streamGroup);
            }
          });

          downstreamConnection.onStreamEmit(streamHead, stream);
        });
      }
      else {
        delete streamGroup.emitErrorGroups[streamHead];
        tryReleaseStreamGroup(streamGroup);
      }
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        if ( ! pipeState.errorPipe.operative) {
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

  const handleParentPipeStreamEmit = (parentPipeIndex: number, streamHead: symbol, stream: Stream): void => {
    if (pipeState.dataPipe.operative) {
      if (process.env.NODE_ENV === 'development') {
        debug?.onParentPipeStreamEmit(deepCopy({ parentPipeIndex, streamHead, stream, pipeState }));
      }

      if (pipeState.streamGroups[streamHead]?.members[parentPipeIndex]) {
        // TODO Log this
        // Warn, cause it's not normal case. Some upstream pipe emit a stream with previously used
        // stream head which has not released.
        stream.release();
      }

      const streamGroup = pipeState.streamGroups[streamHead] ?? createStreamGroup(streamHead, pipeState.upstreamPipes.length);
      streamGroup.members[parentPipeIndex] = stream;

      if (pipeState.streamGroups[streamHead]) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupUpdate(deepCopy({ parentPipeIndex, streamHead, stream, streamGroup, pipeState }));
        }
      }
      else {
        pipeState.streamGroups[streamHead] = streamGroup;

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupCreate(deepCopy({ streamHead, streamGroup, pipeState }));
        }
      }

      if (isStreamGroupFulfilled(streamGroup)) {
        streamGroup.status = 'active';

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupFulfill(deepCopy({ streamGroup, pipeState }));
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

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, streamHead: symbol): void => {
    let prevPipeState = pipeState;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(pipeState);
      debug?.onParentPipeStreamTerminateStart(deepCopy({ parentPipeIndex, streamHead, pipeState }));
    }

    terminateStreamGroup(pipeState.streamGroups[streamHead]);

    if (process.env.NODE_ENV === 'development') {
      debug?.onParentPipeStreamTerminateComplete(deepCopy({ parentPipeIndex, streamHead, prevPipeState, pipeState }));
    }
  };

  const handleEmit = (value: any) => {
    // TODO Log this
    const mountStreamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);
    mountStreamGroup.status = 'active';

    emitValue(mountStreamGroup, value);
  };

  const handleReset = () => {
    let prevPipeState = pipeState;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(pipeState);
      debug?.onPipeResetStart(deepCopy({ pipeState }));
    }

    Object.getOwnPropertySymbols(pipeState.streamGroups).forEach((streamHead) => {
      terminateStreamGroup(pipeState.streamGroups[streamHead]);
    });

    if (process.env.NODE_ENV === 'development') {
      debug?.onPipeResetComplete(deepCopy({ prevPipeState, pipeState }));
    }
  };

  const finishStreamGroup = (streamGroup: StreamGroup) => {
    streamGroup.status = 'finished';
    streamGroup.finish?.();

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupFinish(deepCopy({ streamGroup, pipeState }));
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
    let prevPipeState = pipeState;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(pipeState);
      debug?.onStreamGroupReleaseStart(deepCopy({ streamGroup, pipeState }));
    }

    delete pipeState.streamGroups[streamGroup.streamHead];
    streamGroup.members.forEach((stream) => stream?.release());

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupReleaseComplete(deepCopy({ streamGroup, prevPipeState, pipeState }));
    }
  };

  const terminateStreamGroup = (streamGroup: StreamGroup) => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupTerminateStart(deepCopy({ streamGroup, pipeState }));
    }

    if (isStreamGroupActive(streamGroup)) {
      finishStreamGroup(streamGroup);

      if (pipeState.dataPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.emitValueGroups).forEach((streamHead) => {
          streamGroup.emitValueGroups[streamHead].forEach((released, index) => {
            if ( ! released) {
              pipeState.dataPipe.downstreamConnections[index].onStreamTerminate(streamHead);
            }
          });
        });
      }

      if (pipeState.errorPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.emitErrorGroups).forEach((streamHead) => {
          streamGroup.emitErrorGroups[streamHead].forEach((released, index) => {
            if ( ! released) {
              pipeState.errorPipe.downstreamConnections[index].onStreamTerminate(streamHead);
            }
          });
        });
      }

      if ( ! pipeState.dataPipe.downstreamConnections.length && ! pipeState.errorPipe.downstreamConnections.length) {
        releaseStreamGroup(streamGroup);
      }
    }
    else {
      releaseStreamGroup(streamGroup);
    }
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupTerminateComplete(deepCopy({ streamGroup, pipeState }));
    }
  };

  if (pipeState.upstreamPipes.length) {
    pipeState.upstreamPipes.forEach((upstreamPipe, index) => {
      const { connectionIndex } = upstreamPipe.connect(
        (...args) => handleParentPipeStreamEmit(index, ...args),
        (...args) => handleParentPipeStreamTerminate(index, ...args)
      );

      if (process.env.NODE_ENV === 'development') {
        if (index === 0 && ! displayName) {
          displayName = `${upstreamPipe.displayName} / ${connectionIndex + 1}`;
        }
      }
    });
  }

  const pipe: BasePipe = createPipe('data', pipeState.dataPipe, handleEmit, () => null, handleReset, () => null);
  const errorPipe: BasePipe = createPipe('error', pipeState.errorPipe, handleEmit, () => null, handleReset, () => null);

  const dataPipe = pipe as DataPipe;
  dataPipe.error = errorPipe;

  if (process.env.NODE_ENV === 'development') {
    displayName && (pipeState.displayName = displayName);
    displayName = displayName || 'unknown';
    debugInstruction = getDebugInstruction(adjuncts);
    debug = debugInstruction?.createDebugger(displayName) ?? null;

    pipe.displayName = displayName;
    pipe.debugInstruction = debugInstruction;
    pipe.uniqKey = pipeState.dataPipe.uniqKey = Symbol(pipe.displayName);

    errorPipe.displayName = `${displayName} (error)`;
    errorPipe.debugInstruction = debugInstruction;
    errorPipe.uniqKey = pipeState.errorPipe.uniqKey = Symbol(errorPipe.displayName);

    handleReset.displayName = `Reset ${displayName}`;

    debug?.onPipeCreate(deepCopy({ pipeState }));
  }

  if (pipeState.upstreamPipes.length === 0) {
    let prevPipeState = pipeState;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(pipeState);
    }

    const mountStreamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);

    if (process.env.NODE_ENV === 'development') {
      debug?.onMountStream(deepCopy({ streamHead: MOUNT_STREAM_HEAD, streamGroup: mountStreamGroup, prevPipeState, pipeState }));
      prevPipeState = deepCopy(pipeState);
    }

    mountStreamGroup.status = 'active';

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupFulfill(deepCopy({ streamGroup: mountStreamGroup, prevPipeState, pipeState }));
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
>(pipeType: PipeType, pipeState: CommonPipeState, emitValue: (value: TValue) => void, throwError: (error: any) => void, reset: () => void, terminate: () => void): BasePipe<TValue> {
  return {
    entityType: PIPE_ENTITY_TYPE,
    type: pipeType,
    uniqKey: pipeState.uniqKey,
    connect(onStreamEmit, onStreamTerminate) {
      const downstreamConnection = createDownstreamConnection(onStreamEmit, onStreamTerminate);
      const connectionNum = pipeState.downstreamConnections.push(downstreamConnection);

      return {
        connectionIndex: connectionNum - 1,
      };
    },
    emit: emitValue,
    throw: throwError,
    reset,
    terminate,
  };
}

function createDownstreamConnection<
  TValue extends any = any,
>(onStreamEmit: OnParentPipeStreamEmit<TValue>, onStreamTerminate: OnParentPipeStreamTerminate): DownstreamConnection<TValue> {
  return {
    onStreamEmit,
    onStreamTerminate,
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
