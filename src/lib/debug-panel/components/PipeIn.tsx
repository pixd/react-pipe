import React from 'react';

import { ArrowAltDownSolidIcon } from '../icons/ArrowAltDownSolidIcon';
import { StreamGroupFrame } from '../types';
import { StreamGroup } from './StreamGroup';

export type PipeInProps = {
  pipeUniqKey: symbol;
  streamGroupFrames: StreamGroupFrame[];
  selectedStreamGroupFrame: null | symbol;
  onStreamGroupFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const PipeIn = React.memo(function PipeIn(props: PipeInProps) {
  const { pipeUniqKey, streamGroupFrames, selectedStreamGroupFrame, onStreamGroupFrameSelection } = props;

  return (
    <div className="ReactPipeDebugPanel-PipeIn">
      <span className="ReactPipeDebugPanel-SectionName">
        <ArrowAltDownSolidIcon />
        <span>DATA IN</span>
      </span>
      {streamGroupFrames.length === 0
        ? (
          <div className="ReactPipeDebugPanel-StreamGroup" style={{ visibility: 'hidden' }}>
            <div className="ReactPipeDebugPanel-StreamGroupMember" />
          </div>
        )
        : streamGroupFrames.map((streamGroupFrame, index) => {
          const selected = streamGroupFrame.data.uniqKey === selectedStreamGroupFrame;

          return (
            <StreamGroup key={index}
              pipeUniqKey={pipeUniqKey}
              streamGroupFrame={streamGroupFrame}
              selected={selected}
              onStreamGroupFrameSelection={onStreamGroupFrameSelection} />
          );
        })}
    </div>
  );
});
