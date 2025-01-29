import { getIsDebugInstruction } from './check';
import { getIsFinal } from './check';
import { getIsInstructionWithDisplayName } from './check';
import { getIsPipe } from './check';
import { getIsPipeWithCreateDebugger } from './check';
import { getIsDataBarrelDeleted } from './check';
import { getIsStreamGroupFulfilled } from './check';
import { getIsStreamGroupOpen } from './check';
import { getIsStreamGroupClosed } from './check';
import { getIsStreamGroupRetired } from './check';
import { getIsStreamGroupDeleted } from './check';
import { LibLogicError } from './Error';
import { UserLogicError } from './Error';
import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { CommonPipeState } from './types';
import type { CreateFill } from './types';
import type { DataPipe } from './types';
import type { Debugger } from './types';
import type { DownstreamConnection } from './types';
import type { DataBarrel } from './types';
import type { OnParentPipeStreamEmit } from './types';
import type { OnParentPipeStreamTerminate } from './types';
import type { PipeKit } from './types';
import type { PipeState } from './types';
import type { ReleaseStream } from './types';
import type { Stream } from './types';
import type { StreamGroup } from './types';
import type { StreamGroupMembers } from './types';
import type { StreamGroupValues } from './types';
import { EDataType } from './types';
import { EStreamGroupStatus } from "./types";
import { PIPE_ENTITY_TYPE } from './types';
import { EDataBarrelStatus } from "./types";

export function createPipeKit(createFill: CreateFill, adjuncts: Adjunct[]): PipeKit {
  const pipeState: PipeState = {
    parentPipes: adjuncts.filter(getIsPipe),
    streamGroupRegistry: {},
    dataPipe: {
      uniqKey: Symbol(getId('data-pipe')),
      downstreamConnections: [],
    },
    errorPipe: {
      uniqKey: Symbol(getId('error-pipe')),
      downstreamConnections: [],
    },
  };

  // TODO We need to create a `checkPipeState` function which will replace `checkStreamGroup`

  const handleEmitData = (streamGroup: StreamGroup, dataBarrel: DataBarrel): void => {
    if (process.env.NODE_ENV === 'development') {
      if (getIsStreamGroupOpen(streamGroup)) {
        console.error(new LibLogicError('`handleEmitData` should not be called on an open stream group', pipeState));
      }
      checkStreamGroup(streamGroup, pipeState);
    }

    if (getIsStreamGroupRetired(streamGroup)) {
      console.error(new UserLogicError('It looks like you\'re calling `emitData` after the `Final` value has already been emitted'));
    }

    // TODO Maybe it would be the right way to interpret `dataBarrel.dataType === 'error'` as a `Final` value

    streamGroup.dataBarrelRegistry[dataBarrel.papa] = dataBarrel;

    if (dataBarrel.final) {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onEmit('Pipe finally emitted a data', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }

      // TODO Ideally, `fill` should return either null, a function or a `Final` value.
      retireStreamGroup(streamGroup);
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onEmit('Pipe emitted a data', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }
    }

    const pipe = dataBarrel.dataType === EDataType.error ? pipeState.errorPipe : pipeState.dataPipe;

    if (pipe.downstreamConnections.length) {
      pipe.downstreamConnections.forEach((downstreamConnection) => {
        const stream = createStream(dataBarrel, () => {
          releaseStream(stream, dataBarrel, streamGroup);
          tryDeleteDataBarrel(streamGroup, dataBarrel)
            && tryReleaseStreamGroup(streamGroup);
        });

        streamGroup.dataBarrelRegistry[dataBarrel.papa].emittedStreams.push(stream);
        downstreamConnection.onStreamEmit(stream);
      });
    }
    else {
      tryDeleteDataBarrel(streamGroup, dataBarrel)
        && tryReleaseStreamGroup(streamGroup);
    }
  };

  const handleParentPipeStreamEmit = (parentPipeIndex: number, stream: Stream): void => {
    if (process.env.NODE_ENV === 'development') {
      if (pipeState.streamGroupRegistry[stream.papa]?.members[parentPipeIndex]) {
        console.error(new UserLogicError('Somehow upstream pipe has emitted a stream with previously used papa'));
      }
    }

    const streamGroup = pipeState.streamGroupRegistry[stream.papa] ?? createStreamGroup(stream.papa, pipeState.parentPipes.length);
    streamGroup.members[parentPipeIndex] = stream;

    if (pipeState.streamGroupRegistry[stream.papa]) {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupEvent('Stream group updated as a result of receiving a stream', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
      }
    }
    else {
      pipeState.streamGroupRegistry[stream.papa] = streamGroup;

      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupCreate('Stream group created as a result of receiving a stream', deepCopy({ parentPipeIndex, papa: stream.papa, streamGroup, pipeState }));
      }
    }

    if (getIsStreamGroupFulfilled(streamGroup)) {
      closeStreamGroup(streamGroup);

      const userRetire = fill(
        getStreamGroupValues(streamGroup),
        (data) => handleEmitData(streamGroup, createDataBarrel(streamGroup, data, EDataType.data)),
        (error) => handleEmitData(streamGroup, createDataBarrel(streamGroup, error, EDataType.error)),
      );
      streamGroup.retire = userRetire ?? null;
    }
  };

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, stream: Stream): void => {
    const streamGroup = pipeState.streamGroupRegistry[stream.papa];

    if (process.env.NODE_ENV === 'development') {
      checkStreamGroup(streamGroup, pipeState);
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminating a stream group as a result of parent pipe stream termination request', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
    }

    terminateStreamGroup(streamGroup);

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminated a stream group', deepCopy({ streamGroup, pipeState }));
    }
  };

  const handleTerminateAll = () => {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onPipeEvent('Pipe is terminating all stream groups', deepCopy({ pipeState }));
    }

    Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).forEach((streamGroupRegistryKey) => {
      terminateStreamGroup(pipeState.streamGroupRegistry[streamGroupRegistryKey]);
    });

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onPipeEvent('Stream groups terminated', deepCopy({ pipeState }));
    }
  };

  const tryDeleteDataBarrel = (streamGroup: StreamGroup, dataBarrel: DataBarrel): boolean => {
    if (getIsStreamGroupClosed(streamGroup) || getIsStreamGroupRetired(streamGroup)) {
      if (streamGroup.dataBarrelRegistry[dataBarrel.papa].emittedStreams.every((stream) => stream.released)) {
        deleteDataBarrel(streamGroup, dataBarrel);
        return true;
      }
    }
    return false;
  };

  const tryReleaseStreamGroup = (streamGroup: StreamGroup): boolean => {
    if (getIsStreamGroupRetired(streamGroup)) {
      if ( ! Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
        releaseStreamGroup(streamGroup);
        return true;
      }
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupEvent('Stream group has some unreleased streams', deepCopy({ streamGroup, pipeState }));
      }
    }
    return false;
  };

  const releaseStream = (stream: Stream, dataBarrel: DataBarrel, streamGroup: StreamGroup): void => {
    if (process.env.NODE_ENV === 'development') {
      if (stream.released) {
        console.error(new LibLogicError('`releaseStream` should not be called on a stream that is already released', pipeState));
      }
    }

    stream.released = true;

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamEvent('Stream has been released', deepCopy({ stream, dataBarrel, streamGroup, pipeState }));
    }
  };

  const deleteDataBarrel = (streamGroup: StreamGroup, dataBarrel: DataBarrel): void => {
    if (process.env.NODE_ENV === 'development') {
      if (getIsStreamGroupOpen(streamGroup)) {
        console.error(new LibLogicError('`deleteDataBarrel` should not be called on an open stream group', pipeState));
      }
      if (getIsStreamGroupDeleted(streamGroup)) {
        console.error(new LibLogicError('`deleteDataBarrel` should not be called on a deleted stream group', pipeState));
      }
      if ( ! streamGroup.dataBarrelRegistry[dataBarrel.papa]) {
        console.error(new LibLogicError('`deleteDataBarrel` should not be called on a data barrel that is not in the data barrel registry', pipeState));
      }
      if (getIsDataBarrelDeleted(dataBarrel)) {
        console.error(new LibLogicError('`deleteDataBarrel` should not be called on a deleted data barrel', pipeState));
      }
      if ( ! (dataBarrel.emittedStreams.every((stream) => stream.released))) {
        console.error(new LibLogicError('`deleteDataBarrel` should not be called on a data barrel that have unreleased streams', pipeState));
      }
    }

    dataBarrel.status = EDataBarrelStatus.deleted;
    delete streamGroup.dataBarrelRegistry[dataBarrel.papa];

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onDataBarrelEvent('Data barrel has been deleted', deepCopy({ dataBarrel, streamGroup, pipeState }));
    }

    // TODO Here we need to check `pipeState`
  };

  const closeStreamGroup = (streamGroup: StreamGroup): void => {
    if (process.env.NODE_ENV === 'development') {
      if (getIsStreamGroupClosed(streamGroup)) {
        console.error(new LibLogicError('`closeStreamGroup` should not be called on a closed stream group', pipeState));
      }
      if (getIsStreamGroupRetired(streamGroup)) {
        console.error(new LibLogicError('`closeStreamGroup` should not be called on an retired stream group', pipeState));
      }
      if (getIsStreamGroupDeleted(streamGroup)) {
        console.error(new LibLogicError('`closeStreamGroup` should not be called on a deleted stream group', pipeState));
      }
      if ( ! getIsStreamGroupFulfilled(streamGroup)) {
        console.error(new LibLogicError('`closeStreamGroup` should be called on a fulfilled stream group', pipeState));
      }
    }

    streamGroup.status = EStreamGroupStatus.closed;

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group has been closed and can now emit a data', deepCopy({ streamGroup, pipeState }));
    }
  };

  const retireStreamGroup = (streamGroup: StreamGroup): void => {
    if (process.env.NODE_ENV === 'development') {
      if (getIsStreamGroupOpen(streamGroup)) {
        console.error(new LibLogicError('`retireStreamGroup` should not be called on an open stream group', pipeState));
      }
      if (getIsStreamGroupRetired(streamGroup)) {
        console.error(new LibLogicError('`retireStreamGroup` should not be called on an retired stream group', pipeState));
      }
      if (getIsStreamGroupDeleted(streamGroup)) {
        console.error(new LibLogicError('`retireStreamGroup` should not be called on a deleted stream group', pipeState));
      }
    }

    streamGroup.status = EStreamGroupStatus.retired;
    streamGroup.retire?.();

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group retired and can no longer emit a data', deepCopy({ streamGroup, pipeState }));
    }
  };

  const releaseStreamGroup = (streamGroup: StreamGroup): void => {
    if (process.env.NODE_ENV === 'development') {
      if (getIsStreamGroupOpen(streamGroup)) {
        console.error(new LibLogicError('`deleteStreamGroup` should not be called on an open stream group', pipeState));
      }
      if (getIsStreamGroupClosed(streamGroup)) {
        console.error(new LibLogicError('`deleteStreamGroup` should not be called on a closed stream group', pipeState));
      }
      if (getIsStreamGroupDeleted(streamGroup)) {
        console.error(new LibLogicError('`deleteStreamGroup` should not be called on a deleted stream group', pipeState));
      }
      if (Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
        console.error(new LibLogicError('`deleteStreamGroup` should not be called for a stream group that has data barrel registry members', pipeState));
      }
    }

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group releasing', deepCopy({ streamGroup, pipeState }));
    }

    streamGroup.members.forEach((stream) => stream?.release());

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group has been released', deepCopy({ streamGroup, pipeState }));
    }

    streamGroup.status = EStreamGroupStatus.deleted;
    delete pipeState.streamGroupRegistry[streamGroup.papa];

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group has been deleted', deepCopy({ streamGroup, pipeState }));
    }

    // TODO Here we need to check `pipeState`
  };

  const terminateStreamGroup = (streamGroup: StreamGroup) => {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminating a stream group', deepCopy({ streamGroup, pipeState }));
    }

    if (getIsStreamGroupClosed(streamGroup)) {
      retireStreamGroup(streamGroup);

      if (pipeState.dataPipe.downstreamConnections.length) {
        Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).forEach((dataBarrelRegistryKey) => {
          const dataBarrel = streamGroup.dataBarrelRegistry[dataBarrelRegistryKey];
          const downstreamConnections = dataBarrel.dataType === EDataType.error
            ? pipeState.errorPipe.downstreamConnections
            : pipeState.dataPipe.downstreamConnections;
          dataBarrel.emittedStreams.forEach((stream, index) => {
            if ( ! stream.released) {
              downstreamConnections[index].onStreamTerminate(stream);
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

  const fill = createFill(handleTerminateAll);

  let debug: null | Debugger = null;

  let inheritedDisplayName;
  if (pipeState.parentPipes.length) {
    pipeState.parentPipes.forEach((parentPipe, index) => {
      const connectionIndex = parentPipe.connect(
        (stream) => handleParentPipeStreamEmit(index, stream),
        (stream) => handleParentPipeStreamTerminate(index, stream)
      );

      if (process.env.NODE_ENV === 'development') {
        // We use first parent pipe `displayName` value
        if (index === 0) {
          inheritedDisplayName = `${parentPipe.displayName} => Child #${connectionIndex + 1}`;
        }
      }
    });
  }

  const dataPipe = createDataPipe(pipeState.dataPipe, pipeState.errorPipe);

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');

    const instructionWithDisplayName = adjuncts.findLast(getIsInstructionWithDisplayName);
    const debugInstruction = adjuncts.findLast(getIsDebugInstruction);
    const createDebugger = debugInstruction?.createDebugger ?? adjuncts.findLast(getIsPipeWithCreateDebugger)?.createDebugger;

    const displayName = pipeState.displayName = instructionWithDisplayName?.displayName || fill.displayName || inheritedDisplayName || 'unknown';

    debug = createDebugger?.(displayName) ?? null;

    dataPipe.displayName = displayName;
    dataPipe.createDebugger = createDebugger;
    dataPipe.uniqKey = pipeState.dataPipe.uniqKey = Symbol(dataPipe.displayName + ' data pipe');

    dataPipe.error.displayName = `${displayName} error pipe`;
    dataPipe.error.createDebugger = createDebugger;
    dataPipe.error.uniqKey = pipeState.errorPipe.uniqKey = Symbol(dataPipe.error.displayName + ' error pipe');

    debug?.onPipeCreate('Pipe created', deepCopy({ pipeState }));
  }

  if ( ! pipeState.parentPipes.length) {
    // TODO Ideally, when component is unmount, we should terminate all stream groups

    const papa = Symbol('papa-mount');
    const streamGroup = pipeState.streamGroupRegistry[papa] = createStreamGroup(papa, 0);

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupCreate('Stream group created as a result of pipe mount', deepCopy({ papa, streamGroup, pipeState }));
    }

    closeStreamGroup(streamGroup);

    const userRetire = fill(
      getStreamGroupValues(streamGroup),
      (data) => handleEmitData(streamGroup, createDataBarrel(streamGroup, data, EDataType.data)),
      (error) => handleEmitData(streamGroup, createDataBarrel(streamGroup, error, EDataType.error)),
    );
    streamGroup.retire = userRetire ?? null;
  }

  return [dataPipe, undefined];
}

function createBasePipe(dataType: EDataType, pipeState: CommonPipeState): BasePipe {
  return {
    entityType: PIPE_ENTITY_TYPE,
    type: dataType,
    uniqKey: pipeState.uniqKey,
    connect(onStreamEmit, onStreamTerminate) {
      const downstreamConnection = createDownstreamConnection(onStreamEmit, onStreamTerminate);
      return pipeState.downstreamConnections.push(downstreamConnection) - 1;
    },
  };
}

function createDataPipe(dataPipeState: CommonPipeState, errorPipeState: CommonPipeState): DataPipe {
  const dataPipe = createBasePipe(EDataType.data, dataPipeState) as DataPipe;
  dataPipe.error = createBasePipe(EDataType.error, errorPipeState);
  return dataPipe;
}

function createDownstreamConnection(onStreamEmit: OnParentPipeStreamEmit, onStreamTerminate: OnParentPipeStreamTerminate): DownstreamConnection {
  return {
    onStreamEmit,
    onStreamTerminate,
  };
}

function createDataBarrel(streamGroup: StreamGroup, value: any, dataType: EDataType): DataBarrel {
  const uniqKey = Symbol(getId('data-barrel'));
  const [data, final] = unpack(value);

  // The place where Papa is born
  const papa = final ? streamGroup.papa : Symbol(getId('papa'));

  return {
    uniqKey,
    papa,
    data,
    dataType,
    final,
    status: EDataBarrelStatus.active,
    emittedStreams: [],
  };
}

function createStream(dataBarrel: DataBarrel, release: ReleaseStream): Stream {
  const uniqKey = Symbol(getId('stream'));

  return {
    uniqKey,
    papa: dataBarrel.papa,
    data: dataBarrel.data,
    release,
    released: false,
  };
}

function createStreamGroup(papa: symbol, length: number): StreamGroup {
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

function createStreamGroupMembers(length: number): StreamGroupMembers {
  return Array(length).fill(null);
}

function getStreamGroupValues(streamGroup: StreamGroup): StreamGroupValues {
  return streamGroup.members.map((stream) => stream?.data) as StreamGroupValues;
}

function unpack(value: any): [unpackedValue: any, isFinal: boolean] {
  const isFinal = getIsFinal(value);
  return [isFinal ? value.value : value, isFinal]
}

function getId(concat: string = ''): string {
  const id = (Math.ceil(Math.random() * 61439) + 4097).toString(16);
  return concat ? `${concat}-${id}` : id;
}

function checkStreamGroup(streamGroup: StreamGroup, pipeState: PipeState): void {
  switch (streamGroup.status) {
    case EStreamGroupStatus.open: {
      if (streamGroup.retire) {
        console.error(new LibLogicError('Open stream group should not have `retire` method', pipeState));
      }
      if (getIsStreamGroupFulfilled(streamGroup)) {
        console.error(new LibLogicError('Fulfilled stream group must be closed', pipeState));
      }
      if (Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
        console.error(new LibLogicError('Open stream group should not have data barrel registry members', pipeState));
      }
      break;
    }
    case EStreamGroupStatus.closed: {
      if ( ! getIsStreamGroupFulfilled(streamGroup)) {
        console.error(new LibLogicError('Closed stream group should be fulfilled', pipeState));
      }
      break;
    }
    case EStreamGroupStatus.retired: {
      if ( ! getIsStreamGroupFulfilled(streamGroup)) {
        console.error(new LibLogicError('Retired stream group should be fulfilled in earlier', pipeState));
      }
      break;
    }
    case EStreamGroupStatus.deleted: {
      if (Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
        console.error(new LibLogicError('Deleted stream group should not have data barrel registry members', pipeState));
      }
      break;
    }
    default: {
      console.error(new LibLogicError('Stream group has unknown status', pipeState));
    }
  }
}

function checkPipeState(pipeState: PipeState) {
  Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).forEach((streamGroupRegistryKey) => {
    checkStreamGroup(pipeState.streamGroupRegistry[streamGroupRegistryKey], pipeState);
  });
}
