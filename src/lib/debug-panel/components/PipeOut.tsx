import React from 'react';

import { ArrowAltLeftSolidIcon } from '../icons/ArrowAltLeftSolidIcon';
import { ArrowAltRightSolidIcon } from '../icons/ArrowAltRightSolidIcon';
import { EmittedDataFrame } from '../types';
import { EmittedData } from './EmittedData';

export type PipeOutProps = {
  pipeUniqKey: symbol;
  emittedDataFrames: EmittedDataFrame[];
  selectedEmittedDataFrame: null | symbol;
  onEmittedDataFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const PipeOut = React.memo(function PipeOut(props: PipeOutProps) {
  const { pipeUniqKey, emittedDataFrames, selectedEmittedDataFrame, onEmittedDataFrameSelection }
    = props;

  const dataEmittedDataFrames: EmittedDataFrame[] = [];
  const errorEmittedDataFrames: EmittedDataFrame[] = [];
  emittedDataFrames.forEach((emittedDataFrame) => {
    if (emittedDataFrame.dataType === 'error') {
      errorEmittedDataFrames.push(emittedDataFrame);
    }
    else {
      dataEmittedDataFrames.push(emittedDataFrame);
    }
  });

  return (
    <div className="ReactPipeDebugPanel-PipeOut">
      <div className="ReactPipeDebugPanel-EmitDataOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <ArrowAltLeftSolidIcon />
          <span>DATA OUT</span>
        </span>
        {dataEmittedDataFrames.length
          ? dataEmittedDataFrames.map((emittedDataFrame, index) => {
            const selected = emittedDataFrame.papa === selectedEmittedDataFrame;

            return (
              <EmittedData key={index}
                pipeUniqKey={pipeUniqKey}
                streamValueType="data"
                emittedDataFrame={emittedDataFrame}
                selected={selected}
                onEmittedDataFrameSelection={onEmittedDataFrameSelection} />
            );
          })
          : fakeStreamGroup}
      </div>
      <div className="ReactPipeDebugPanel-EmitErrorOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <span>ERROR OUT</span>
          <ArrowAltRightSolidIcon />
        </span>
        {errorEmittedDataFrames.length
          ? errorEmittedDataFrames.map((emittedDataFrame, index) => {
            const selected = emittedDataFrame.papa === selectedEmittedDataFrame;

            return (
              <EmittedData key={index}
                pipeUniqKey={pipeUniqKey}
                streamValueType="error"
                emittedDataFrame={emittedDataFrame}
                selected={selected}
                onEmittedDataFrameSelection={onEmittedDataFrameSelection} />
            );
          })
          : fakeStreamGroup}
      </div>
    </div>
  );
});

const fakeStreamGroup = (
  <div className="ReactPipeDebugPanel-StreamGroup" style={{ visibility: 'hidden' }}>
    <div className="ReactPipeDebugPanel-StreamGroupMember" />
  </div>
);
