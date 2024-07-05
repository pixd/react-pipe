import ReactDOM from 'react-dom/client';

import { createInstruction } from '../instruction';
import { DEBUG_INSTRUCTION_TYPE, Debugger, PipeState, StreamGroup } from '../types';
import { Panel } from './components/Panel';
import { styles as animationStyle } from './styles/animation';
import { styles as connectionsStyle } from './styles/connections';
import { styles as consoleStyle } from './styles/console';
import { styles as iconsStyle } from './styles/icons';
import { styles as mainStyle } from './styles/main';
import { styles as schemaStyle } from './styles/schema';
import { BACKGROUND_COLOR, COLOR, FONT_FAMILY, FONT_SIZE, MAIM_CLASS_NAME }
  from './styles-constants';
import { addPipeFrame, addEmittedStreamFrame, addStreamGroupFrame, updateEmittedStreamFrames,
  updateStreamGroupFrames } from './tools';
import { DebugEvent, DebugRecord, PanelState, PipeFrame, StreamValueType } from './types';

const initialState: PanelState = {
  debugRecords: [],
  pipeFrames: [],
  maxPipeLineIndex: 0,
  maxDataLevel: 0,
  maxErrorLevel: 0,
  selectedPipe: null,
  selectedStreamGroup: null,
  selectedEmittedStream: null,
  selectedDebugRecord: null,
};

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
      <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: iconsStyle }}/>
      <style dangerouslySetInnerHTML={{ __html: animationStyle }}/>
      <style dangerouslySetInnerHTML={{ __html: mainStyle }}/>
      <style dangerouslySetInnerHTML={{ __html: consoleStyle }}/>
      <style dangerouslySetInnerHTML={{ __html: schemaStyle }}/>
      <style dangerouslySetInnerHTML={{ __html: connectionsStyle }}/>
      <Panel classNamePrefix={MAIM_CLASS_NAME} initialState={initialState} subscribe={subscribe} />
    </>
  );

  const createDebugger = (): Debugger => {
    return {
      onPipeCreate: (data) => {
        updatePanel((state) => {
          return onLog(onPipeCreate(state, data), {
            eventTargetType: 'pipe',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.pipeState.dataPipe.uniqKey],
            name: 'onPipeCreate',
            data,
          });
        });
      },
      onPipeResetStart: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'pipe',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.pipeState.dataPipe.uniqKey],
            name: 'onPipeResetStart',
            data,
          });
        });
      },
      onPipeResetComplete: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'pipe',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.pipeState.dataPipe.uniqKey],
            name: 'onPipeResetComplete',
            data,
          });
        });
      },
      onMountStream: (data) => {
        updatePanel((state) => {
          return onLog(onStreamGroupCreate(state, data), {
            eventTargetType: 'stream',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamHead],
            name: 'onMountStream',
            data,
          });
        });
      },
      onParentPipeStreamEmit: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'stream',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamHead],
            name: 'onParentPipeStreamEmit',
            data,
          });
        });
      },
      onParentPipeStreamTerminateStart: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'stream',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamHead],
            name: 'onParentPipeStreamTerminateStart',
            data,
          });
        });
      },
      onParentPipeStreamTerminateComplete: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'stream',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamHead],
            name: 'onParentPipeStreamTerminateComplete',
            data,
          });
        });
      },
      onStreamGroupCreate: (data) => {
        updatePanel((state) => {
          return onLog(onStreamGroupCreate(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupCreate',
            data,
          });
        });
      },
      onStreamGroupUpdate: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupUpdate',
            data,
          });
        });
      },
      onStreamGroupFulfill: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupFulfill',
            data,
          });
        });
      },
      onStreamRelease: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'stream',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamHead],
            name: 'onStreamRelease',
            data,
          });
        });
      },
      onStreamGroupFinish: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupFinish',
            data,
          });
        });
      },
      onStreamGroupReleaseStart: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupReleaseStart',
            data,
          });
        });
      },
      onStreamGroupReleaseComplete: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupReleaseComplete',
            data,
          });
        });
      },
      onStreamGroupTerminateStart: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupTerminateStart',
            data,
          });
        });
      },
      onStreamGroupTerminateComplete: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), {
            eventTargetType: 'streamGroup',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamGroup.uniqKey],
            name: 'onStreamGroupTerminateComplete',
            data,
          });
        });
      },
      onEmit: (data) => {
        updatePanel((state) => {
          return onLog(onEmit(state, data), {
            eventTargetType: 'stream',
            eventTargetKey: [data.pipeState.dataPipe.uniqKey, data.streamHead],
            name: 'onEmit',
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

  return { debugPanel };
}

function getDefaultPipeFrame(): Omit<PipeFrame, 'displayName' | 'pipeState'> {
  return {
    streamConnections: [],
    streamGroupFrames: [],
    streamEntries: [],
    maxDataLevel: 0,
    maxErrorLevel: 0,
    maxDataConnectionLevel: 0,
    maxErrorConnectionLevel: 0,
    maxDataEntryLevel: 0,
    maxErrorEntryLevel: 0,
    emittedStreamFrames: [],
  };
}

function onLog(panelState: PanelState, debugEvent: DebugEvent): PanelState {
  console.log(debugEvent.name, debugEvent.data);

  const time = prepareTime(Date.now());

  const lastDebugRecordWithPilot = panelState.debugRecords.findLast((debugRecord) => debugRecord.pilot);

  let pilot;
  if (debugEvent.data.pipeState.displayName !== lastDebugRecordWithPilot?.pilot) {
    pilot = debugEvent.data.pipeState.displayName;
  }

  const selectedEventKey = panelState.selectedPipe ?? panelState.selectedStreamGroup ?? panelState.selectedEmittedStream;

  const selected = !! selectedEventKey && debugEvent.eventTargetKey[1] === selectedEventKey[1];
  const pilotSelected = !! selectedEventKey && debugEvent.data.pipeState.dataPipe.uniqKey === selectedEventKey[1];

  const record: DebugRecord = {
    time,
    selected,
    pilot,
    pilotSelected,
    debugEvent,
    timeTravel: {
      ...panelState,
      debugRecords: [],
      selectedDebugRecord: null,
    },
  };

  return {
    ...panelState,
    debugRecords: [...panelState.debugRecords, record],
  };
}

function onPipeCreate(state: PanelState, data: { pipeState: PipeState }): PanelState {
  const pipeFrame = {
    displayName: data.pipeState.displayName,
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

function onStreamGroupCreate(state: PanelState, data: { streamGroup: StreamGroup, pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const streamGroupFrame = { data: data.streamGroup, deleted: false };

  let [streamGroupFrames] = addStreamGroupFrame(pipeFrame.streamGroupFrames, streamGroupFrame);
  streamGroupFrames = updateStreamGroupFrames(streamGroupFrames, data.pipeState.streamGroups);
  const emittedStreamFrames = updateEmittedStreamFrames(pipeFrame.emittedStreamFrames, data.pipeState.streamGroups);

  const pipeFrames = [...state.pipeFrames];

  pipeFrames[pipeFrameIndex] = {
    ...pipeFrame,
    pipeState: data.pipeState,
    streamGroupFrames,
    emittedStreamFrames: emittedStreamFrames,
  };

  return {
    ...state,
    pipeFrames,
  };
}

function onEmit(state: PanelState, data: { streamHead: symbol, value: any, valueType: StreamValueType, streamGroup: StreamGroup, pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const emittedStreamFrame = { streamHead: data.streamHead, value: data.value, valueType: data.valueType, released: false };

  const streamGroupFrames = updateStreamGroupFrames(pipeFrame.streamGroupFrames, data.pipeState.streamGroups);
  let [emittedStreamFrames] = addEmittedStreamFrame(pipeFrame.emittedStreamFrames, emittedStreamFrame);
  emittedStreamFrames = updateEmittedStreamFrames(emittedStreamFrames, data.pipeState.streamGroups);

  const pipeFrames = [...state.pipeFrames];

  pipeFrames[pipeFrameIndex] = {
    ...pipeFrame,
    pipeState: data.pipeState,
    streamGroupFrames,
    emittedStreamFrames: emittedStreamFrames,
  };

  return {
    ...state,
    pipeFrames,
  };
}

function updatePipeState(state: PanelState, data: { pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const streamGroupFrames = updateStreamGroupFrames(pipeFrame.streamGroupFrames, data.pipeState.streamGroups);
  const emittedStreamFrames = updateEmittedStreamFrames(pipeFrame.emittedStreamFrames, data.pipeState.streamGroups);

  const pipeFrames = [...state.pipeFrames];

  pipeFrames[pipeFrameIndex] = {
    ...pipeFrame,
    pipeState: data.pipeState,
    streamGroupFrames,
    emittedStreamFrames: emittedStreamFrames,
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
