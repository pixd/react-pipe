import React from 'react';

import { ArrowAltLeftSolidIcon } from '../icons/ArrowAltLeftSolidIcon';
import { ArrowAltRightSolidIcon } from '../icons/ArrowAltRightSolidIcon';
import { EmittedValueFrame } from '../types';
import { EmittedValue } from './EmittedValue';

export type PipeOutProps = {
  pipeUniqKey: symbol;
  emittedValueFrames: EmittedValueFrame[];
  selectedEmittedValueFrame: null | symbol;
  onEmittedValueFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const PipeOut = React.memo(function PipeOut(props: PipeOutProps) {
  const { pipeUniqKey, emittedValueFrames, selectedEmittedValueFrame, onEmittedValueFrameSelection }
    = props;

  const dataEmittedValueFrames: EmittedValueFrame[] = [];
  const errorEmittedValueFrames: EmittedValueFrame[] = [];
  emittedValueFrames.forEach((emittedValueFrame) => {
    if (emittedValueFrame.dataType === 'error') {
      errorEmittedValueFrames.push(emittedValueFrame);
    }
    else {
      dataEmittedValueFrames.push(emittedValueFrame);
    }
  });

  return (
    <div className="ReactPipeDebugPanel-PipeOut">
      <div className="ReactPipeDebugPanel-EmitDataOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <ArrowAltLeftSolidIcon />
          <span>DATA OUT</span>
        </span>
        {dataEmittedValueFrames.length
          ? dataEmittedValueFrames.map((emittedValueFrame, index) => {
            const selected = emittedValueFrame.streamHead === selectedEmittedValueFrame;

            return (
              <EmittedValue key={index}
                pipeUniqKey={pipeUniqKey}
                streamValueType="data"
                emittedValueFrame={emittedValueFrame}
                selected={selected}
                onEmittedValueFrameSelection={onEmittedValueFrameSelection} />
            );
          })
          : fakeStreamGroup}
      </div>
      <div className="ReactPipeDebugPanel-EmitErrorOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <span>ERROR OUT</span>
          <ArrowAltRightSolidIcon />
        </span>
        {errorEmittedValueFrames.length
          ? errorEmittedValueFrames.map((emittedValueFrame, index) => {
            const selected = emittedValueFrame.streamHead === selectedEmittedValueFrame;

            return (
              <EmittedValue key={index}
                pipeUniqKey={pipeUniqKey}
                streamValueType="error"
                emittedValueFrame={emittedValueFrame}
                selected={selected}
                onEmittedValueFrameSelection={onEmittedValueFrameSelection} />
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
