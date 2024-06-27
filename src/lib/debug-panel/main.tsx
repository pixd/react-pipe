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
import { DebugEvent, PanelState, PipeFrame, StreamValueType } from './types';

const initialState: PanelState = {
  debugRecords: [],
  pipeFrames: [],
  maxPipeLineIndex: 0,
  maxDataLevel: 0,
  maxErrorLevel: 0,
  selectedPipe: null,
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
          return onLog(onPipeCreate(state, data), { name: 'onPipeCreate', data });
        });
      },
      onPipeReset: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onPipeReset', data });
        });
      },
      onPipeResetted: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onPipeResetted', data });
        });
      },
      onMountStream: (data) => {
        updatePanel((state) => {
          return onLog(onParentPipeStream(state, data), { name: 'onMountStream', data });
        });
      },
      onParentPipeStreamEmit: (data) => {
        updatePanel((state) => {
          return onLog(onParentPipeStream(state, data), { name: 'onParentPipeStreamEmit', data });
        });
      },
      onParentPipeStreamTerminate: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onParentPipeStreamTerminate', data });
        });
      },
      onParentPipeStreamTerminated: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onParentPipeStreamTerminated', data });
        });
      },
      onStreamGroupFulfill: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onStreamGroupFulfill', data });
        });
      },
      onStreamRelease: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onStreamRelease', data });
        });
      },
      onStreamGroupFinished: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onStreamGroupFinished', data });
        });
      },
      onStreamGroupRelease: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onStreamGroupRelease', data });
        });
      },
      onStreamGroupReleased: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onStreamGroupReleased', data });
        });
      },
      onStreamGroupTerminate: (data) => {
        updatePanel((state) => {
          return onLog(updatePipeState(state, data), { name: 'onStreamGroupTerminate', data });
        });
      },
      onEmit: (data) => {
        updatePanel((state) => {
          return onLog(onEmit(state, data), { name: 'onEmit', data });
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
    selected: false,
  };
}

function onLog(state: PanelState, debugEvent: DebugEvent): PanelState {
  console.log(debugEvent.name, debugEvent.data);

  const time = prepareTime(Date.now());

  const lastDebugRecordWithPilot = state.debugRecords.findLast((debugRecord) => debugRecord.pilot);

  let pilot;
  if (debugEvent.data.pipeState.displayName !== lastDebugRecordWithPilot?.pilot) {
    pilot = debugEvent.data.pipeState.displayName;
  }

  return {
    ...state,
    debugRecords: [...state.debugRecords, { pilot, time, debugEvent }],
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

function onParentPipeStream(state: PanelState, data: { streamGroup: StreamGroup, pipeState: PipeState }): PanelState {
  const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
    return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
  });

  const pipeFrame = state.pipeFrames[pipeFrameIndex];

  const streamGroupFrame = { data: data.streamGroup, deleted: false, selected: false };

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

  const emittedStreamFrame = { streamHead: data.streamHead, value: data.value, valueType: data.valueType, released: false, selected: false };

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
  const hours = ('0' + date.getHours()).substr(-2);
  const minutes = ('0' + date.getMinutes()).substr(-2);
  const seconds = ('0' + date.getSeconds()).substr(-2);
  const mSeconds = dateTime.toString().substr(-3);
  return hours + ':' + minutes + ':' + seconds + '.' + mSeconds;
}
