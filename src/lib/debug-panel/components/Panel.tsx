import React, { useCallback, useState } from 'react';

import { LINE_SPACE, OUT_GAP } from '../styles-constants';
import { selectEmittedStreamFrame, selectStreamGroupFrame } from '../tools';
import { PanelState } from '../types';
import { ConsoleRecords } from './ConsoleRecords';
import { Pipe } from './Pipe';

export type AppProps = {
  classNamePrefix: string;
  initialState: PanelState;
  subscribe: (updatePanelInner: (cb: (state: PanelState) => PanelState) => void) => void;
};

export function Panel(props: AppProps) {
  const { initialState, subscribe } = props;

  const [panelState, setPanelState] = useState<PanelState>({ ...initialState });

  subscribe(setPanelState);

  const handleStreamGroupSelection = useCallback((uniqKey: symbol, selected: boolean) => {
    setPanelState((state) => {
      return {
        ...state,
        pipeFrames: selectStreamGroupFrame(uniqKey, selected, state.pipeFrames),
      };
    })
  }, []);

  const handleEmittedStreamSelection = useCallback((streamHead: symbol, selected: boolean) => {
    setPanelState((state) => {
      return {
        ...state,
        pipeFrames: selectEmittedStreamFrame(streamHead, selected, state.pipeFrames),
      };
    })
  }, []);

  const style = {
    paddingLeft: `${panelState.maxDataLevel * LINE_SPACE + OUT_GAP}em`,
    paddingRight: `${panelState.maxErrorLevel * LINE_SPACE + OUT_GAP}em`,
  };

  return (
    <div className="ReactPipeDebugPanel">
      <div className="ReactPipeDebugPanel-Inner">
        <div className="ReactPipeDebugPanel-Console">
          <ConsoleRecords
            records={panelState.debugRecords} />
        </div>
        <div className="ReactPipeDebugPanel-Schema" style={style}>
          {panelState.pipeFrames.map((pipe, index) => {
            return (
              <Pipe key={index}
                maxPipeLineIndex={panelState.maxPipeLineIndex}
                pipeFrame={pipe}
                onStreamGroupSelection={handleStreamGroupSelection}
                onEmittedStreamSelection={handleEmittedStreamSelection}
              />
            );
          })}
        </div>
      </div>
      <div className="ReactPipeDebugPanel-FakeSpace" />
    </div>
  );
}
