import React, { useCallback, useEffect, useState } from 'react';

import { selectDataBarrel, selectEvent, selectPipe, selectStreamGroup } from '../tools';
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
  selectedDataBarrel: null,
  selectedTimeTravelPointIndex: null,
};

export type AppProps = {
  classNamePrefix: string;
  subscribe: (updatePanelInner: (cb: (state: PanelState) => PanelState) => void) => void;
};

export function Panel(props: AppProps) {
  const { subscribe } = props;

  const [panelState, _setPanelState] = useState<PanelState>(initialState);
  const setPanelState: typeof _setPanelState = (setPanelArg) => {
    _setPanelState((state) => {
      const nextState = typeof setPanelArg === 'function' ? setPanelArg(state) : setPanelArg;
      console.log(state, nextState);
      return nextState;
    });
  };

  subscribe(setPanelState);

  const handlePipeSelection = useCallback((uniqKey: symbol) => {
    setPanelState((state) => selectPipe([uniqKey, uniqKey], state));
  }, []);

  const handleStreamGroupSelection = useCallback((uniqKey: [symbol, symbol]) => {
    setPanelState((state) => selectStreamGroup(uniqKey, state));
  }, []);

  const handleDataBarrelSelection = useCallback((uniqKey: [symbol, symbol]) => {
    setPanelState((state) => selectDataBarrel(uniqKey, state));
  }, []);

  const handleEventSelect = useCallback((eventTargetType: EventTargetType, eventTargetKey: [symbol, symbol]) => {
    setPanelState((state) => selectEvent(eventTargetType, eventTargetKey, state));
  }, []);

  const selectDebugRecord = useCallback((index: number, selectedTimeTravelPointIndex: null | number, state: PanelState) => {
    const debugRecord = state.debugRecords[index];
    return selectEvent(debugRecord.debugEvent.eventTargetType, debugRecord.debugEvent.eventTargetKey, { ...state, selectedTimeTravelPointIndex }, true);
  }, []);

  const handleDebugRecordSelect = useCallback((index: number) => {
    setPanelState((state) => {
      const selectedDebugRecord = state.selectedTimeTravelPointIndex === index ? null : index;
      return selectDebugRecord(index, selectedDebugRecord, state);
    });
  }, [selectDebugRecord]);

  const handleDebugRecordNavigation = useCallback((event: Event) => {
    const key = (event as unknown as React.KeyboardEvent).key;
    if (key === ',' || key === '.') {
      setPanelState((state) => {
        const selectedDebugRecord = key === ','
          ? Math.max(0, (state.selectedTimeTravelPointIndex ?? 1) - 1)
          : key === '.'
            ? Math.min(state.debugRecords.length, (state.selectedTimeTravelPointIndex ?? -1) + 1)
            : null;

        return selectedDebugRecord == null
          ? state
          : selectDebugRecord(selectedDebugRecord, selectedDebugRecord, state);
      });
    }
  }, [selectDebugRecord]);

  useEffect(() => {
    window.addEventListener('keyup', handleDebugRecordNavigation);
    return () => window.removeEventListener('keyup', handleDebugRecordNavigation);
  }, [handleDebugRecordNavigation]);

  const currentPanelState = panelState.selectedTimeTravelPointIndex == null
    ? panelState
    : panelState.debugRecords[panelState.selectedTimeTravelPointIndex].timeTravelPanelState;

  return (
    <div className="ReactPipeDebugPanel">
      <div className="ReactPipeDebugPanel-Inner">
        <Console
          records={panelState.debugRecords}
          selectedRecord={panelState.selectedTimeTravelPointIndex}
          onEventSelect={handleEventSelect}
          onDebugRecordSelect={handleDebugRecordSelect} />
        <Schema
          pipeFrames={currentPanelState.pipeFrames}
          maxPipeLineIndex={currentPanelState.maxPipeLineIndex}
          maxDataLevel={currentPanelState.maxDataLevel}
          maxErrorLevel={currentPanelState.maxErrorLevel}
          selectedPipe={panelState.selectedPipe}
          selectedStreamGroup={panelState.selectedStreamGroup}
          selectedDataBarrel={panelState.selectedDataBarrel}
          onPipeSelection={handlePipeSelection}
          onStreamGroupSelection={handleStreamGroupSelection}
          onDataBarrelSelection={handleDataBarrelSelection} />
      </div>
      <div className="ReactPipeDebugPanel-FakeSpace" />
    </div>
  );
}
