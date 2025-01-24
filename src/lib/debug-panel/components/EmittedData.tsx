import React from 'react';

import { BugSolidIcon } from '../icons/BugSolidIcon';
import { DatabaseSolidIcon } from '../icons/DatabaseSolidIcon';
import { EmittedDataFrame, EmittedDataType } from '../types';

export type EmittedDataProps = {
  pipeUniqKey: symbol;
  streamValueType: EmittedDataType;
  emittedDataFrame: EmittedDataFrame;
  selected: boolean;
  onEmittedDataFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const EmittedData = React.memo(function EmittedData(props: EmittedDataProps) {
  const { pipeUniqKey, streamValueType, emittedDataFrame, selected, onEmittedDataFrameSelection }
    = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const iconClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Success',
    streamValueType === 'error' ? 'ReactPipeDebugPanel-BugSolidIcon' : 'ReactPipeDebugPanel-DatabaseSolidIcon',
    emittedDataFrame.released ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleEmittedDataClick = () => {
    onEmittedDataFrameSelection([pipeUniqKey, emittedDataFrame.papa]);

    console.log({
      papa: emittedDataFrame.papa,
      data: emittedDataFrame.data,
      released: emittedDataFrame.released,
    });
  };

  return (
    <div className={className}
      onClick={handleEmittedDataClick}
    >
      <div className="ReactPipeDebugPanel-StreamGroupMembers">
        <div className={iconClassName}>
          {streamValueType === 'error'
            ? (
              <BugSolidIcon key={iconClassName}/>
            )
            : (
              <DatabaseSolidIcon key={iconClassName}/>
            )}
        </div>
      </div>
      <div className="ReactPipeDebugPanel-StreamGroupName">
        {emittedDataFrame.papa.toString().replace(/Symbol\(papa-([a-z0-9]+)\)/, (...args) => args[1])}
      </div>
    </div>
  );
});
