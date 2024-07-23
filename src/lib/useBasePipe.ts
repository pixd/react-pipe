import { useMemo, useEffect } from 'react';

import { isDebugInstruction, isInstructionWithDisplayName, isPipe, isPipeWithCreateDebugger }
  from './check';
import { deepCopy } from './deepCopy';
import { isFinal, Final } from './FINAL';
import { MOUNT_STREAM_HEAD } from './mountStreamHead';
import { PIPE_ENTITY_TYPE, Adjunct, BasePipe, CommonPipeState, DataPipe, DownstreamConnection,
  Debugger, OnParentPipeStreamEmit, OnParentPipeStreamTerminate, PipeType, PipeState, Stream,
  StreamGroup, StreamGroupMembers, StreamGroupValues } from './types';

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
    emitValue: Emit<TValue | Final<TValue>>,
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

export function createPipeKit(createFill: () => Fill, adjuncts: Adjunct[]): PipeKit {
  const pipeState: PipeState = {
    parentPipes: adjuncts.filter(isPipe),
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

  let debug: null | Debugger = null;

  const emitValue = (streamGroup: StreamGroup, value: any): void => {
    if (pipeState.dataPipe.operative && isStreamGroupActive(streamGroup)) {
      const streamHead = Symbol();

      const streamReleaseCounter: boolean[] = Array(pipeState.dataPipe.downstreamConnections.length).fill(false);

      streamGroup.emitValueGroups[streamHead] = streamReleaseCounter;

      if (isFinal(value)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe finally emitted a value', deepCopy({ streamHead, value, valueType: 'data', finally: true, streamGroup, pipeState }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe emitted a value', deepCopy({ streamHead, value, valueType: 'data', finally: false, streamGroup, pipeState }));
        }
      }

      if (pipeState.dataPipe.downstreamConnections.length) {
        pipeState.dataPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(getEmittedValue(value), () => {
            streamReleaseCounter[index] = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamEvent('Stream had been released', deepCopy({ streamHead, stream, streamGroup, pipeState }));
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
          debug?.onEmit('Pipe finally emitted an error', deepCopy({ streamHead, value: error, valueType: 'error', finally: true, streamGroup, pipeState }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe emitted an error', deepCopy({ streamHead, value: error, valueType: 'error', finally: false, streamGroup, pipeState }));
        }
      }

      if (pipeState.errorPipe.downstreamConnections.length) {
        pipeState.errorPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(getEmittedValue(error), () => {
            streamReleaseCounter[index] = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamEvent('Stream had been released', deepCopy({ streamHead, stream, streamGroup, pipeState }));
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

  const handleParentPipeStreamEmit = (parentPipeIndex: number, parentPipeUniqKey: symbol, streamHead: symbol, stream: Stream): void => {
    if (pipeState.dataPipe.operative) {
      if (process.env.NODE_ENV === 'development') {
        debug?.onStreamEvent('Pipe received a stream', deepCopy({ parentPipeIndex, parentPipeUniqKey, streamHead, stream, pipeState }));
      }

      if (pipeState.streamGroups[streamHead]?.members[parentPipeIndex]) {
        // TODO Log this
        // Warn, cause it's not normal case. Some upstream pipe emit a stream with previously used
        // stream head which has not released.
        stream.release();
      }

      const streamGroup = pipeState.streamGroups[streamHead] ?? createStreamGroup(streamHead, pipeState.parentPipes.length);
      streamGroup.members[parentPipeIndex] = stream;

      if (pipeState.streamGroups[streamHead]) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupEvent('Stream group updated', deepCopy({ streamGroup, pipeState }));
        }
      }
      else {
        pipeState.streamGroups[streamHead] = streamGroup;

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupCreate('Stream group created', deepCopy({ streamHead, streamGroup, pipeState }));
        }
      }

      if (isStreamGroupFulfilled(streamGroup)) {
        streamGroup.status = 'active';

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupEvent('Stream group had been fulfilled', deepCopy({ streamGroup, pipeState }));
        }

        streamGroup.finish = fill(
          getFulfilledStreamGroupValues(streamGroup),
          (value) => emitValue(streamGroup, value),
          (error) => emitError(streamGroup, error),
        );
      }
    }
    else {
      // TODO Log this
      // Is it normal case?
      stream.release();
    }
  };

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, parentPipeUniqKey: symbol, streamHead: symbol): void => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamEvent('Pipe is terminating a stream', deepCopy({ parentPipeIndex, parentPipeUniqKey, streamHead, pipeState }));
    }

    terminateStreamGroup(pipeState.streamGroups[streamHead]);

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamEvent('Pipe terminated a stream', deepCopy({ parentPipeIndex, parentPipeUniqKey, streamHead, pipeState }));
    }
  };

  const handleEmit = (value: any) => {
    // TODO Log this
    const mountStreamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);
    mountStreamGroup.status = 'active';

    emitValue(mountStreamGroup, value);
  };

  const handleReset = () => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onPipeEvent('Pipe is resetting', deepCopy({ pipeState }));
    }

    Object.getOwnPropertySymbols(pipeState.streamGroups).forEach((streamHead) => {
      terminateStreamGroup(pipeState.streamGroups[streamHead]);
    });

    if (process.env.NODE_ENV === 'development') {
      debug?.onPipeEvent('Pipe resetted', deepCopy({ pipeState }));
    }
  };

  const finishStreamGroup = (streamGroup: StreamGroup) => {
    streamGroup.status = 'finished';
    streamGroup.finish?.();

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Pipe finished a stream group', deepCopy({ streamGroup, pipeState }));
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
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Pipe is releasing a stream group', deepCopy({ streamGroup, pipeState }));
    }

    delete pipeState.streamGroups[streamGroup.streamHead];
    streamGroup.members.forEach((stream) => stream?.release());

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Pipe released a stream group', deepCopy({ streamGroup, pipeState }));
    }
  };

  const terminateStreamGroup = (streamGroup: StreamGroup) => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Pipe is terminating a stream group', deepCopy({ streamGroup, pipeState }));
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
      debug?.onStreamGroupEvent('Pipe terminated a stream group', deepCopy({ streamGroup, pipeState }));
    }
  };

  let inheritedDisplayName;
  if (pipeState.parentPipes.length) {
    pipeState.parentPipes.forEach((parentPipe, index) => {
      const { connectionIndex } = parentPipe.connect(
        (streamHead, stream) => handleParentPipeStreamEmit(index, parentPipe.uniqKey, streamHead, stream),
        (streamHead) => handleParentPipeStreamTerminate(index, parentPipe.uniqKey, streamHead)
      );

      if (process.env.NODE_ENV === 'development') {
        if (index === 0) {
          inheritedDisplayName = `${parentPipe.displayName} => Downstream pipe #${connectionIndex + 1}`;
        }
      }
    });
  }

  const pipe: BasePipe = createPipe('data', pipeState.dataPipe, handleEmit, () => null, handleReset, () => null);
  const errorPipe: BasePipe = createPipe('error', pipeState.errorPipe, handleEmit, () => null, handleReset, () => null);

  const dataPipe = pipe as DataPipe;
  dataPipe.error = errorPipe;

  if (process.env.NODE_ENV === 'development') {
    const instructionWithDisplayName = adjuncts.findLast(isInstructionWithDisplayName);
    const debugInstruction = adjuncts.findLast(isDebugInstruction);
    const createDebugger = debugInstruction?.createDebugger ?? adjuncts.findLast(isPipeWithCreateDebugger)?.createDebugger;

    const displayName = pipeState.displayName = instructionWithDisplayName?.displayName || fill.displayName || inheritedDisplayName || 'unknown';

    debug = createDebugger?.(displayName) ?? null;

    pipe.displayName = displayName;
    pipe.createDebugger = createDebugger;
    pipe.uniqKey = pipeState.dataPipe.uniqKey = Symbol(pipe.displayName);

    errorPipe.displayName = `${displayName} error pipe`;
    errorPipe.createDebugger = createDebugger;
    errorPipe.uniqKey = pipeState.errorPipe.uniqKey = Symbol(errorPipe.displayName);

    handleReset.displayName = `${displayName} reset`;

    debug?.onPipeCreate('Pipe created', deepCopy({ pipeState }));
  }

  if (pipeState.parentPipes.length === 0) {
    let prevPipeState = pipeState;
    if (process.env.NODE_ENV === 'development') {
      prevPipeState = deepCopy(pipeState);
    }

    const mountStreamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupCreate('Stream group created', deepCopy({ streamHead: MOUNT_STREAM_HEAD, streamGroup: mountStreamGroup, prevPipeState, pipeState }));
      prevPipeState = deepCopy(pipeState);
    }

    mountStreamGroup.status = 'active';

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Stream group had been fulfilled', deepCopy({ streamGroup: mountStreamGroup, prevPipeState, pipeState }));
    }

    mountStreamGroup.finish = fill(
      [],
      (value) => emitValue(mountStreamGroup, value),
      (error) => emitError(mountStreamGroup, error),
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
