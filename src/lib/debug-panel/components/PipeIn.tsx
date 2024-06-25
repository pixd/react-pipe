import React from 'react';

import { ArrowAltDownSolidIcon } from '../icons/ArrowAltDownSolidIcon';
import { StreamGroupFrame } from '../types';
import { StreamGroup } from './StreamGroup';

export type PipeInProps = {
  streamGroupFrames: StreamGroupFrame[];
  onStreamGroupSelection: (uniqKey: symbol, selected: boolean) => void;
};

export const PipeIn = React.memo(function PipeIn(props: PipeInProps) {
  const { streamGroupFrames, onStreamGroupSelection } = props;

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
          return (
            <StreamGroup key={index}
              streamGroupFrame={streamGroupFrame}
              onStreamGroupSelection={onStreamGroupSelection} />
          );
        })}
    </div>
  );
});
