import { useEffect } from 'react';
import { useMemo } from 'react';

import { isDebugInstruction } from './check';
import { isInstructionWithDisplayName } from './check';
import { isPipe } from './check';
import { isPipeWithCreateDebugger } from './check';
import { MOUNT_STREAM_HEAD } from './mountStreamHead';
import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { CommonPipeState } from './types';
import type { DataPipe } from './types';
import type { Debugger } from './types';
import type { DownstreamConnection } from './types';
import type { DataBarrel } from './types';
import type { Final } from './types';
import type { OnParentPipeStreamEmit } from './types';
import type { OnParentPipeStreamTerminate } from './types';
import type { PipeState } from './types';
import type { PipeType } from './types';
import type { Stream } from './types';
import type { StreamGroup } from './types';
import type { StreamGroupMembers } from './types';
import type { StreamGroupValues } from './types';
import { FINAL_TYPE } from './types';
import { PIPE_ENTITY_TYPE } from './types';

export type Emit<
  TValue extends any = any,
> = {
  (
    value: TValue,
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
      uniqKey: Symbol(getId('data-pipe')),
      downstreamConnections: [],
    },
    errorPipe: {
      uniqKey: Symbol(getId('error-pipe')),
      downstreamConnections: [],
    },
  };

  const emitData = (streamGroup: StreamGroup, dataBarrel: DataBarrel): void => {
    if (isStreamGroupActive(streamGroup)) {
      // The place where Papa is born
      const papa = dataBarrel.final ? streamGroup.papa : Symbol(getId('papa'));

      const pipe = dataBarrel.dataType === 'error' ? pipeState.errorPipe : pipeState.dataPipe;
      streamGroup.dataBarrelRegistry[papa] = { papa, dataBarrel, emittedStreams: [] };

      if (dataBarrel.final) {
        if (process.env.NODE_ENV === 'development') {
          const { deepCopy } = require('./deepCopy');
          debug?.onEmit('Pipe finally emitted a ' + dataBarrel.dataType, deepCopy({ papa, dataBarrel, streamGroup, pipeState }));
        }

        // TODO At this point, the method may not exist yet
        finishStreamGroup(streamGroup);
      }
      else {
        if (process.env.NODE_ENV === 'development') {
          const { deepCopy } = require('./deepCopy');
          debug?.onEmit('Pipe emitted a ' + dataBarrel.dataType, deepCopy({ papa, dataBarrel, streamGroup, pipeState }));
        }
      }

      if (pipe.downstreamConnections.length) {
        pipe.downstreamConnections.forEach((downstreamConnection, index) => {
          const stream = createStream(papa, dataBarrel, () => {
            stream.released = true;

            if (streamGroup.dataBarrelRegistry[papa].emittedStreams.every((stream) => stream.released)) {
              delete streamGroup.dataBarrelRegistry[papa];
            }

            if (process.env.NODE_ENV === 'development') {
              const { deepCopy } = require('./deepCopy');
              debug?.onStreamEvent('Stream has been released', deepCopy({ stream, streamGroup, pipeState }));
            }

            tryReleaseStreamGroup(streamGroup);
          });

          streamGroup.dataBarrelRegistry[papa].emittedStreams.push(stream);
          downstreamConnection.onStreamEmit(stream);
        });
      }
      else {
        delete streamGroup.dataBarrelRegistry[papa];
        tryReleaseStreamGroup(streamGroup);
      }
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        if (isStreamGroupFinished(streamGroup)) {
          // TODO Log this
          // Warn, cause it's not normal case. User pipe fill method still active after FINAL.
          return;
        }
      }
    }
  };

  const handleParentPipeStreamEmit = (parentPipeIndex: number, parentPipeUniqKey: symbol, stream: Stream): void => {
    if (pipeState.streamGroups[stream.papa]?.members[parentPipeIndex]) {
      // TODO Log this
      // Warn, cause it's not normal case. Some upstream pipe emit a stream with previously used
      // papa.
      stream.release();
    }

    const streamGroup = pipeState.streamGroups[stream.papa] ?? createStreamGroup(stream.papa, pipeState.parentPipes.length);
    streamGroup.members[parentPipeIndex] = stream;

    if (pipeState.streamGroups[stream.papa]) {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupEvent('Stream group updated as a result of receiving a stream', deepCopy({ papa: stream.papa, streamGroup, pipeState }));
      }
    }
    else {
      pipeState.streamGroups[stream.papa] = streamGroup;

      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupCreate('Stream group created as a result of receiving a stream', deepCopy({ papa: stream.papa, streamGroup, pipeState }));
      }
    }

    if (isStreamGroupFulfilled(streamGroup)) {
      streamGroup.status = 'active';

      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupEvent('Stream group has been fulfilled and can now emit a value', deepCopy({ streamGroup, pipeState }));
      }

      streamGroup.finish = fill(
        getStreamGroupValues(streamGroup),
        (data) => emitData(streamGroup, createDataBarrel(data, 'data')),
        (error) => emitData(streamGroup, createDataBarrel(error, 'error')),
      );
    }
  };

  // TODO Можно ли как-то обойтись без parentPipeUniqKey?
  const handleParentPipeStreamTerminate = (parentPipeIndex: number, parentPipeUniqKey: symbol, stream: Stream): void => {
    const streamGroup = pipeState.streamGroups[stream.papa];

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamEvent('Pipe is terminating a stream', deepCopy({ stream, streamGroup, parentPipeIndex, parentPipeUniqKey, pipeState }));
    }

    terminateStreamGroup(streamGroup);

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamEvent('Pipe terminated a stream', deepCopy({ stream, streamGroup, parentPipeIndex, parentPipeUniqKey, pipeState }));
    }
  };

  const handleReset = () => {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onPipeEvent('Pipe is resetting', deepCopy({ pipeState }));
    }

    Object.getOwnPropertySymbols(pipeState.streamGroups).forEach((streamHead) => {
      terminateStreamGroup(pipeState.streamGroups[streamHead]);
    });

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onPipeEvent('Pipe resetted', deepCopy({ pipeState }));
    }
  };

  const finishStreamGroup = (streamGroup: StreamGroup) => {
    streamGroup.status = 'finished';
    streamGroup.finish?.();

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group finished and can no longer emit a value', deepCopy({ streamGroup, pipeState }));
    }
  };

  const tryReleaseStreamGroup = (streamGroup: StreamGroup) => {
    if (isStreamGroupFinished(streamGroup)) {
      if ( ! Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
        releaseStreamGroup(streamGroup);
      }
    }
  };

  const releaseStreamGroup = (streamGroup: StreamGroup) => {
    delete pipeState.streamGroups[streamGroup.papa];

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group has been released', deepCopy({ streamGroup, pipeState }));
    }

    streamGroup.members.forEach((stream) => stream?.release());
  };

  const terminateStreamGroup = (streamGroup: StreamGroup) => {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminating a stream group', deepCopy({ streamGroup, pipeState }));
    }

    if (isStreamGroupActive(streamGroup)) {
      finishStreamGroup(streamGroup);

      // TODO It needs to be simplified because `errorBarrelRegistry` no longer exists
      if (pipeState.dataPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).forEach((dataBarrelRegistryKey) => {
          streamGroup.dataBarrelRegistry[dataBarrelRegistryKey].emittedStreams.forEach((stream, index) => {
            if ( ! stream.released) {
              pipeState.dataPipe.downstreamConnections[index].onStreamTerminate(stream);
            }
          });
        });
      }

      // TODO It needs to be simplified because `errorBarrelRegistry` no longer exists
      if (pipeState.errorPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).forEach((dataBarrelRegistryKey) => {
          streamGroup.dataBarrelRegistry[dataBarrelRegistryKey].emittedStreams.forEach((stream, index) => {
            if ( ! stream.released) {
              pipeState.errorPipe.downstreamConnections[index].onStreamTerminate(stream);
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
      const { deepCopy } = require('./deepCopy');
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
        (stream) => handleParentPipeStreamTerminate(index, parentPipe.uniqKey, stream)
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
    const { deepCopy } = require('./deepCopy');

    const instructionWithDisplayName = adjuncts.findLast(isInstructionWithDisplayName);
    const debugInstruction = adjuncts.findLast(isDebugInstruction);
    const createDebugger = debugInstruction?.createDebugger ?? adjuncts.findLast(isPipeWithCreateDebugger)?.createDebugger;

    const displayName = pipeState.displayName = instructionWithDisplayName?.displayName || fill.displayName || inheritedDisplayName || 'unknown';

    debug = createDebugger?.(displayName) ?? null;

    pipe.displayName = displayName;
    pipe.createDebugger = createDebugger;
    pipe.uniqKey = pipeState.dataPipe.uniqKey = Symbol(pipe.displayName + ' data pipe');

    errorPipe.displayName = `${displayName} error pipe`;
    errorPipe.createDebugger = createDebugger;
    errorPipe.uniqKey = pipeState.errorPipe.uniqKey = Symbol(errorPipe.displayName + ' error pipe');

    handleReset.displayName = `Reset: ${displayName}`;

    debug?.onPipeCreate('Pipe created', deepCopy({ pipeState }));
  }

  if (pipeState.parentPipes.length === 0) {
    const mountStreamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupCreate('Mount stream group created', deepCopy({ papa: MOUNT_STREAM_HEAD, streamGroup: mountStreamGroup, pipeState }));
    }

    mountStreamGroup.status = 'active';

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Mount stream group has been fulfilled and can now emit a value', deepCopy({ streamGroup: mountStreamGroup, pipeState }));
    }

    mountStreamGroup.finish = fill(
      [],
      (data) => emitData(mountStreamGroup, createDataBarrel(data, 'data')),
      (error) => emitData(mountStreamGroup, createDataBarrel(error, 'error')),
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

function createDataBarrel<
  TValue extends any = any,
>(value: TValue, dataType: PipeType): DataBarrel<TValue> {
  const uniqKey = Symbol(getId('data-barrel'));
  const [data, final] = unpack(value);

  return {
    uniqKey,
    data,
    dataType,
    final,
  };
}

function createStream<
  TValue extends any = any,
>(papa: symbol, dataBarrel: DataBarrel<TValue>, release: () => void): Stream<TValue> {
  const uniqKey = Symbol(getId('pipe'));

  return {
    uniqKey,
    papa,
    dataBarrel,
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
    dataBarrelRegistry: {},
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

function getStreamGroupValues<
  TAdjuncts extends Adjunct[] = Adjunct[],
>(streamGroup: StreamGroup<TAdjuncts>): StreamGroupValues<TAdjuncts> {
  return streamGroup.members.map((stream) => stream?.dataBarrel.data) as StreamGroupValues<TAdjuncts>;
}

export function isFinal<
  TValue extends any = any,
>(value: any): value is Final<TValue> {
  return (value as any)?.type === FINAL_TYPE;
}

function unpack<
  TValue extends any = any,
>(value: any): [TValue, boolean] {
  const final = isFinal(value);
  return [isFinal(value) ? value.value : value, final]
}

function getId(concat: string = '') {
  const id = (Math.ceil(Math.random() * 61439) + 4097).toString(16);
  return concat ? `${concat}-${id}` : id;
}
