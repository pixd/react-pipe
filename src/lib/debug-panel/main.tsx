import ReactDOM from 'react-dom/client';

import { createInstruction } from '../instruction';
import type { DataBarrel } from '../types';
import type { Debugger } from '../types';
import type { PipeState } from '../types';
import type { StreamGroup } from '../types';
import { DEBUG_INSTRUCTION_TYPE } from '../types';
import { Panel } from './components/Panel';
import { styles as animationStyle } from './styles/animation';
import { styles as connectionsStyle } from './styles/connections';
import { styles as consoleStyle } from './styles/console';
import { styles as iconsStyle } from './styles/icons';
import { styles as mainStyle } from './styles/main';
import { styles as schemaStyle } from './styles/schema';
import { BACKGROUND_COLOR }  from './styles-constants';
import { COLOR }  from './styles-constants';
import { FONT_FAMILY }  from './styles-constants';
import { FONT_SIZE }  from './styles-constants';
import { MAIM_CLASS_NAME }  from './styles-constants';
import { addPipeFrame } from './tools';
import { addDataBarrelFrame } from './tools';
import { addStreamGroupFrame } from './tools';
import { updateDataBarrelFrames } from './tools';
import { updateStreamGroupFrames } from './tools';
import type { DataBarrelFrame } from './types';
import type { DebugEvent } from './types';
import type { DebugRecord } from './types';
import type { PanelState } from './types';
import type { PipeFrame } from './types';
import type { StreamGroupFrame } from './types';

let init = false;

export function initDebugPanel() {
  const element = createElement();
  document.body.appendChild(element);

  let updatePanel: (cb: (state: PanelState) => PanelState) => void;
  const subscribe = (updatePanelInner: (cb: (state: PanelState) => PanelState) => void): void => {
    updatePanel = updatePanel ?? updatePanelInner;
  };

  const root = ReactDOM.createRoot(element);
  root.render(
    <>
      {init ? null : <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />}
      {init ? null : <style dangerouslySetInnerHTML={{ __html: iconsStyle }} />}
      {init ? null : <style dangerouslySetInnerHTML={{ __html: animationStyle }} />}
      {init ? null : <style dangerouslySetInnerHTML={{ __html: mainStyle }} />}
      {init ? null : <style dangerouslySetInnerHTML={{ __html: consoleStyle }} />}
      {init ? null : <style dangerouslySetInnerHTML={{ __html: schemaStyle }} />}
      {init ? null : <style dangerouslySetInnerHTML={{ __html: connectionsStyle }} />}
      <Panel
        classNamePrefix={MAIM_CLASS_NAME}
        subscribe={subscribe} />
    </>
  );

  const createDebugger = (): Debugger => {
    return {
      onPipeCreate: (message, data) => {
        updatePanel((state) => {
          return onLog(onPipeCreate(state, data), {
            eventTargetType: 'pipe',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.pipeState.dataPipe.uniqKey],
            message,
            data,
          });
        });
      },
      onPipeEvent: (message, data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'pipe',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.pipeState.dataPipe.uniqKey],
            message,
            data,
          });
        });
      },
      onStreamGroupCreate: (message, data) => {
        updatePanel((state) => {
          return onLog(onStreamGroupCreate(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            message,
            data,
          });
        });
      },
      onStreamGroupEvent: (message, data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            message,
            data,
          });
        });
      },
      onEmit: (message, data) => {
        updatePanel((state) => {
          return onLog(onEmit(state, data), {
            eventTargetType: 'dataBarrel',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.dataBarrel.uniqKey],
            message,
            data,
          });
        });
      },
      onDataBarrelEvent: (message, data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'dataBarrel',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.dataBarrel.uniqKey],
            message,
            data,
          });
        });
      },
      onStreamEvent: (message, data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'dataBarrel',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.dataBarrel.uniqKey],
            message,
            data,
          });
        });
      },
    }
  };

  const debugPanel = {
    ...createInstruction(DEBUG_INSTRUCTION_TYPE),
    createDebugger,
  };

  init = true;

  return { debugPanel };
}

function getDefaultPipeFrame(): Omit<PipeFrame, 'displayName' | 'pipeState'> {
  return {
    streamConnections: [],
    streamEntries: [],
    maxDataLevel: 0,
    maxErrorLevel: 0,
    maxDataConnectionLevel: 0,
    maxErrorConnectionLevel: 0,
    maxDataEntryLevel: 0,
    maxErrorEntryLevel: 0,
    streamGroupFrames: [],
    dataBarrelFrames: [],
  };
}

function onLog(panelState: PanelState, debugEvent: DebugEvent): PanelState {
  console.log(debugEvent.message, { ...debugEvent.data, panelState });

  const rawTime = Date.now();
  const time = prepareTime(rawTime);

  let lastDebugRecord = panelState.debugRecords[panelState.debugRecords.length - 1];

  if (lastDebugRecord) {
    const idleTime = rawTime - lastDebugRecord.rawTime;
    const syncIdleTime = (idleTime > 10)
      ? ((rawTime - lastDebugRecord.rawTime) / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, useGrouping: false })
      : undefined;
    lastDebugRecord = {
      ...lastDebugRecord,
      syncIdleTime,
    };
  }

  const lastDebugRecordWithPilot = panelState.debugRecords.findLast((debugRecord) => debugRecord.pilot);

  let pilot;
  if (debugEvent.data.pipeState.displayName !== lastDebugRecordWithPilot?.pilot) {
    pilot = debugEvent.data.pipeState.displayName;
  }

  const selectedObjectKey = panelState.selectedPipe ?? panelState.selectedStreamGroup ?? panelState.selectedDataBarrel;

  const selected = !! selectedObjectKey && debugEvent.eventTargetKey[1] === selectedObjectKey[1];
  const pilotSelected = !! selectedObjectKey && debugEvent.data.pipeState.dataPipe.uniqKey === selectedObjectKey[1];

  const record: DebugRecord = {
    time,
    rawTime,
    selected,
    pilot,
    pilotSelected,
    debugEvent,
    timeTravelPanelState: {
      pipeFrames: panelState.pipeFrames,
      maxPipeLineIndex: panelState.maxPipeLineIndex,
      maxDataLevel: panelState.maxDataLevel,
      maxErrorLevel: panelState.maxErrorLevel,
    },
  };


  const debugRecords = [...panelState.debugRecords, record];

  if (lastDebugRecord) {
    debugRecords[debugRecords.length - 2] = lastDebugRecord;
  }

  return {
    ...panelState,
    debugRecords,
  };
}

function onPipeCreate(state: PanelState, data: { pipeState: PipeState }): PanelState {
  const pipeFrame: PipeFrame = {
    pipeState: data.pipeState,
    ...getDefaultPipeFrame(),
  };

  const [pipeFrames, maxPipeLineIndex, maxDataLevel, maxErrorLevel] = addPipeFrame(state.pipeFrames, pipeFrame);

  return {
    ...state,
    pipeFrames,
    maxPipeLineIndex,
    maxDataLevel,
    maxErrorLevel,
  };
}

function updatePipeState(state: PanelState, data: { pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const streamGroupFrames = updateStreamGroupFrames(pipeFrame.streamGroupFrames, data.pipeState);
  const dataBarrelFrames = updateDataBarrelFrames(pipeFrame.dataBarrelFrames, data.pipeState);

  const pipeFrames = [...state.pipeFrames];

  pipeFrames[pipeFrameIndex] = {
    ...pipeFrame,
    pipeState: data.pipeState,
    streamGroupFrames,
    dataBarrelFrames,
  };

  return {
    ...state,
    pipeFrames,
  };
}

function onStreamGroupCreate(state: PanelState, data: { streamGroup: StreamGroup, pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const streamGroupFrame: StreamGroupFrame = {
    streamGroup: data.streamGroup,
    deleted: false,
  };

  let [streamGroupFrames] = addStreamGroupFrame(pipeFrame.streamGroupFrames, streamGroupFrame);
  streamGroupFrames = updateStreamGroupFrames(streamGroupFrames, data.pipeState);
  const dataBarrelFrames = updateDataBarrelFrames(pipeFrame.dataBarrelFrames, data.pipeState);

  const pipeFrames = [...state.pipeFrames];

  pipeFrames[pipeFrameIndex] = {
    ...pipeFrame,
    pipeState: data.pipeState,
    streamGroupFrames,
    dataBarrelFrames,
  };

  return {
    ...state,
    pipeFrames,
  };
}

function onEmit(state: PanelState, data: { dataBarrel: DataBarrel, streamGroup: StreamGroup, pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const dataBarrelFrame: DataBarrelFrame = {
    dataBarrel: data.dataBarrel,
    deleted: false,
  };

  const streamGroupFrames = updateStreamGroupFrames(pipeFrame.streamGroupFrames, data.pipeState);
  let [dataBarrelFrames] = addDataBarrelFrame(pipeFrame.dataBarrelFrames, dataBarrelFrame);
  dataBarrelFrames = updateDataBarrelFrames(dataBarrelFrames, data.pipeState);

  const pipeFrames = [...state.pipeFrames];

  pipeFrames[pipeFrameIndex] = {
    ...pipeFrame,
    pipeState: data.pipeState,
    streamGroupFrames,
    dataBarrelFrames,
  };

  return {
    ...state,
    pipeFrames,
  };
}

function createElement() {
  const element = document.createElement('div');
  element.style.backgroundColor = BACKGROUND_COLOR;
  element.style.color = COLOR;
  element.style.fontFamily = FONT_FAMILY;
  element.style.fontSize = FONT_SIZE;
  element.style.height = 'calc(100vh - 2em)';
  element.style.position = 'fixed';
  element.style.right = '1em';
  element.style.top = '1em';
  return element;
}

function prepareTime(dateTime: number): string {
  const date = new Date(dateTime);
  const hours = ('0' + date.getHours()).slice(-2);
  const minutes = ('0' + date.getMinutes()).slice(-2);
  const seconds = ('0' + date.getSeconds()).slice(-2);
  const mSeconds = dateTime.toString().slice(-3);
  return hours + ':' + minutes + ':' + seconds + '.' + mSeconds;
}
