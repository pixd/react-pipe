import React from 'react';

import { BugSolidIcon } from '../icons/BugSolidIcon';
import { DatabaseSolidIcon } from '../icons/DatabaseSolidIcon';
import { EmittedValueFrame, EmittedValueType } from '../types';

export type EmittedValueProps = {
  pipeUniqKey: symbol;
  streamValueType: EmittedValueType;
  emittedValueFrame: EmittedValueFrame;
  selected: boolean;
  onEmittedValueFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const EmittedValue = React.memo(function EmittedValue(props: EmittedValueProps) {
  const { pipeUniqKey, streamValueType, emittedValueFrame, selected, onEmittedValueFrameSelection }
    = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const iconClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Success',
    streamValueType === 'error' ? 'ReactPipeDebugPanel-BugSolidIcon' : 'ReactPipeDebugPanel-DatabaseSolidIcon',
    emittedValueFrame.released ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleEmittedValueClick = () => {
    onEmittedValueFrameSelection([pipeUniqKey, emittedValueFrame.streamHead]);

    console.log({
      released: emittedValueFrame.released,
      data: emittedValueFrame.data,
    });
  };

  return (
    <div className={className}
      onClick={handleEmittedValueClick}
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
