import React from 'react';

import { DebugRecord } from '../types';
import { ConsoleRecord } from './ConsoleRecord';

export type ConsoleRecordsProps = {
  records: DebugRecord[];
};

export const ConsoleRecords = React.memo(function ConsoleRecords(props: ConsoleRecordsProps) {
  const { records } = props;

  return (
    <div className="ReactPipeDebugPanel-ConsoleRecords">
      {records.length
        ? records.map((record, index) => {
          return (
            <ConsoleRecord key={index}
              record={record} />
          );
        })
        : (
          <div className="ReactPipeDebugPanel-ConsoleRecord">
            <div className="ReactPipeDebugPanel-Time" />
            <div className="ReactPipeDebugPanel-Message" />
          </div>
        )}
    </div>
  );
});
