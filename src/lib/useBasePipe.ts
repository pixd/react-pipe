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
import type { Stream } from './types';
import type { StreamGroup } from './types';
import type { StreamGroupMembers } from './types';
import type { StreamGroupValues } from './types';
import { EDataType } from './types';
import { EStreamGroupStatus } from './types';
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
    if (isStreamGroupClosed(streamGroup)) {
      // The place where Papa is born
      const papa = dataBarrel.final ? streamGroup.papa : Symbol(getId('papa'));

      const pipe = dataBarrel.dataType === EDataType.error ? pipeState.errorPipe : pipeState.dataPipe;
      streamGroup.dataBarrelRegistry[papa] = { papa, dataBarrel, emittedStreams: [] };

      if (dataBarrel.final) {
        if (process.env.NODE_ENV === 'development') {
          const { deepCopy } = require('./deepCopy');
          debug?.onEmit('Pipe finally emitted a ' + dataBarrel.dataType, deepCopy({ papa, dataBarrel, streamGroup, pipeState }));
        }

        // TODO At this point, the method may not exist yet
        retireStreamGroup(streamGroup);
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
        if (isStreamGroupRetired(streamGroup)) {
          // TODO Log this
          // Warn, cause it's not normal case. User pipe fill method still active after FINAL.
          return;
        }
      }
    }
  };

  const handleParentPipeStreamEmit = (parentPipeIndex: number, stream: Stream): void => {
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
        debug?.onStreamGroupEvent('Stream group updated as a result of receiving a stream', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
      }
    }
    else {
      pipeState.streamGroups[stream.papa] = streamGroup;

      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupCreate('Stream group created as a result of receiving a stream', deepCopy({ parentPipeIndex, papa: stream.papa, streamGroup, pipeState }));
      }
    }

    if (isStreamGroupFulfilled(streamGroup)) {
      streamGroup.status = EStreamGroupStatus.closed;

      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupEvent('Stream group has been fulfilled and can now emit a data', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
      }

      streamGroup.retire = fill(
        getStreamGroupValues(streamGroup),
        (data) => emitData(streamGroup, createDataBarrel(data, EDataType.data)),
        (error) => emitData(streamGroup, createDataBarrel(error, EDataType.error)),
      );
    }
  };

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, stream: Stream): void => {
    const streamGroup = pipeState.streamGroups[stream.papa];

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminating a stream group as a result of parent pipe stream termination request', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
    }

    terminateStreamGroup(streamGroup);

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminated a stream group', deepCopy({ streamGroup, pipeState }));
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

  const retireStreamGroup = (streamGroup: StreamGroup) => {
    streamGroup.status = EStreamGroupStatus.retired;
    streamGroup.retire?.();

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group retired and can no longer emit a data', deepCopy({ streamGroup, pipeState }));
    }
  };

  const tryReleaseStreamGroup = (streamGroup: StreamGroup) => {
    if (isStreamGroupRetired(streamGroup)) {
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

    if (isStreamGroupClosed(streamGroup)) {
      retireStreamGroup(streamGroup);

      if (pipeState.dataPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).forEach((dataBarrelRegistryKey) => {
          streamGroup.dataBarrelRegistry[dataBarrelRegistryKey].emittedStreams.forEach((stream, index) => {
            if ( ! stream.released) {
              if (stream.dataBarrel.dataType === EDataType.error) {
                pipeState.errorPipe.downstreamConnections[index].onStreamTerminate(stream);
              }
              else {
                pipeState.dataPipe.downstreamConnections[index].onStreamTerminate(stream);
              }
            }
          });
        });
      }

      if ( ! pipeState.dataPipe.downstreamConnections.length && ! pipeState.errorPipe.downstreamConnections.length) {
        // TODO Why not to call `tryReleaseStreamGroup`
        releaseStreamGroup(streamGroup);
      }
    }
    else {
      // TODO Why not to call `tryReleaseStreamGroup`
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
        (stream) => handleParentPipeStreamEmit(index, stream),
        (stream) => handleParentPipeStreamTerminate(index, stream)
      );

      if (process.env.NODE_ENV === 'development') {
        if (index === 0) {
          inheritedDisplayName = `${parentPipe.displayName} => Downstream pipe #${connectionIndex + 1}`;
        }
      }
    });
  }

  const pipe: BasePipe = createPipe(EDataType.data, pipeState.dataPipe, () => null, handleReset, () => null);
  const errorPipe: BasePipe = createPipe(EDataType.error, pipeState.errorPipe, () => null, handleReset, () => null);

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
    const streamGroup = pipeState.streamGroups[MOUNT_STREAM_HEAD] = createStreamGroup(MOUNT_STREAM_HEAD, 0);

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupCreate('Mount stream group created', deepCopy({ papa: MOUNT_STREAM_HEAD, streamGroup, pipeState }));
    }

    streamGroup.status = EStreamGroupStatus.closed;

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Mount stream group has been fulfilled and can now emit a data', deepCopy({ streamGroup, pipeState }));
    }

    streamGroup.retire = fill(
      [],
      (data) => emitData(streamGroup, createDataBarrel(data, EDataType.data)),
      (error) => emitData(streamGroup, createDataBarrel(error, EDataType.error)),
    );
  }

  return [dataPipe, undefined];
}

export function createPipe<
  TValue extends any = any,
>(dataType: EDataType, pipeState: CommonPipeState, throwError: (error: any) => void, reset: () => void, terminate: () => void): BasePipe<TValue> {
  return {
    entityType: PIPE_ENTITY_TYPE,
    type: dataType,
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
>(value: TValue, dataType: EDataType): DataBarrel<TValue> {
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
    status: EStreamGroupStatus.open,
    members: createStreamGroupMembers(length),
    dataBarrelRegistry: {},
    retire: null,
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

function isStreamGroupClosed(streamGroup: StreamGroup): boolean {
  return streamGroup.status === EStreamGroupStatus.closed;
}

function isStreamGroupRetired(streamGroup: StreamGroup): boolean {
  return streamGroup.status === EStreamGroupStatus.retired;
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
