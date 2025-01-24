import { useEffect } from 'react';
import { useMemo } from 'react';

import { isDebugInstruction } from './check';
import { isInstructionWithDisplayName } from './check';
import { isPipe } from './check';
import { isPipeWithCreateDebugger } from './check';
import { deepCopy } from './deepCopy';
import { isFinal, Final } from './FINAL';
import { MOUNT_STREAM_HEAD } from './mountStreamHead';
import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { CommonPipeState } from './types';
import type { DataPipe } from './types';
import type { Debugger } from './types';
import type { DownstreamConnection } from './types';
import type { OnParentPipeStreamEmit } from './types';
import type { OnParentPipeStreamTerminate } from './types';
import type { PipeState } from './types';
import type { PipeType } from './types';
import type { Stream } from './types';
import type { StreamGroup } from './types';
import type { StreamGroupMembers } from './types';
import type { StreamGroupValues } from './types';
import { PIPE_ENTITY_TYPE } from './types';

export type Emit<
  TData extends any = any,
> = {
  (
    data: TData,
  ): void;
};

export type Reset = {
  (): void;
};

export type Fill<
  TValue extends any = any,
  TStreamGroupValues extends any[] = any[],
> = {
  (
    streamGroupValues: TStreamGroupValues,
    emitData: Emit<TValue | Final<TValue>>,
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
  createFill: (reset: Reset) => Fill<TValue, StreamGroupValues<TAdjuncts>>,
  adjuncts?: TAdjuncts,
): DataPipe<TValue>

export function useBasePipe(createFill: (reset: () => void) => Fill, adjuncts: Adjunct[]): DataPipe {
  const [pipe, onUnmount] = useMemo(() => {
    return createPipeKit(createFill, adjuncts);
  }, []); // eslint-disable-line

  useEffect(() => onUnmount, [onUnmount]);

  return pipe;
}

export function createPipeKit(createFill: (reset: () => void) => Fill, adjuncts: Adjunct[]): PipeKit {
  const pipeState: PipeState = {
    parentPipes: adjuncts.filter(isPipe),
    streamGroups: {},
    dataPipe: {
      uniqKey: Symbol(getId()),
      downstreamConnections: [],
      operative: true,
    },
    errorPipe: {
      uniqKey: Symbol(getId()),
      downstreamConnections: [],
      operative: true,
    },
  };

  const emitData = (streamGroup: StreamGroup, data: any): void => {
    if (pipeState.dataPipe.operative && isStreamGroupActive(streamGroup)) {
      const papa = isFinal(data) ? streamGroup.papa : Symbol(getId('papa'));

      streamGroup.emittedDataRegistry[papa] = Array(pipeState.dataPipe.downstreamConnections.length).fill(false);

      if (isFinal(data)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe finally emitted a data', deepCopy({ papa, data, dataType: 'data', finally: true, streamGroup, pipeState }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe emitted a data', deepCopy({ papa, data, dataType: 'data', finally: false, streamGroup, pipeState }));
        }
      }

      if (pipeState.dataPipe.downstreamConnections.length) {
        pipeState.dataPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(papa, getEmittedData(data), () => {
            streamGroup.emittedDataRegistry[papa][index] = true;
            stream.released = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamEvent('Stream has been released', deepCopy({ papa, stream, streamGroup, pipeState }));
            }

            if (streamGroup.emittedDataRegistry[papa].every(Boolean)) {
              delete streamGroup.emittedDataRegistry[papa];
              tryReleaseStreamGroup(streamGroup);
            }
          });

          downstreamConnection.onStreamEmit(stream);
        });
      }
      else {
        delete streamGroup.emittedDataRegistry[papa];
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
      const papa = isFinal(error) ? streamGroup.papa : Symbol(getId('papa'));

      streamGroup.emittedErrorRegistry[papa] = Array(pipeState.errorPipe.downstreamConnections.length).fill(false);

      if (isFinal(error)) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe finally emitted an error', deepCopy({ papa, data: error, dataType: 'error', finally: true, streamGroup, pipeState }));
        }

        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          debug?.onEmit('Pipe emitted an error', deepCopy({ papa, data: error, dataType: 'error', finally: false, streamGroup, pipeState }));
        }
      }

      if (pipeState.errorPipe.downstreamConnections.length) {
        pipeState.errorPipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(papa, getEmittedData(error), () => {
            streamGroup.emittedErrorRegistry[papa][index] = true;
            stream.released = true;

            if (process.env.NODE_ENV === 'development') {
              debug?.onStreamEvent('Stream has been released', deepCopy({ papa, stream, streamGroup, pipeState }));
            }

            if (streamGroup.emittedErrorRegistry[papa].every(Boolean)) {
              delete streamGroup.emittedErrorRegistry[papa];
              tryReleaseStreamGroup(streamGroup);
            }
          });

          downstreamConnection.onStreamEmit(stream);
        });
      }
      else {
        delete streamGroup.emittedErrorRegistry[papa];
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

  const handleParentPipeStreamEmit = (parentPipeIndex: number, parentPipeUniqKey: symbol, stream: Stream): void => {
    if (pipeState.dataPipe.operative) {

      if (pipeState.streamGroups[stream.papa]?.members[parentPipeIndex]) {
        // TODO Log this
        // Warn, cause it's not normal case. Some upstream pipe emit a stream with previously used
        // stream head which has not released.
        stream.release();
      }

      const streamGroup = pipeState.streamGroups[stream.papa] ?? createStreamGroup(stream.papa, pipeState.parentPipes.length);
      streamGroup.members[parentPipeIndex] = stream;

      if (pipeState.streamGroups[stream.papa]) {
        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupEvent('Stream group updated as a result of receiving a stream', deepCopy({ papa: stream.papa, streamGroup, pipeState }));
        }
      }
      else {
        pipeState.streamGroups[stream.papa] = streamGroup;

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupCreate('Stream group created as a result of receiving a stream', deepCopy({ papa: stream.papa, streamGroup, pipeState }));
        }
      }

      if (isStreamGroupFulfilled(streamGroup)) {
        streamGroup.status = 'active';

        if (process.env.NODE_ENV === 'development') {
          debug?.onStreamGroupEvent('Stream group has been fulfilled and can now emit a value', deepCopy({ streamGroup, pipeState }));
        }

        streamGroup.finish = fill(
          getFulfilledStreamGroupValues(streamGroup),
          (value) => emitData(streamGroup, value),
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

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, parentPipeUniqKey: symbol, papa: symbol): void => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamEvent('Pipe is terminating a stream', deepCopy({ parentPipeIndex, parentPipeUniqKey, papa, pipeState }));
    }

    terminateStreamGroup(pipeState.streamGroups[papa]);

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamEvent('Pipe terminated a stream', deepCopy({ parentPipeIndex, parentPipeUniqKey, papa, pipeState }));
    }
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
      debug?.onStreamGroupEvent('Stream group finished and can no longer emit a value', deepCopy({ streamGroup, pipeState }));
    }
  };

  const tryReleaseStreamGroup = (streamGroup: StreamGroup) => {
    if (isStreamGroupFinished(streamGroup)) {
      if ( ! Object.values(streamGroup.emittedDataRegistry).length && ! Object.values(streamGroup.emittedErrorRegistry).length) {
        releaseStreamGroup(streamGroup);
      }
    }
  };

  const releaseStreamGroup = (streamGroup: StreamGroup) => {
    delete pipeState.streamGroups[streamGroup.papa];

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Stream group has been released', deepCopy({ streamGroup, pipeState }));
    }

    streamGroup.members.forEach((stream) => stream?.release());
  };

  const terminateStreamGroup = (streamGroup: StreamGroup) => {
    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Pipe is terminating a stream group', deepCopy({ streamGroup, pipeState }));
    }

    if (isStreamGroupActive(streamGroup)) {
      finishStreamGroup(streamGroup);

      if (pipeState.dataPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.emittedDataRegistry).forEach((streamHead) => {
          streamGroup.emittedDataRegistry[streamHead].forEach((released, index) => {
            if ( ! released) {
              pipeState.dataPipe.downstreamConnections[index].onStreamTerminate(streamHead);
            }
          });
        });
      }

      if (pipeState.errorPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.emittedErrorRegistry).forEach((streamHead) => {
          streamGroup.emittedErrorRegistry[streamHead].forEach((released, index) => {
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

  const fill = createFill(handleReset);

  let debug: null | Debugger = null;

  let inheritedDisplayName;
  if (pipeState.parentPipes.length) {
    pipeState.parentPipes.forEach((parentPipe, index) => {
      const { connectionIndex } = parentPipe.connect(
        (stream) => handleParentPipeStreamEmit(index, parentPipe.uniqKey, stream),
        (papa) => handleParentPipeStreamTerminate(index, parentPipe.uniqKey, papa)
      );

      if (process.env.NODE_ENV === 'development') {
        if (index === 0) {
          inheritedDisplayName = `${parentPipe.displayName} => Downstream pipe #${connectionIndex + 1}`;
        }
      }
    });
  }

  const pipe: BasePipe = createPipe('data', pipeState.dataPipe, () => null, handleReset, () => null);
  const errorPipe: BasePipe = createPipe('error', pipeState.errorPipe, () => null, handleReset, () => null);

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

    handleReset.displayName = `Reset: ${displayName}`;

    debug?.onPipeCreate('Pipe created', deepCopy({ pipeState }));
  }

  if (pipeState.parentPipes.length === 0) {
    const mountStreamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupCreate('Mount stream group created', deepCopy({ papa: MOUNT_STREAM_HEAD, streamGroup: mountStreamGroup, pipeState }));
    }

    mountStreamGroup.status = 'active';

    if (process.env.NODE_ENV === 'development') {
      debug?.onStreamGroupEvent('Mount stream group has been fulfilled and can now emit a value', deepCopy({ streamGroup: mountStreamGroup, pipeState }));
    }

    mountStreamGroup.finish = fill(
      [],
      (value) => emitData(mountStreamGroup, value),
      (error) => emitError(mountStreamGroup, error),
    );
  }

  return [dataPipe, undefined];
}

export function createPipe<
  TValue extends any = any,
>(pipeType: PipeType, pipeState: CommonPipeState, throwError: (error: any) => void, reset: () => void, terminate: () => void): BasePipe<TValue> {
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
>(papa: symbol, value: TValue, release: () => void): Stream<TValue> {
  return {
    papa,
    value,
    release,
    released: false,
  };
}

function createStreamGroup<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(papa: symbol, length: number): StreamGroup<TAdjuncts> {
  const uniqKey = Symbol(getId('stream-group'));

  return {
    uniqKey,
    papa,
    status: 'idle',
    members: createStreamGroupMembers(length),
    emittedDataRegistry: {},
    emittedErrorRegistry: {},
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

function getEmittedData<
  TValue extends any = any,
>(value: TValue | Final<TValue>): TValue {
  if (isFinal(value)) {
    return value.value;
  }
  else {
    return value;
  }
}

function getId(concat: string = '') {
  const id = (Math.ceil(Math.random() * 61439) + 4097).toString(16);
  return concat ? `${concat}-${id}` : id;
}
