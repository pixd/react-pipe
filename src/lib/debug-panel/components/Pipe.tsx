import React from 'react';

import { IN_END_GAP, IN_GAP, LINE_SPACE } from '../styles-constants';
import { round } from '../styles-tools';
import { PipeFrame } from '../types';
import { Connections } from './Connections';
import { PipeIn } from './PipeIn';
import { PipeOut } from './PipeOut';

export type PipeProps = {
  pipeFrame: PipeFrame;
  selected: boolean;
  selectedStreamGroupFrame: null | symbol;
  selectedDataBarrelFrame: null | symbol;
  onPipeSelection: (uniqKey: symbol) => void;
  onStreamGroupFrameSelection: (uniqKey: [symbol, symbol]) => void;
  onDataBarrelFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const Pipe = React.memo(function Pipe(props: PipeProps) {
  const { pipeFrame, selected, selectedStreamGroupFrame, selectedDataBarrelFrame, onPipeSelection,
    onStreamGroupFrameSelection, onDataBarrelFrameSelection } = props;

  const handlePipeClick = () => {
    onPipeSelection(pipeFrame.pipeState.dataPipe.uniqKey);

    // TODO Should display another data in production
    console.log(pipeFrame);
  };

  const className = [
    'ReactPipeDebugPanel-Pipe',
    selected ? 'ReactPipeDebugPanel-Pipe-Selected' : null,
  ].filter(Boolean).join(' ');

  const maxEntryLevel = Math.max(pipeFrame.maxDataEntryLevel, pipeFrame.maxErrorEntryLevel);

  const style = {
    marginTop: maxEntryLevel ? `${round((maxEntryLevel - 1) * LINE_SPACE + IN_GAP + IN_END_GAP)}em` : `${IN_GAP}em`,
  };

  return (
    <div className={className} style={style}>
      <Connections
        maxDataEntryLevel={pipeFrame.maxDataEntryLevel}
        maxErrorEntryLevel={pipeFrame.maxErrorEntryLevel}
        maxDataConnectionLevel={pipeFrame.maxDataConnectionLevel}
        maxErrorConnectionLevel={pipeFrame.maxErrorConnectionLevel}
        streamConnections={pipeFrame.streamConnections}
        streamEntries={pipeFrame.streamEntries} />
      <div className="ReactPipeDebugPanel-PipeBody">
        <PipeIn
          pipeUniqKey={pipeFrame.pipeState.dataPipe.uniqKey}
          streamGroupFrames={pipeFrame.streamGroupFrames}
          selectedStreamGroupFrame={selectedStreamGroupFrame}
          onStreamGroupFrameSelection={onStreamGroupFrameSelection} />
        <PipeOut
          pipeUniqKey={pipeFrame.pipeState.dataPipe.uniqKey}
          dataBarrelFrames={pipeFrame.dataBarrelFrames}
          selectedDataBarrelFrame={selectedDataBarrelFrame}
          onDataBarrelFrameSelection={onDataBarrelFrameSelection} />
      </div>
      <div className="ReactPipeDebugPanel-PipeName"
        onClick={handlePipeClick}
      >
        {pipeFrame.pipeState.displayName}
      </div>
    </div>
  );
});
