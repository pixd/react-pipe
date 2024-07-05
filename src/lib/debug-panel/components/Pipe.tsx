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
  selectedStreamGroup: null | symbol;
  selectedEmittedStream: null | symbol;
  onPipeSelection: (uniqKey: symbol) => void;
  onStreamGroupSelection: (uniqKey: [symbol, symbol]) => void;
  onEmittedStreamSelection: (uniqKey: [symbol, symbol]) => void;
};

export const Pipe = React.memo(function Pipe(props: PipeProps) {
  const { pipeFrame, selected, selectedStreamGroup, selectedEmittedStream, onPipeSelection,
    onStreamGroupSelection, onEmittedStreamSelection } = props;

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
          selectedStreamGroup={selectedStreamGroup}
          onStreamGroupSelection={onStreamGroupSelection} />
        <PipeOut
          pipeUniqKey={pipeFrame.pipeState.dataPipe.uniqKey}
          emittedStreamFrames={pipeFrame.emittedStreamFrames}
          selectedEmittedStream={selectedEmittedStream}
          onEmittedStreamSelection={onEmittedStreamSelection} />
      </div>
      <div className="ReactPipeDebugPanel-PipeName"
        onClick={handlePipeClick}
      >
        {pipeFrame.pipeState.displayName}
      </div>
    </div>
  );
});
