import React from 'react';

import { BugSolidIcon } from '../icons/BugSolidIcon';
import { DatabaseSolidIcon } from '../icons/DatabaseSolidIcon';
import { EmittedStreamFrame, StreamValueType } from '../types';

export type EmittedStreamProps = {
  streamValueType: StreamValueType;
  emittedStreamFrame: EmittedStreamFrame;
  onEmittedStreamSelection: (streamHead: symbol, selected: boolean) => void;
};

export const EmittedStream = React.memo(function EmittedStream(props: EmittedStreamProps) {
  const { streamValueType, emittedStreamFrame, onEmittedStreamSelection } = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    emittedStreamFrame.selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const iconClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Success',
    streamValueType === 'error' ? 'ReactPipeDebugPanel-BugSolidIcon' : 'ReactPipeDebugPanel-DatabaseSolidIcon',
    emittedStreamFrame.released ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleEmittedStreamClick = () => {
    onEmittedStreamSelection(emittedStreamFrame.streamHead, ! emittedStreamFrame.selected);

    console.log({
      streamReleased: emittedStreamFrame.released,
      value: emittedStreamFrame.value,
    });
  };

  return (
    <div className={className}
      onClick={handleEmittedStreamClick}
    >
      <div className={iconClassName}>
        {streamValueType === 'error'
          ? (
            <BugSolidIcon key={iconClassName} />
          )
          : (
            <DatabaseSolidIcon key={iconClassName} />
          )}
      </div>
    </div>
  );
});
