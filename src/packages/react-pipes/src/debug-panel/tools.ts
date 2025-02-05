import type { BasePipe } from '@@es-pipes/core';
import type { DataBarrel } from '@@es-pipes/core';
import type { PipeState } from '@@es-pipes/core';
import { dataType } from '@@es-pipes/core';

import type { DataBarrelFrame } from './types';
import type { EventTargetType } from './types';
import type { PanelState } from './types';
import type { PipeFrame } from './types';
import type { StreamGroupFrame } from './types';

export function getUpstreamPipeParams(upstreamPipe: BasePipe, pipeFrames: PipeFrame[]): [number, number] {
  const levels: boolean[] = [];
  let level: number = 0;

  const stateProp = upstreamPipe.type === dataType.error ? 'errorPipe' : 'dataPipe';

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
        upstreamPipe.type === dataType.data && (lastDataUpstreamPipeIndex = index);
        return [upstreamPipe, index] as const;
      })
      .filter((data) => data[0].type === dataType.data)
      .reverse();
    const errorUpstreamPipes = destination.pipeState.parentPipes
      .map((upstreamPipe, index) => {
        upstreamPipe.type === dataType.error && index < lastDataUpstreamPipeIndex && leftErrorUpstreamNumber ++;
        return [upstreamPipe, index] as const;
      })
      .filter((data) => data[0].type === dataType.error);

    let dataEntryLevel = dataUpstreamPipes.length;
    let errorEntryLevel = Math.max(leftErrorUpstreamNumber + errorUpstreamPipes.length, errorUpstreamPipes.length);

    [...dataUpstreamPipes, ...errorUpstreamPipes].forEach(([upstreamPipe, upstreamPipeIndex]) => {
      const [sourceIndex, level] = getUpstreamPipeParams(upstreamPipe, targetPipeFrames);
      const source = nextPipeFrames[sourceIndex];

      if (level) {
        lineGlobalIndex ++;

        if (upstreamPipe.type === dataType.error) {
          maxErrorLevel = Math.max(maxErrorLevel, level);
        }
        else {
          maxDataLevel = Math.max(maxDataLevel, level);
        }

        const maxLevelProp = upstreamPipe.type === dataType.error ? 'maxErrorLevel': 'maxDataLevel';
        const maxLevelConnectionProp = upstreamPipe.type === dataType.error ? 'maxErrorConnectionLevel': 'maxDataConnectionLevel';
        const maxEntryLevelProp = upstreamPipe.type === dataType.error ? 'maxErrorEntryLevel' : 'maxDataEntryLevel';
        const entryLevel = upstreamPipe.type === dataType.error ? errorEntryLevel -- : dataEntryLevel -- ;
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
    return streamGroupFrame.streamGroup.uniqKey === newStreamGroupFrame.streamGroup.uniqKey;
  })

  const nextStreamGroupFrames = [...streamGroupFrames];

  if (streamGroupFrameIndex > -1) {
    nextStreamGroupFrames[streamGroupFrameIndex] = {
      ...nextStreamGroupFrames[streamGroupFrameIndex],
      streamGroup: newStreamGroupFrame.streamGroup,
    };
  }
  else {
    nextStreamGroupFrames.push(newStreamGroupFrame);
  }

  return [nextStreamGroupFrames];
}

export function updateStreamGroupFrames(streamGroupFrames: StreamGroupFrame[], pipeState: PipeState): StreamGroupFrame[] {
  let changed = false;

  const nextStreamGroupFrames: StreamGroupFrame[] = streamGroupFrames.map((streamGroupFrame) => {
    const streamGroup = Object.getOwnPropertySymbols(pipeState.streamGroupRegistry)
      .map((streamGroupRegistryKey) => {
        return pipeState.streamGroupRegistry[streamGroupRegistryKey];
      })
      .find((streamGroup) => {
        return streamGroup.uniqKey === streamGroupFrame.streamGroup.uniqKey;
      });

    if (streamGroup) {
      changed = true;
      return {
        ...streamGroupFrame,
        streamGroup,
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

export function addDataBarrelFrame(dataBarrelFrames: DataBarrelFrame[], newDataBarrelFrame: DataBarrelFrame): [DataBarrelFrame[]] {
  const dataBarrelFrameIndex = dataBarrelFrames.findIndex((dataBarrelFrame) => {
    return dataBarrelFrame.dataBarrel.uniqKey === newDataBarrelFrame.dataBarrel.uniqKey;
  })

  const nextDataBarrelFrames = [...dataBarrelFrames];

  if (dataBarrelFrameIndex > -1) {
    nextDataBarrelFrames[dataBarrelFrameIndex] = {
      ...nextDataBarrelFrames[dataBarrelFrameIndex],
      dataBarrel: newDataBarrelFrame.dataBarrel,
    };
  }
  else {
    nextDataBarrelFrames.push(newDataBarrelFrame);
  }

  return [nextDataBarrelFrames];
}

export function updateDataBarrelFrames(dataBarrelFrames: DataBarrelFrame[], pipeState: PipeState): DataBarrelFrame[] {
  let changed = false;

  const nextDataBarrelFrames: DataBarrelFrame[] = dataBarrelFrames.map((dataBarrelFrame) => {
    const dataBarrel = Object.getOwnPropertySymbols(pipeState.streamGroupRegistry)
      .reduce((dataBarrels, streamGroupRegistryKey) => {
        const streamGroup = pipeState.streamGroupRegistry[streamGroupRegistryKey];
        return [
          ...dataBarrels,
          ...Object.getOwnPropertySymbols(streamGroup.dataBarrelRegistry)
            .map((dataBarrelRegistryKey) => {
              return streamGroup.dataBarrelRegistry[dataBarrelRegistryKey];
            }),
        ];
      }, [] as DataBarrel[])
      .find((dataBarrel) => {
        return dataBarrel.uniqKey === dataBarrelFrame.dataBarrel.uniqKey;
      });

    if (dataBarrel) {
      changed = true;
      return {
        ...dataBarrelFrame,
        dataBarrel,
        deleted: false,
      };
    }
    else {
      if ( ! dataBarrelFrame.deleted) {
        changed = true;
        return {
          ...dataBarrelFrame,
          deleted: true,
        };
      }
      else {
        return dataBarrelFrame;
      }
    }
  });

  return changed ? nextDataBarrelFrames : dataBarrelFrames;
}

export function selectPipe(uniqKey: [symbol, symbol], panelState: PanelState, preserveSelection?: boolean): PanelState {
  const selected = preserveSelection || ! (panelState.selectedPipe && panelState.selectedPipe[1] === uniqKey[1]);

  let nextState: PanelState = {
    ...panelState,
    selectedPipe: selected ? uniqKey : null,
    selectedStreamGroup: null,
    selectedDataBarrel: null,
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
    selectedDataBarrel: null,
  };

  nextState = selectDebugRecords(uniqKey, nextState);

  return nextState;
}

export function selectDataBarrel(uniqKey: [symbol, symbol], panelState: PanelState, preserveSelection?: boolean): PanelState {
  const selected = preserveSelection || ! (panelState.selectedDataBarrel && panelState.selectedDataBarrel[1] === uniqKey[1]);

  let nextState: PanelState = {
    ...panelState,
    selectedPipe: null,
    selectedStreamGroup: null,
    selectedDataBarrel: selected ? uniqKey : null,
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
    case 'dataBarrel': {
      return selectDataBarrel(eventTargetKey, state, preserveSelection);
    }
    default: {
      const badEventTargetType: never = eventTargetType;
      throw new Error('Bad event target type: ' + badEventTargetType);
    }
  }
}

function selectDebugRecords(uniqKey: [symbol, symbol], panelState: PanelState): PanelState {
  const selectedEventKey = panelState.selectedPipe?.[1] ?? panelState.selectedStreamGroup?.[1] ?? panelState.selectedDataBarrel?.[1] ?? null;
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
