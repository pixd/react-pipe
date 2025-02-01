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
import { getIsStreamEmitInstruction } from './check';
import { getIsStreamTerminateInstruction } from './check';
import type { DeepCopy } from './deepCopy';
import { LibLogicError } from './Error';
import { UserLogicError } from './Error';
import { createControlInstruction } from './instruction';
import type { Adjunct } from './entities';
import type { BasePipe } from './entities';
import type { CommonPipeState } from './entities';
import type { CreateFill } from './entities';
import type { DataPipe } from './entities';
import type { Debugger } from './entities';
import type { DownstreamConnection } from './entities';
import type { DataBarrel } from './entities';
import type { DataType } from './entities';
import type { ForkInstruction } from './entities';
import type { LatestInstruction } from './entities';
import type { LeadingInstruction } from './entities';
import type { OnceInstruction } from './entities';
import type { OnParentPipeStreamEmit } from './entities';
import type { OnParentPipeStreamTerminate } from './entities';
import type { PipeKit } from './entities';
import type { PipeState } from './entities';
import type { ReleaseStream } from './entities';
import type { Stream } from './entities';
import type { StreamGroup } from './entities';
import type { StreamGroupMembers } from './entities';
import type { StreamGroupValues } from './entities';
import { FORK_INSTRUCTION_TYPE } from './entities';
import { LATEST_INSTRUCTION_TYPE } from './entities';
import { LEADING_INSTRUCTION_TYPE } from './entities';
import { ONCE_INSTRUCTION_TYPE } from './entities';
import { PIPE_ENTITY_TYPE } from './entities';
import { dataType } from './entities';
import { dataBarrelStatus } from "./entities";
import { streamGroupStatus } from './entities';

// TODO There is no clear logging strategy yet
//   Perhaps the reason for the actions should be defined in those methods that trigger the action,
//   and the result in those that execute it.

let deepCopy: DeepCopy;
if (import.meta.env.DEV) {
  const a = await import('./deepCopy');
  deepCopy = a.deepCopy;
}

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

  const streamEmitHandler = adjuncts.findLast(getIsStreamEmitInstruction)?.createStreamEmitHandler();
  const streamTerminateHandler = adjuncts.findLast(getIsStreamTerminateInstruction)?.createStreamTerminateHandler();

  // TODO `UserLogicError` and `LibLogicError` should not just log an error in console, but also throw an error, possibly using an `emitError`

  // -----
  // We use functions that have `handle` at the beginning of their name to handle various kinds of
  // events that occur externally.
  // We log this process here, but not the results of that process.
  // -----

  const handleEmitData = (streamGroup: StreamGroup, dataBarrel: DataBarrel): void => {
    // Check the lib logic
    if (import.meta.env.DEV) {
      if (getIsStreamGroupOpen(streamGroup)) {
        console.error(new LibLogicError('`handleEmitData` should not be called on an open stream group', pipeState));
      }
      checkPipeState(pipeState);
    }

    // Check the user logic
    if (getIsStreamGroupRetired(streamGroup) || getIsStreamGroupDeleted(streamGroup)) {
      console.error(new UserLogicError('It looks like you\'re calling `emitData` after the `Final` value has already been emitted'));
    }

    // TODO Maybe it would be the right way to interpret `dataBarrel.dataType === 'error'` as a `Final` value

    streamGroup.dataBarrelRegistry[dataBarrel.papa] = dataBarrel;

    if (dataBarrel.final) {
      if (import.meta.env.DEV) {
        debug?.onEmit('Pipe finally emitted a data, so we need to retire related stream group', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }

      // TODO Ideally, `fill` should return either null, a function or a `Final` value.
      retireStreamGroup(debug, pipeState, streamGroup);
    }
    else {
      if (import.meta.env.DEV) {
        debug?.onEmit('Pipe emitted a data', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }
    }

    const downstreamConnections = dataBarrel.dataType === dataType.error
      ? pipeState.errorPipe.downstreamConnections
      : pipeState.dataPipe.downstreamConnections;
    if (downstreamConnections.length) {
      if (import.meta.env.DEV) {
        debug?.onDataBarrelEvent('Pipe is going to emit streams to its downstream connections', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }

      downstreamConnections.forEach((downstreamConnection) => {
        const stream = createStream(dataBarrel, () => {
          tryReleaseStream(debug, pipeState, streamGroup, dataBarrel, stream);
        });

        dataBarrel.emittedStreams.push(stream);
        downstreamConnection.onStreamEmit(stream);
      });
    }
    else {
      if (import.meta.env.DEV) {
        debug?.onDataBarrelEvent('Pipe has not downstream connections, so we need to try release data barrel', deepCopy({ dataBarrel, streamGroup, pipeState }));
      }

      tryReleaseDataBarrel(debug, pipeState, streamGroup, dataBarrel);
    }
  };

  const handleParentPipeStreamEmit = (parentPipeIndex: number, stream: Stream): void => {
    // Check the lib logic
    if (import.meta.env.DEV) {
      // TODO Any `LibLogicError` here?
      checkPipeState(pipeState);
    }

    // Check the user logic
    if (pipeState.streamGroupRegistry[stream.papa]?.members[parentPipeIndex]) {
      console.error(new UserLogicError('Somehow upstream pipe has emitted a stream with previously used papa'));
    }

    if (streamEmitHandler && ! streamEmitHandler(debug, pipeState, stream)) {
      return;
    }

    let streamGroup
    if (pipeState.streamGroupRegistry[stream.papa]) {
      streamGroup = pipeState.streamGroupRegistry[stream.papa];
      streamGroup.members[parentPipeIndex] = stream;

      if (import.meta.env.DEV) {
        debug?.onStreamGroupEvent('Stream group has been updated as a result of receiving a stream', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
      }
    }
    else {
      streamGroup = createStreamGroup(stream.papa, pipeState.parentPipes.length);
      streamGroup.members[parentPipeIndex] = stream;
      pipeState.streamGroupRegistry[stream.papa] = streamGroup;

      if (import.meta.env.DEV) {
        debug?.onStreamGroupCreate('Stream group has been created as a result of receiving a stream', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
      }
    }

    if (getIsStreamGroupFulfilled(streamGroup)) {
      if (import.meta.env.DEV) {
        debug?.onStreamGroupEvent('Stream group has been fulfilled, so we need to close it', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
      }

      closeStreamGroup(debug, pipeState, streamGroup);

      const userRetire = fill(
        getStreamGroupValues(streamGroup),
        (data) => handleEmitData(streamGroup, createDataBarrel(streamGroup, data, dataType.data)),
        (error) => handleEmitData(streamGroup, createDataBarrel(streamGroup, error, dataType.error)),
      );
      streamGroup.retire = userRetire ?? null;
    }
  };

  const handleParentPipeStreamTerminate = (parentPipeIndex: number, stream: Stream): void => {
    // Check the lib logic
    if (import.meta.env.DEV) {
      // TODO Any `LibLogicError` here?
      checkPipeState(pipeState);
    }

    // Check the user logic
    // TODO Should we check the user logic here?

    if (streamTerminateHandler && ! streamTerminateHandler(debug, pipeState, stream)) {
      return;
    }

    const streamGroup = pipeState.streamGroupRegistry[stream.papa];

    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Pipe is going to terminate a stream group as a result of parent pipe stream termination request', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
    }

    tryTerminateStreamGroup(debug, pipeState, streamGroup);

    // if (import.meta.env.DEV) {
    //   debug?.onStreamGroupEvent('Pipe has terminated a stream group', deepCopy({ parentPipeIndex, streamGroup, pipeState }));
    // }
  };

  const handleTerminateAll = () => {
    // Check the lib logic
    if (import.meta.env.DEV) {
      checkPipeState(pipeState);
    }

    // Check the user logic
    // TODO Should we check the user logic here?

    if (import.meta.env.DEV) {
      debug?.onPipeEvent('Pipe is going to terminate all its stream groups as a result of terminate all request', deepCopy({ pipeState }));
    }

    Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).forEach((streamGroupRegistryKey) => {
      const streamGroup = pipeState.streamGroupRegistry[streamGroupRegistryKey];
      tryTerminateStreamGroup(debug, pipeState, streamGroup);
    });

    // if (import.meta.env.DEV) {
    //   debug?.onPipeEvent('Pipe has terminated all its stream groups', deepCopy({ pipeState }));
    // }
  };

  const fill = createFill(handleTerminateAll);

  let debug: null | Debugger = null;

  // TODO We should warn if pipe will not be able to release, due to incorrect channels and pipes connections
  pipeState.parentPipes.forEach((parentPipe, index) => {
    parentPipe.connect(
      (stream) => handleParentPipeStreamEmit(index, stream),
      (stream) => handleParentPipeStreamTerminate(index, stream)
    );
  });

  const dataPipe = createDataPipe(pipeState.dataPipe, pipeState.errorPipe);

  if (import.meta.env.DEV) {
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

    debug?.onPipeCreate('Pipe has been created', deepCopy({ pipeState }));
  }

  if ( ! pipeState.parentPipes.length) {
    // TODO Ideally, when component is unmount, we should terminate all stream groups

    const papa = Symbol('papa-mount');
    const streamGroup = pipeState.streamGroupRegistry[papa] = createStreamGroup(papa, 0);

    if (import.meta.env.DEV) {
      debug?.onStreamGroupCreate('Stream group has been created as a result of pipe mount', deepCopy({ papa, streamGroup, pipeState }));
    }

    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group has been fulfilled, so we need to close it', deepCopy({ streamGroup, pipeState }));
    }

    closeStreamGroup(debug, pipeState, streamGroup);

    const userRetire = fill(
      getStreamGroupValues(streamGroup),
      (data) => handleEmitData(streamGroup, createDataBarrel(streamGroup, data, dataType.data)),
      (error) => handleEmitData(streamGroup, createDataBarrel(streamGroup, error, dataType.error)),
    );
    streamGroup.retire = userRetire ?? null;
  }

  return [dataPipe, undefined];
}

function createBasePipe(dataType: DataType, pipeState: CommonPipeState): BasePipe {
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
  const dataPipe = createBasePipe(dataType.data, dataPipeState) as DataPipe;
  dataPipe.error = createBasePipe(dataType.error, errorPipeState);
  return dataPipe;
}

function createDownstreamConnection(onStreamEmit: OnParentPipeStreamEmit, onStreamTerminate: OnParentPipeStreamTerminate): DownstreamConnection {
  return {
    onStreamEmit,
    onStreamTerminate,
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

function createDataBarrel(streamGroup: StreamGroup, value: any, dataType: DataType): DataBarrel {
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
    status: dataBarrelStatus.active,
    emittedStreams: [],
  };
}

function createStreamGroupMembers(length: number): StreamGroupMembers {
  return Array(length).fill(null);
}

function createStreamGroup(papa: symbol, length: number): StreamGroup {
  const uniqKey = Symbol(getId('stream-group'));

  return {
    uniqKey,
    papa,
    status: streamGroupStatus.open,
    members: createStreamGroupMembers(length),
    dataBarrelRegistry: {},
    retire: null,
  };
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
    case dataBarrelStatus.active: {
      if (dataBarrel.emittedStreams.every((stream) => stream.released)) {
        console.error(new LibLogicError('Active data barrel must have at least one unreleased streams', pipeState));
      }
      break;
    }
    case dataBarrelStatus.deleted: {
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
    case streamGroupStatus.open: {
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
    case streamGroupStatus.closed: {
      if ( ! getIsStreamGroupFulfilled(streamGroup)) {
        console.error(new LibLogicError('Closed stream group should be fulfilled', pipeState));
      }
      break;
    }
    case streamGroupStatus.retired: {
      if ( ! getIsStreamGroupFulfilled(streamGroup)) {
        console.error(new LibLogicError('Retired stream group should be fulfilled in earlier', pipeState));
      }
      break;
    }
    case streamGroupStatus.deleted: {
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

// -----
// The functions that change stream group status.
// We only log the completion of this process here.
// -----

function closeStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, force: boolean = false): void {
  if (import.meta.env.DEV) {
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

  streamGroup.status = streamGroupStatus.closed;

  if (import.meta.env.DEV) {
    if ( ! force) {
      debug?.onStreamGroupEvent('Stream group has been closed and can now emit a data', deepCopy({ streamGroup, pipeState }));
    }
  }
}

function retireStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, force: boolean = false): void {
  if (import.meta.env.DEV) {
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

  streamGroup.status = streamGroupStatus.retired;
  streamGroup.retire?.();

  if (import.meta.env.DEV) {
    if ( ! force) {
      debug?.onStreamGroupEvent('Stream group has been retired and can no longer emit a data', deepCopy({ streamGroup, pipeState }));
    }
  }
}

// -----
// We use functions that have `try` at the beginning of their name to try to close (release or
// terminate) entities such as streams, data barrels or stream groups. These functions may or may
// not check at the beginning whether the entity is ready to close. If the function does not check
// this possibility, then it closes the entity and either passes control to another function, or
// returns `true` after checking the pipe state. When the function checks the possibility of closing
// an entity there can be two variants. The first one, when the possibility exists, the function
// closes the entity and also either passes control to another function, or returns `true` after
// checking the pipe state. And in the second one, the function returns `false` after checking the
// pipe state.
// We log here the reasons why it is impossible to close the entity, and if control is passed to
// another function, we also log the necessity of this.
// -----

function tryReleaseStream(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel, stream: Stream) {
  executeStreamRelease(debug, pipeState, streamGroup, dataBarrel, stream);

  if (import.meta.env.DEV) {
    debug?.onStreamEvent('Since the stream has been released, we need to try to release its data barrel', deepCopy({ stream, dataBarrel, streamGroup, pipeState }));
  }

  return tryReleaseDataBarrel(debug, pipeState, streamGroup, dataBarrel);
}

function tryReleaseDataBarrel(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel): boolean {
  // TODO An error, that throws here is not visible
  //   It was noticed that if this function throws an error, for example at the beginning using
  //   'throw new Error()', the error is not visible anywhere.
  // throw new Error();

  if (dataBarrel.emittedStreams.every((stream) => stream.released)) {
    executeDataBarrelRelease(debug, pipeState, streamGroup, dataBarrel);

    if (import.meta.env.DEV) {
      debug?.onDataBarrelEvent('Since the data barrel has been released, we need to try to release its stream group', deepCopy({ dataBarrel, streamGroup, pipeState }));
    }

    return tryReleaseStreamGroup(debug, pipeState, streamGroup);
  }
  else {
    if (import.meta.env.DEV) {
      debug?.onDataBarrelEvent('Data barrel has some unreleased streams and can not be released yet', deepCopy({ dataBarrel, streamGroup, pipeState }));
    }
  }
  if (import.meta.env.DEV) {
    checkPipeState(pipeState);
  }
  return false;
}

function tryReleaseStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): boolean {
  if (getIsStreamGroupRetired(streamGroup)) {
    if ( ! Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry).length) {
      executeStreamGroupRelease(debug, pipeState, streamGroup);
      if (import.meta.env.DEV) {
        checkPipeState(pipeState);
      }
      return true;
    }
    else {
      if (import.meta.env.DEV) {
        debug?.onStreamGroupEvent('Stream group has some unreleased streams and can not be released yet', deepCopy({ streamGroup, pipeState }));
      }
    }
  }
  else {
    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group is not retired and can not be released yet', deepCopy({ streamGroup, pipeState }));
    }
  }
  if (import.meta.env.DEV) {
    checkPipeState(pipeState);
  }
  return false;
}

function tryTerminateStreamGroup(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): boolean {
  executeStreamGroupTermination(debug, pipeState, streamGroup);
  if (import.meta.env.DEV) {
    checkPipeState(pipeState);
  }
  return true;
}

// -----
// We use functions that have `execute` at the beginning of their name to close (release or
// terminate) entities such as streams, data barrels or stream groups. All these functions first
// check whether the entity is present in the pipe state, and throw an error if it is not. They also
// can check if the entity satisfies the necessary conditions for closing, and throw an error if it
// is not.
// We log the closing process here, as well as the completion of this process.
// -----

function executeStreamRelease(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel, stream: Stream): void {
  if (import.meta.env.DEV) {
    if ( ! pipeState.streamGroupRegistry[streamGroup.papa].dataBarrelRegistry[dataBarrel.papa].emittedStreams.includes(stream)) {
      console.error(new LibLogicError('`executeDataBarrelRelease` should not be called on a data barrel that is not in the pipe state', pipeState));
    }
    if (stream.released) {
      console.error(new LibLogicError('`executeStreamRelease` should not be called on a stream that is already released', pipeState));
    }
  }

  stream.released = true;

  if (import.meta.env.DEV) {
    debug?.onStreamEvent('Stream has been released', deepCopy({ stream, dataBarrel, streamGroup, pipeState }));
  }
}

function executeDataBarrelRelease(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup, dataBarrel: DataBarrel): void {
  if (import.meta.env.DEV) {
    if ( ! pipeState.streamGroupRegistry[streamGroup.papa].dataBarrelRegistry[dataBarrel.papa]) {
      console.error(new LibLogicError('`executeDataBarrelRelease` should not be called on a data barrel that is not in the pipe state', pipeState));
    }
    if (getIsDataBarrelDeleted(dataBarrel)) {
      console.error(new LibLogicError('`executeDataBarrelRelease` should not be called on a deleted data barrel', pipeState));
    }
    if ( ! dataBarrel.emittedStreams.every((stream) => stream.released)) {
      console.error(new LibLogicError('`executeDataBarrelRelease` should not be called on a data barrel that have unreleased streams', pipeState));
    }
  }

  dataBarrel.status = dataBarrelStatus.deleted;
  delete streamGroup.dataBarrelRegistry[dataBarrel.papa];

  if (import.meta.env.DEV) {
    debug?.onDataBarrelEvent('Data barrel has been released and deleted', deepCopy({ dataBarrel, streamGroup, pipeState }));
  }
}

function executeStreamGroupRelease(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): void {
  if (import.meta.env.DEV) {
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

  if (streamGroup.members.length) {
    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group is going to release its parent pipes streams', deepCopy({ streamGroup, pipeState }));
    }

    streamGroup.members.forEach((stream) => stream?.release());

    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group has released its parent pipes streams and can be released now', deepCopy({ streamGroup, pipeState }));
    }
  }
  else {
    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group has no parent pipes streams and can be released', deepCopy({ streamGroup, pipeState }));
    }
  }

  streamGroup.status = streamGroupStatus.deleted;
  delete pipeState.streamGroupRegistry[streamGroup.papa];

  if (import.meta.env.DEV) {
    debug?.onStreamGroupEvent('Stream group has been released and deleted', deepCopy({ streamGroup, pipeState }));
  }
}

function executeStreamGroupTermination(debug: null | Debugger, pipeState: PipeState, streamGroup: StreamGroup): void {
  if (import.meta.env.DEV) {
    if ( ! pipeState.streamGroupRegistry[streamGroup.papa]) {
      console.error(new LibLogicError('`executeStreamGroupTermination` should not be called on a stream group that is not in the pipe state', pipeState));
    }
    if (getIsStreamGroupDeleted(streamGroup)) {
      console.error(new LibLogicError('`executeStreamGroupTermination` should not be called on a deleted stream group', pipeState));
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
    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group is going to terminate all its streams', deepCopy({ streamGroup, pipeState }));
    }

    dataBarrelRegistryKeys.forEach((dataBarrelRegistryKey) => {
      const dataBarrel = streamGroup.dataBarrelRegistry[dataBarrelRegistryKey];
      const downstreamConnections = dataBarrel.dataType === dataType.error
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
    if (import.meta.env.DEV) {
      debug?.onStreamGroupEvent('Stream group has no unreleased streams, so we need to release it', deepCopy({ streamGroup, pipeState }));
    }

    executeStreamGroupRelease(debug, pipeState, streamGroup);
  }

  if (import.meta.env.DEV) {
    debug?.onStreamGroupEvent('Stream group has been terminated', deepCopy({ streamGroup, pipeState }));
  }
}

// -----
// These are the control instructions.
// We log the intent to execute operations on the entity here, but not the results of these
// operations.
// -----

export const latest: LatestInstruction = createControlInstruction(LATEST_INSTRUCTION_TYPE, {
  createStreamEmitHandler: () => {
    return (debug: null | Debugger, pipeState: PipeState) => {
      const streamGroupRegistryKeys = Object.getOwnPropertySymbols(pipeState.streamGroupRegistry);
      if (streamGroupRegistryKeys.length) {
        if (import.meta.env.DEV) {
          debug?.onPipeEvent('Pipe is going to terminate all its stream groups because it was created using the `latest` instruction', deepCopy({ pipeState }));
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
  },
});

export const leading: LeadingInstruction = createControlInstruction(LEADING_INSTRUCTION_TYPE, {
  createStreamEmitHandler: () => {
    return (debug: null | Debugger, pipeState: PipeState, stream: Stream) => {
      if (Object.getOwnPropertySymbols(pipeState.streamGroupRegistry).length) {
        if (import.meta.env.DEV) {
          debug?.onPipeEvent('Pipe is going to immediately terminate received stream because it was created using the `leading` instruction', deepCopy({ pipeState }));
        }

        stream.release();

        return false;
      }
      else {
        return true;
      }
    };
  },
});

export const once: OnceInstruction = createControlInstruction(ONCE_INSTRUCTION_TYPE, {
  createStreamEmitHandler: () => {
    let started = false;
    return (debug: null | Debugger, pipeState: PipeState, stream: Stream) => {
      if ( ! started) {
        started = true;
        return true;
      }
      else {
        if (import.meta.env.DEV) {
          debug?.onPipeEvent('Pipe is going to immediately terminate received stream because it was created using the `once` instruction', deepCopy({ pipeState }));
        }

        stream.release();

        return false;
      }
    };
  },
});

export const fork: ForkInstruction = createControlInstruction(FORK_INSTRUCTION_TYPE, {
  createStreamEmitHandler: () => {
    return (debug: null | Debugger, pipeState: PipeState, stream: Stream) => {
      if (import.meta.env.DEV) {
        debug?.onPipeEvent('Pipe is going to immediately terminate received stream because it was created using the `fork` instruction', deepCopy({ pipeState }));
      }

      stream.release();

      return true;
    };
  },
});
