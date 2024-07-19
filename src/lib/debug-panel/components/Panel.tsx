import React, { useCallback, useState } from 'react';

import { selectEmittedStream, selectPipe, selectStreamGroup } from '../tools';
import { EventTargetType, PanelState } from '../types';
import { Console } from './Console';
import { Schema } from './Schema';

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

export type AppProps = {
  classNamePrefix: string;
  subscribe: (updatePanelInner: (cb: (state: PanelState) => PanelState) => void) => void;
};

export function Panel(props: AppProps) {
  const { subscribe } = props;

  const [panelState, setPanelState] = useState<PanelState>(initialState);

  const currentPanelState = panelState.selectedDebugRecord == null
    ? panelState
    : panelState.debugRecords[panelState.selectedDebugRecord].timeTravelPanelState;

  subscribe(setPanelState);

  const handlePipeSelection = useCallback((uniqKey: symbol) => {
    setPanelState((state) => selectPipe([uniqKey, uniqKey], state));
  }, []);

  const handleStreamGroupSelection = useCallback((uniqKey: [symbol, symbol]) => {
    setPanelState((state) => selectStreamGroup(uniqKey, state));
  }, []);

  const handleEmittedStreamSelection = useCallback((uniqKey: [symbol, symbol]) => {
    setPanelState((state) => selectEmittedStream(uniqKey, state));
  }, []);

  const handleEventSelect = useCallback((eventTargetType: EventTargetType, eventTargetKey: [symbol, symbol]) => {
    switch (eventTargetType) {
      case 'pipe': {
        setPanelState((state) => selectPipe(eventTargetKey, state));
        break;
      }
      case 'streamGroup': {
        setPanelState((state) => selectStreamGroup(eventTargetKey, state));
        break;
      }
      case 'stream': {
        setPanelState((state) => selectEmittedStream(eventTargetKey, state));
        break;
      }
      default: {
        const badEventTargetType: never = eventTargetType;
        throw new Error('Bad event target type: ' + badEventTargetType);
      }
    }
  }, []);

  const handleDebugRecordSelect = useCallback((index: number) => {
    setPanelState((state) => {
      const selectedDebugRecord = state.selectedDebugRecord === index ? null : index;
      return {
        ...state,
        selectedDebugRecord,
      };
    });
  }, [])

  return (
    <div className="ReactPipeDebugPanel">
      <div className="ReactPipeDebugPanel-Inner">
        <Console
          records={panelState.debugRecords}
          selectedRecord={panelState.selectedDebugRecord}
          onEventSelect={handleEventSelect}
          onDebugRecordSelect={handleDebugRecordSelect} />
        <Schema
          pipeFrames={currentPanelState.pipeFrames}
          maxDataLevel={currentPanelState.maxDataLevel}
          maxErrorLevel={currentPanelState.maxErrorLevel}
          selectedPipe={panelState.selectedPipe}
          selectedStreamGroup={panelState.selectedStreamGroup}
          selectedEmittedStream={panelState.selectedEmittedStream}
          onPipeSelection={handlePipeSelection}
          onStreamGroupSelection={handleStreamGroupSelection}
          onEmittedStreamSelection={handleEmittedStreamSelection} />
      </div>
      <div className="ReactPipeDebugPanel-FakeSpace" />
    </div>
  );
}
