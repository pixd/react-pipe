// noinspection TypeScriptValidateTypes

import { BasePipe, StreamGroups } from '../types';
import { EmittedValueFrame, EventTargetType, PanelState, PipeFrame, StreamGroupFrame }
  from './types';

export function getUpstreamPipeParams(upstreamPipe: BasePipe, pipeFrames: PipeFrame[]): [number, number] {
  const levels: boolean[] = [];
  let level: number = 0;

  const stateProp = upstreamPipe.type === 'error' ? 'errorPipe' : 'dataPipe';

  const index = [...pipeFrames].reverse().findIndex((pipeFrame) => {
    pipeFrame.streamConnections
      .filter((connection) => connection.type === upstreamPipe.type)
      .forEach((connection) => levels[connection.level - 1] = true);

    if (pipeFrame.pipeState[stateProp].uniqKey === upstreamPipe.uniqKey) {
      level = levels.findIndex((level) => ! level) + 1 || levels.length + 1;
      return true;
    }
    else {
      return false;
    }
  });

  const sourceIndex = index > -1 ? pipeFrames.length - index - 1 : -1;

  return [sourceIndex, level];
}

export function addPipeFrame(pipeFrames: PipeFrame[], newPipeFrame: PipeFrame): [PipeFrame[], number, number, number] {
  const nextPipeFrames = [
    ...pipeFrames.map((pipe) => {
      return {
        ...pipe,
        streamConnections: [],
        streamEntries: [],
        maxDataLevel: 0,
        maxErrorLevel: 0,
        maxDataConnectionLevel: 0,
        maxErrorConnectionLevel: 0,
        maxDataEntryLevel: 0,
        maxErrorEntryLevel: 0,
      } as PipeFrame;
    }),
    newPipeFrame,
  ];

  let lineGlobalIndex = -1;
  let maxDataLevel = 0;
  let maxErrorLevel = 0;

  nextPipeFrames.forEach((destination, destinationIndex) => {
    const targetPipeFrames = nextPipeFrames.slice(0, destinationIndex);

    let lastDataUpstreamPipeIndex = -1;
    let leftErrorUpstreamNumber = 0;

    const dataUpstreamPipes = destination.pipeState.parentPipes
      .map((upstreamPipe, index) => {
        upstreamPipe.type === 'data' && (lastDataUpstreamPipeIndex = index);
        return [upstreamPipe, index] as const;
      })
      .filter((data) => data[0].type === 'data')
      .reverse();
    const errorUpstreamPipes = destination.pipeState.parentPipes
      .map((upstreamPipe, index) => {
        upstreamPipe.type === 'error' && index < lastDataUpstreamPipeIndex && leftErrorUpstreamNumber ++;
        return [upstreamPipe, index] as const;
      })
      .filter((data) => data[0].type === 'error');

    let dataEntryLevel = dataUpstreamPipes.length;
    let errorEntryLevel = Math.max(leftErrorUpstreamNumber + errorUpstreamPipes.length, errorUpstreamPipes.length);

    [...dataUpstreamPipes, ...errorUpstreamPipes].forEach(([upstreamPipe, upstreamPipeIndex]) => {
      const [sourceIndex, level] = getUpstreamPipeParams(upstreamPipe, targetPipeFrames);
      const source = nextPipeFrames[sourceIndex];

      if (level) {
        lineGlobalIndex ++;

        if (upstreamPipe.type === 'error') {
          maxErrorLevel = Math.max(maxErrorLevel, level);
        }
        else {
          maxDataLevel = Math.max(maxDataLevel, level);
        }

        const maxLevelProp = upstreamPipe.type === 'error' ? 'maxErrorLevel': 'maxDataLevel';
        const maxLevelConnectionProp = upstreamPipe.type === 'error' ? 'maxErrorConnectionLevel': 'maxDataConnectionLevel';
        const maxEntryLevelProp = upstreamPipe.type === 'error' ? 'maxErrorEntryLevel' : 'maxDataEntryLevel';
        const entryLevel = upstreamPipe.type === 'error' ? errorEntryLevel -- : dataEntryLevel -- ;
        const sourceUniqKey = destination.pipeState.dataPipe.uniqKey;
        const destinationUniqKey = source.pipeState.errorPipe.uniqKey;

        nextPipeFrames.slice(sourceIndex + 1, destinationIndex).forEach((pipeFrame) => {
          pipeFrame.streamConnections.push({
            type: upstreamPipe.type,
            directionType: 'pass-through',
            lineGlobalIndex,
            level,
            source: sourceUniqKey,
            destination: destinationUniqKey,
          });
          pipeFrame[maxLevelProp] = Math.max(pipeFrame[maxLevelProp], level);
        });

        source.streamConnections.push({
          type: upstreamPipe.type,
          directionType: 'connection',
          lineGlobalIndex,
          level,
          source: sourceUniqKey,
          destination: destinationUniqKey,
        });
        source[maxLevelProp] = Math.max(source[maxLevelProp], level);
        source[maxLevelConnectionProp] = Math.max(source[maxLevelConnectionProp], level);

        destination.streamEntries[upstreamPipeIndex] = {
          type: upstreamPipe.type,
          lineGlobalIndex,
          level,
          entryLevel,
        };
        destination[maxLevelProp] = Math.max(destination[maxLevelProp], level);
        destination[maxEntryLevelProp] = Math.max(destination[maxEntryLevelProp], entryLevel);
      }
    });
  });

  return [nextPipeFrames, lineGlobalIndex, maxDataLevel, maxErrorLevel];
}

export function addStreamGroupFrame(streamGroupFrames: StreamGroupFrame[], newStreamGroupFrame: StreamGroupFrame): [StreamGroupFrame[]] {
  const streamGroupFrameIndex = streamGroupFrames.findIndex((streamGroupFrame) => {
    return streamGroupFrame.data.uniqKey === newStreamGroupFrame.data.uniqKey;
  })

  const nextStreamGroupFrames = [...streamGroupFrames];

  if (streamGroupFrameIndex > -1) {
    nextStreamGroupFrames[streamGroupFrameIndex] = {
      ...nextStreamGroupFrames[streamGroupFrameIndex],
      data: newStreamGroupFrame.data,
    };
  }
  else {
    nextStreamGroupFrames.push(newStreamGroupFrame);
  }

  return [nextStreamGroupFrames]
}

export function updateStreamGroupFrames(streamGroupFrames: StreamGroupFrame[], streamGroups: StreamGroups): StreamGroupFrame[] {
  let changed = false;

  const nextStreamGroupFrames = streamGroupFrames.map((streamGroupFrame: StreamGroupFrame) => {
    const streamHead = Object.getOwnPropertySymbols(streamGroups).find((streamHead) => {
      return streamGroups[streamHead].uniqKey === streamGroupFrame.data.uniqKey;
    });

    if (streamHead) {
      changed = true;

      return {
        ...streamGroupFrame,
        data: streamGroups[streamHead],
        deleted: false,
      };
    }
    else {
      if ( ! streamGroupFrame.deleted) {
        changed = true;

        return {
          ...streamGroupFrame,
          deleted: true,
        };
      }
      else {
        return streamGroupFrame;
      }
    }
  });

  return changed ? nextStreamGroupFrames : streamGroupFrames;
}

export function addEmittedValueFrame(emittedValueFrames: EmittedValueFrame[], newEmittedValueFrame: EmittedValueFrame): [EmittedValueFrame[]] {
  const nextEmittedValueFrames = [
    ...emittedValueFrames,
    newEmittedValueFrame,
  ];

  return [nextEmittedValueFrames];
}

export function updateEmittedValueFrames(emittedValueFrames: EmittedValueFrame[], streamGroups: StreamGroups): EmittedValueFrame[] {
  let changed = false;

  const nextEmittedValueFrames = emittedValueFrames.map((emittedValueFrame) => {
    const released = Object.getOwnPropertySymbols(streamGroups).every((streamHead) => {
      const streamGroup = streamGroups[streamHead];
      return ! (false
        || Object.getOwnPropertySymbols(streamGroup.emitDataGroups).some((emitGroupStreamHead) => {
          return emitGroupStreamHead === emittedValueFrame.streamHead && ! streamGroup.emitDataGroups[emitGroupStreamHead].every(Boolean);
        })
        || Object.getOwnPropertySymbols(streamGroup.emitErrorGroups).some((emitGroupStreamHead) => {
          return emitGroupStreamHead === emittedValueFrame.streamHead && ! streamGroup.emitErrorGroups[emitGroupStreamHead].every(Boolean);
        })
      );
    });

    if (emittedValueFrame.released !== released) {
      changed = true;

      return {
        ...emittedValueFrame,
        released,
      };
    }
    else {
      return emittedValueFrame;
    }
  });

  return changed ? nextEmittedValueFrames : emittedValueFrames;
}

export function selectPipe(uniqKey: [symbol, symbol], panelState: PanelState, preserveSelection?: boolean): PanelState {
  const selected = preserveSelection || ! (panelState.selectedPipe && panelState.selectedPipe[1] === uniqKey[1]);

  let nextState: PanelState = {
    ...panelState,
    selectedPipe: selected ? uniqKey : null,
    selectedStreamGroup: null,
    selectedEmittedValue: null,
  };

  nextState = selectDebugRecords(uniqKey, nextState);

  return nextState;
}

export function selectStreamGroup(uniqKey: [symbol, symbol], panelState: PanelState, preserveSelection?: boolean): PanelState {
  const selected = preserveSelection || ! (panelState.selectedStreamGroup && panelState.selectedStreamGroup[1] === uniqKey[1]);

  let nextState: PanelState = {
    ...panelState,
    selectedPipe: null,
    selectedStreamGroup: selected ? uniqKey : null,
    selectedEmittedValue: null,
  };

  nextState = selectDebugRecords(uniqKey, nextState);

  return nextState;
}

export function selectEmittedValue(uniqKey: [symbol, symbol], panelState: PanelState, preserveSelection?: boolean): PanelState {
  const selected = preserveSelection || ! (panelState.selectedEmittedValue && panelState.selectedEmittedValue[1] === uniqKey[1]);

  let nextState: PanelState = {
    ...panelState,
    selectedPipe: null,
    selectedStreamGroup: null,
    selectedEmittedValue: selected ? uniqKey : null,
  };

  nextState = selectDebugRecords(uniqKey, nextState);

  return nextState;
}

export function selectEvent(eventTargetType: EventTargetType, eventTargetKey: [symbol, symbol], state: PanelState, preserveSelection?: boolean) {
  switch (eventTargetType) {
    case 'pipe': {
      return selectPipe(eventTargetKey, state, preserveSelection);
    }
    case 'streamGroup': {
      return selectStreamGroup(eventTargetKey, state, preserveSelection);
    }
    case 'stream': {
      return selectEmittedValue(eventTargetKey, state, preserveSelection);
    }
    default: {
      const badEventTargetType: never = eventTargetType;
      throw new Error('Bad event target type: ' + badEventTargetType);
    }
  }
}

function selectDebugRecords(uniqKey: [symbol, symbol], panelState: PanelState): PanelState {
  const selectedEventKey = panelState.selectedPipe?.[1] ?? panelState.selectedStreamGroup?.[1] ?? panelState.selectedEmittedValue?.[1] ?? null;
  const selected = selectedEventKey === uniqKey[1];
  let debugRecordsChanged = false;

  const debugRecords = panelState.debugRecords.map((debugRecord) => {
    const nextPilotSelected = debugRecord.debugEvent.data.pipeState.dataPipe.uniqKey === uniqKey[1] ? selected : false;
    const nextSelected = debugRecord.debugEvent.eventTargetKey[1] === uniqKey[1] ? selected : false;

    if (debugRecord.selected !== nextSelected || debugRecord.pilotSelected !== nextPilotSelected) {
      debugRecordsChanged = true;
      return { ...debugRecord, selected: nextSelected, pilotSelected: nextPilotSelected };
    }
    else {
      return debugRecord;
    }
  });

  return {
    ...panelState,
    debugRecords: debugRecordsChanged ? debugRecords : panelState.debugRecords,
  };
}
