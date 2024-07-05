import React from 'react';

import { BugSolidIcon } from '../icons/BugSolidIcon';
import { DatabaseSolidIcon } from '../icons/DatabaseSolidIcon';
import { EmittedStreamFrame, StreamValueType } from '../types';

export type EmittedStreamProps = {
  pipeUniqKey: symbol;
  streamValueType: StreamValueType;
  emittedStreamFrame: EmittedStreamFrame;
  selected: boolean;
  onEmittedStreamSelection: (uniqKey: [symbol, symbol]) => void;
};

export const EmittedStream = React.memo(function EmittedStream(props: EmittedStreamProps) {
  const { pipeUniqKey, streamValueType, emittedStreamFrame, selected, onEmittedStreamSelection }
    = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const iconClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Success',
    streamValueType === 'error' ? 'ReactPipeDebugPanel-BugSolidIcon' : 'ReactPipeDebugPanel-DatabaseSolidIcon',
    emittedStreamFrame.released ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleEmittedStreamClick = () => {
    onEmittedStreamSelection([pipeUniqKey, emittedStreamFrame.streamHead]);

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
