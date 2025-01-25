import React from 'react';

import { BugSolidIcon } from '../icons/BugSolidIcon';
import { DatabaseSolidIcon } from '../icons/DatabaseSolidIcon';
import { DataBarrelFrame } from '../types';

export type DataBarrelProps = {
  pipeUniqKey: symbol;
  dataBarrelFrame: DataBarrelFrame;
  selected: boolean;
  onDataBarrelFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const DataBarrel = React.memo(function DataBarrel(props: DataBarrelProps) {
  const { pipeUniqKey, dataBarrelFrame, selected, onDataBarrelFrameSelection } = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const iconClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Success',
    dataBarrelFrame.dataBarrel.dataType === 'error' ? 'ReactPipeDebugPanel-BugSolidIcon' : 'ReactPipeDebugPanel-DatabaseSolidIcon',
    dataBarrelFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleDataBarrelClick = () => {
    onDataBarrelFrameSelection([pipeUniqKey, dataBarrelFrame.dataBarrel.uniqKey]);

    console.log({
      papa: dataBarrelFrame.papa,
      data: dataBarrelFrame.dataBarrel.data,
      released: dataBarrelFrame.deleted,
    });
  };

  return (
    <div className={className}
      onClick={handleDataBarrelClick}
    >
      <div className="ReactPipeDebugPanel-StreamGroupMembers">
        <div className={iconClassName}>
          {dataBarrelFrame.dataBarrel.dataType === 'error'
            ? (
              <BugSolidIcon key={iconClassName}/>
            )
            : (
              <DatabaseSolidIcon key={iconClassName}/>
            )}
        </div>
      </div>
      <div className="ReactPipeDebugPanel-StreamGroupName">
        {dataBarrelFrame.papa.toString().replace(/Symbol\(papa-([a-z0-9]+)\)/, (...args) => args[1])}
      </div>
    </div>
  );
});
