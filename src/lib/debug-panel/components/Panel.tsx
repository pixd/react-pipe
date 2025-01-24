import React, { useCallback, useEffect, useState } from 'react';

import { selectEmittedData, selectEvent, selectPipe, selectStreamGroup } from '../tools';
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
  selectedEmittedData: null,
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

  const handleEmittedDataSelection = useCallback((uniqKey: [symbol, symbol]) => {
    setPanelState((state) => selectEmittedData(uniqKey, state));
  }, []);

  const handleEventSelect = useCallback((eventTargetType: EventTargetType, eventTargetKey: [symbol, symbol]) => {
    setPanelState((state) => selectEvent(eventTargetType, eventTargetKey, state));
  }, []);

  const selectDebugRecord = useCallback((index: number, selectedDebugRecord: null | number, state: PanelState) => {
    const debugRecord = state.debugRecords[index];
    return selectEvent(debugRecord.debugEvent.eventTargetType, debugRecord.debugEvent.eventTargetKey, { ...state, selectedDebugRecord }, true);
  }, []);

  const handleDebugRecordSelect = useCallback((index: number) => {
    setPanelState((state) => {
      const selectedDebugRecord = state.selectedDebugRecord === index ? null : index;
      return selectDebugRecord(index, selectedDebugRecord, state);
    });
  }, [selectDebugRecord]);

  const handleDebugRecordNavigation = useCallback((event: Event) => {
    setPanelState((state) => {
      const selectedDebugRecord = (event as unknown as React.KeyboardEvent).key === ','
        ? Math.max(0, (state.selectedDebugRecord ?? 1) - 1)
        : (event as unknown as React.KeyboardEvent).key === '.'
          ? Math.min(state.debugRecords.length, (state.selectedDebugRecord ?? -1) + 1)
          : null;

      return selectedDebugRecord == null
        ? state
        : selectDebugRecord(selectedDebugRecord, selectedDebugRecord, state);
    });
  }, [selectDebugRecord]);

  useEffect(() => {
    window.addEventListener('keyup', handleDebugRecordNavigation);
    return () => window.removeEventListener('keyup', handleDebugRecordNavigation);
  }, [handleDebugRecordNavigation]);

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
          selectedEmittedData={panelState.selectedEmittedData}
          onPipeSelection={handlePipeSelection}
          onStreamGroupSelection={handleStreamGroupSelection}
          onEmittedDataSelection={handleEmittedDataSelection} />
      </div>
      <div className="ReactPipeDebugPanel-FakeSpace" />
    </div>
  );
}
