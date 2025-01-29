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
import { getIsStreamInstruction } from './check';
import { LibLogicError } from './Error';
import { UserLogicError } from './Error';
import { createStreamInstruction } from './instruction';
import type { Adjunct } from './types';
import type { BasePipe } from './types';
import type { CommonPipeState } from './types';
import type { CreateFill } from './types';
import type { DataPipe } from './types';
import type { Debugger } from './types';
import type { DownstreamConnection } from './types';
import type { DataBarrel } from './types';
import type { LatestInstruction } from './types';
import type { LeadingInstruction } from './types';
import type { OnceInstruction } from './types';
import type { OnParentPipeStreamEmit } from './types';
import type { OnParentPipeStreamTerminate } from './types';
import type { PipeKit } from './types';
import type { PipeState } from './types';
import type { ReleaseStream } from './types';
import type { Stream } from './types';
import type { StreamGroup } from './types';
import type { StreamGroupMembers } from './types';
import type { StreamGroupValues } from './types';
import { EDataBarrelStatus } from "./types";
import { EDataType } from './types';
import { EStreamGroupStatus } from "./types";
import { LATEST_STREAM_INSTRUCTION_TYPE } from './types';
import { LEADING_STREAM_INSTRUCTION_TYPE } from './types';
import { ONCE_STREAM_INSTRUCTION_TYPE } from './types';
import { PIPE_ENTITY_TYPE } from './types';

export function createPipeKit(createFill: CreateFill, adjuncts: Adjunct[]): PipeKit {
  // TODO Here we need to add a pipe state status (`active` and `deleted`) and check in `checkPipeState` if it has an stream groups

  const pipeState: PipeState = {
    parentPipes: adjuncts.filter(getIsPipe),
    streamGroupRegistry: {},
    dataPipe: {
      // TODO Should create only in `DEVELOPMENT`
      uniqKey: Symbol(getId('data-pipe')),
      downstreamConnections: [],
    },
    errorPipe: {
      // TODO Should create only in `DEVELOPMENT`
      uniqKey: Symbol(getId('error-pipe')),
      downstreamConnections: [],
    },
  };

  const handleStream = adjuncts.findLast(getIsStreamInstruction)?.createStreamHandler();

  // TODO `UserLogicError` and `LibLogicError` should not just log an error in console, but also throw an error, possibly using an `emitError`

  const handleEmitData = (streamGroup: StreamGroup, dataBarrel: DataBarrel): void => {
    if (process.env.NODE_ENV === 'development') {
      if (getIsStreamGroupOpen(streamGroup)) {
        console.error(new LibLogicError('`handleEmitData` should not be called on an open stream group', pipeState));
      }
      checkPipeState(pipeState);
    }

    if (getIsStreamGroupRetired(streamGroup) || getIsStreamGroupDeleted(streamGroup)) {
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
      retireStreamGroup(debug, pipeState, streamGroup);
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onEmit('Pipe emitted a data', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }
    }

    const workingPipe = dataBarrel.dataType === EDataType.error ? pipeState.errorPipe : pipeState.dataPipe;

    if (workingPipe.downstreamConnections.length) {
      workingPipe.downstreamConnections.forEach((downstreamConnection) => {
        const stream = createStream(dataBarrel, () => {
          tryReleaseStream(debug, pipeState, streamGroup, dataBarrel, stream);
        });

        streamGroup.dataBarrelRegistry[dataBarrel.papa].emittedStreams.push(stream);
        downstreamConnection.onStreamEmit(stream);
      });
    }
    else {
      tryReleaseDataBarrel(debug, pipeState, streamGroup, dataBarrel);
    }
  };

  const handleParentPipeStreamEmit = (parentPipeIndex: number, stream: Stream): void => {
    if (process.env.NODE_ENV === 'development') {
      if (pipeState.streamGroupRegistry[stream.papa]?.members[parentPipeIndex]) {
        console.error(new UserLogicError('Somehow upstream pipe has emitted a stream with previously used papa'));
      }
      checkPipeState(pipeState);
    }

    if (handleStream && ! handleStream(debug, pipeState, stream)) {
      return;
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
      closeStreamGroup(debug, pipeState, streamGroup);

      const userRetire = fill(
        getStreamGroupValues(streamGroup),
        (data) => handleEmitData(streamGroup, createDataBarrel(streamGroup, data, EDataType.data)),
        (error) => handleEmitData(streamGroup, createDataBarrel(streamGroup, error, EDataType.error)),
      );
      streamGroup.retire = userRetire ?? null;
    }
  };

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, stream: Stream): void => {
    if (process.env.NODE_ENV === 'development') {
      // TODO Should we check the user logic here?
      checkPipeState(pipeState);
    }

    const streamGroup = pipeState.streamGroupRegistry[stream.papa];

    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Pipe is terminating a stream group as a result of parent pipe stream termination request', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
    }

    tryTerminateStreamGroup(debug, pipeState, streamGroup);
  };

  const handleTerminateAll = () => {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onPipeEvent('Pipe is terminating all stream groups', deepCopy({ pipeState }));
      checkPipeState(pipeState);
    }

    Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).forEach((streamGroupRegistryKey) => {
      const streamGroup = pipeState.streamGroupRegistry[streamGroupRegistryKey];
      tryTerminateStreamGroup(debug, pipeState, streamGroup);
    });
  };

  const fill = createFill(handleTerminateAll);

  let debug: null | Debugger = null;

  if (pipeState.parentPipes.length) {
    pipeState.parentPipes.forEach((parentPipe, index) => {
      parentPipe.connect(
        (stream) => handleParentPipeStreamEmit(index, stream),
        (stream) => handleParentPipeStreamTerminate(index, stream)
      );
    });
  }

  const dataPipe = createDataPipe(pipeState.dataPipe, pipeState.errorPipe);

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');

    const instructionWithDisplayName = adjuncts.findLast(getIsInstructionWithDisplayName);
    const debugInstruction = adjuncts.findLast(getIsDebugInstruction);
    const createDebugger = debugInstruction?.createDebugger ?? adjuncts.findLast(getIsPipeWithCreateDebugger)?.createDebugger;

    const displayName = pipeState.displayName = instructionWithDisplayName?.displayName || fill.displayName || 'Unknown';

    debug = createDebugger?.(displayName) ?? null;

    dataPipe.displayName = displayName;
    dataPipe.createDebugger = createDebugger;
    dataPipe.uniqKey = pipeState.dataPipe.uniqKey = Symbol(`${displayName} data pipe`);

    dataPipe.error.displayName = `${displayName} error pipe`;
    dataPipe.error.createDebugger = createDebugger;
    dataPipe.error.uniqKey = pipeState.errorPipe.uniqKey = Symbol(`${displayName} error pipe`);

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

    closeStreamGroup(debug, pipeState, streamGroup);

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

function checkDataBarrel(dataBarrel: DataBarrel, pipeState: PipeState) {
  switch (dataBarrel.status) {
    case EDataBarrelStatus.active: {
      if (dataBarrel.emittedStreams.every((stream) => stream.released)) {
        console.error(new LibLogicError('Active data barrel must have at least one unreleased streams', pipeState));
      }
      break;
    }
    case EDataBarrelStatus.deleted: {
      if ( ! dataBarrel.emittedStreams.every((stream) => stream.released)) {
        console.error(new LibLogicError('Deleted data barrel can not have unreleased streams', pipeState));
      }
      break;
    }
    default: {
      console.error(new LibLogicError('Data barrel has unknown status', pipeState));
    }
  }
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

  Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).forEach((dataBarrelRegistryKey) => {
    const dataBarrel = streamGroup.dataBarrelRegistry[dataBarrelRegistryKey];
    checkDataBarrel(dataBarrel, pipeState);
    if (getIsDataBarrelDeleted(dataBarrel)) {
      console.error(new LibLogicError('Deleted data barrel can not be in data barrel registry', pipeState));
    }
  });
}

function checkPipeState(pipeState: PipeState) {
  Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).forEach((streamGroupRegistryKey) => {
    const streamGroup = pipeState.streamGroupRegistry[streamGroupRegistryKey];
    checkStreamGroup(streamGroup, pipeState);
    if (getIsStreamGroupDeleted(streamGroup)) {
      console.error(new LibLogicError('Deleted stream group can not be in stream group registry', pipeState));
    }
  });
}

function releaseStream(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel, stream: Stream): void {
  if (process.env.NODE_ENV === 'development') {
    if ( ! pipeState.streamGroupRegistry[streamGroup.papa].dataBarrelRegistry[dataBarrel.papa].emittedStreams.includes(stream)) {
      console.error(new LibLogicError('`releaseDataBarrel` should not be called on a data barrel that is not in the pipe state', pipeState));
    }
    if (stream.released) {
      console.error(new LibLogicError('`releaseStream` should not be called on a stream that is already released', pipeState));
    }
  }

  stream.released = true;

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');
    debug?.onStreamEvent('Stream has been released', deepCopy({ stream, dataBarrel, streamGroup, pipeState }));
  }
}

function releaseDataBarrel(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel): void {
  if (process.env.NODE_ENV === 'development') {
    if ( ! pipeState.streamGroupRegistry[streamGroup.papa].dataBarrelRegistry[dataBarrel.papa]) {
      console.error(new LibLogicError('`releaseDataBarrel` should not be called on a data barrel that is not in the pipe state', pipeState));
    }
    if (getIsDataBarrelDeleted(dataBarrel)) {
      console.error(new LibLogicError('`releaseDataBarrel` should not be called on a deleted data barrel', pipeState));
    }
    if ( ! dataBarrel.emittedStreams.every((stream) => stream.released)) {
      console.error(new LibLogicError('`releaseDataBarrel` should not be called on a data barrel that have unreleased streams', pipeState));
    }
  }

  dataBarrel.status = EDataBarrelStatus.deleted;
  delete streamGroup.dataBarrelRegistry[dataBarrel.papa];

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');
    debug?.onDataBarrelEvent('Data barrel has been released and deleted', deepCopy({ dataBarrel, streamGroup, pipeState }));
  }
}

function releaseStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): void {
  if (process.env.NODE_ENV === 'development') {
    if ( ! pipeState.streamGroupRegistry[streamGroup.papa]) {
      console.error(new LibLogicError('`deleteStreamGroup` should not be called on a stream group that is not in the pipe state', pipeState));
    }
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
    debug?.onStreamGroupEvent('Stream group is releasing its parent pipes streams', deepCopy({ streamGroup, pipeState }));
  }

  streamGroup.members.forEach((stream) => stream?.release());

  streamGroup.status = EStreamGroupStatus.deleted;
  delete pipeState.streamGroupRegistry[streamGroup.papa];

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');
    debug?.onStreamGroupEvent('Stream group has been released and deleted', deepCopy({ streamGroup, pipeState }));
  }
}

function terminateStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): void {
  if (process.env.NODE_ENV === 'development') {
    if (getIsStreamGroupDeleted(streamGroup)) {
      console.error(new LibLogicError('`terminateStreamGroup` should not be called on a deleted stream group', pipeState));
    }
  }

  if (getIsStreamGroupOpen(streamGroup)) {
    closeStreamGroup(debug, pipeState, streamGroup, true);
  }
  if (getIsStreamGroupClosed(streamGroup)) {
    retireStreamGroup(debug, pipeState, streamGroup, true);
  }

  const dataBarrelRegistryKeys = Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry);
  if (dataBarrelRegistryKeys.length) {
    dataBarrelRegistryKeys.forEach((dataBarrelRegistryKey) => {
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
  else {
    tryReleaseStreamGroup(debug, pipeState, streamGroup);
  }

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');
    debug?.onStreamGroupEvent('Stream group has been terminated', deepCopy({ streamGroup, pipeState }));
  }
}

function closeStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, force: boolean = false): void {
  if (process.env.NODE_ENV === 'development') {
    if ( ! force) {
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
  }

  streamGroup.status = EStreamGroupStatus.closed;

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');
    debug?.onStreamGroupEvent('Stream group has been closed and can now emit a data', deepCopy({ streamGroup, pipeState }));
  }
}

function retireStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, force: boolean = false): void {
  if (process.env.NODE_ENV === 'development') {
    if ( ! force) {
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
  }

  streamGroup.status = EStreamGroupStatus.retired;
  streamGroup.retire?.();

  if (process.env.NODE_ENV === 'development') {
    const { deepCopy } = require('./deepCopy');
    debug?.onStreamGroupEvent('Stream group retired and can no longer emit a data', deepCopy({ streamGroup, pipeState }));
  }
}

export const latest: LatestInstruction = createStreamInstruction(LATEST_STREAM_INSTRUCTION_TYPE, () => {
  return (debug: null | Debugger, pipeState: PipeState) => {
    const streamGroupRegistryKeys = Object.getOwnPropertySymbols(pipeState.streamGroupRegistry);
    if (streamGroupRegistryKeys.length) {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onPipeEvent('Pipe is terminating all stream groups because it was created using an `latest` instruction', deepCopy({ pipeState }));
        checkPipeState(pipeState);
      }

      Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).forEach((streamGroupRegistryKey) => {
        const streamGroup = pipeState.streamGroupRegistry[streamGroupRegistryKey];
        tryTerminateStreamGroup(debug, pipeState, streamGroup);
      });

      return true;
    }
    else {
      return true;
    }
  };
});

export const leading: LeadingInstruction = createStreamInstruction(LEADING_STREAM_INSTRUCTION_TYPE, () => {
  return (debug: null | Debugger, pipeState: PipeState, stream: Stream) => {
    if (Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).length) {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onPipeEvent('Stream is terminating because pipe was created using an `leading` instruction', deepCopy({ pipeState }));
        checkPipeState(pipeState);
      }

      stream.release();

      return false;
    }
    else {
      return true;
    }
  };
});

export const once: OnceInstruction = createStreamInstruction(ONCE_STREAM_INSTRUCTION_TYPE, () => {
  let started = false;
  return (debug: null | Debugger, pipeState: PipeState, stream: Stream) => {
    if ( ! started) {
      started = true;
      return true;
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onPipeEvent('Stream is terminating because pipe was created using an `once` instruction', deepCopy({ pipeState }));
        checkPipeState(pipeState);
      }

      stream.release();

      return false;
    }
  };
});

// We use functions that have `try` at the beginning of their name to try to close (release or
// terminate) entities such as streams, data barrels or stream groups. These functions may or may
// not check at the beginning whether the entity is ready to close. If the function does not check
// this possibility, then it closes the entity and either passes control to another function, or
// returns `true` after checking the pipe state. When the function checks the possibility of closing
// an entity there can be two variants. The first one, when a possibility exists, the function
// closes the entity and also either passes control to another function, or returns `true` after
// checking the pipe state. And in the second one, the function returns `false` after checking the
// pipe state.

function tryReleaseStream(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel, stream: Stream) {
  releaseStream(debug, pipeState, streamGroup, dataBarrel, stream);
  return tryReleaseDataBarrel(debug, pipeState, streamGroup, dataBarrel);
}

function tryReleaseDataBarrel(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel): boolean {
  if (dataBarrel.emittedStreams.every((stream) => stream.released)) {
    releaseDataBarrel(debug, pipeState, streamGroup, dataBarrel);
    return tryReleaseStreamGroup(debug, pipeState, streamGroup);
  }
  else {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onDataBarrelEvent('Data barrel has some unreleased streams and can not be released yet', deepCopy({ dataBarrel, streamGroup, pipeState }));
    }
  }
  if (process.env.NODE_ENV === 'development') {
    checkPipeState(pipeState);
  }
  return false;
}

function tryReleaseStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): boolean {
  if (getIsStreamGroupRetired(streamGroup)) {
    if ( ! Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
      releaseStreamGroup(debug, pipeState, streamGroup);
      if (process.env.NODE_ENV === 'development') {
        checkPipeState(pipeState);
      }
      return true;
    }
    else {
      if (process.env.NODE_ENV === 'development') {
        const { deepCopy } = require('./deepCopy');
        debug?.onStreamGroupEvent('Stream group has some unreleased streams and can not be released yet', deepCopy({ streamGroup, pipeState }));
      }
    }
  }
  else {
    if (process.env.NODE_ENV === 'development') {
      const { deepCopy } = require('./deepCopy');
      debug?.onStreamGroupEvent('Stream group is not retired and can not be released yet', deepCopy({ streamGroup, pipeState }));
    }
  }
  if (process.env.NODE_ENV === 'development') {
    checkPipeState(pipeState);
  }
  return false;
}

function tryTerminateStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): boolean {
  terminateStreamGroup(debug, pipeState, streamGroup);
  if (process.env.NODE_ENV === 'development') {
    checkPipeState(pipeState);
  }
  return true;
}
