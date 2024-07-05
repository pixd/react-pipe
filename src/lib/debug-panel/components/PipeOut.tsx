import React from 'react';

import { ArrowAltLeftSolidIcon } from '../icons/ArrowAltLeftSolidIcon';
import { ArrowAltRightSolidIcon } from '../icons/ArrowAltRightSolidIcon';
import { EmittedStreamFrame } from '../types';
import { EmittedStream } from './EmittedStream';

export type PipeOutProps = {
  pipeUniqKey: symbol;
  emittedStreamFrames: EmittedStreamFrame[];
  selectedEmittedStream: null | symbol;
  onEmittedStreamSelection: (uniqKey: [symbol, symbol]) => void;
};

export const PipeOut = React.memo(function PipeOut(props: PipeOutProps) {
  const { pipeUniqKey, emittedStreamFrames, selectedEmittedStream, onEmittedStreamSelection }
    = props;

  const dataEmittedStreamFrames: EmittedStreamFrame[] = [];
  const errorEmittedStreamFrames: EmittedStreamFrame[] = [];
  emittedStreamFrames.forEach((emittedStreamFrame) => {
    if (emittedStreamFrame.valueType === 'error') {
      errorEmittedStreamFrames.push(emittedStreamFrame);
    }
    else {
      dataEmittedStreamFrames.push(emittedStreamFrame);
    }
  });

  return (
    <div className="ReactPipeDebugPanel-PipeOut">
      <div className="ReactPipeDebugPanel-EmitDataOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <ArrowAltLeftSolidIcon />
          <span>DATA OUT</span>
        </span>
        {dataEmittedStreamFrames.length
          ? dataEmittedStreamFrames.map((emittedStreamFrame, index) => {
            const selected = emittedStreamFrame.streamHead === selectedEmittedStream;

            return (
              <EmittedStream key={index}
                pipeUniqKey={pipeUniqKey}
                streamValueType="data"
                emittedStreamFrame={emittedStreamFrame}
                selected={selected}
                onEmittedStreamSelection={onEmittedStreamSelection} />
            );
          })
          : fakeStreamGroup}
      </div>
      <div className="ReactPipeDebugPanel-EmitErrorOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <span>ERROR OUT</span>
          <ArrowAltRightSolidIcon />
        </span>
        {errorEmittedStreamFrames.length
          ? errorEmittedStreamFrames.map((emittedStreamFrame, index) => {
            const selected = emittedStreamFrame.streamHead === selectedEmittedStream;

            return (
              <EmittedStream key={index}
                pipeUniqKey={pipeUniqKey}
                streamValueType="error"
                emittedStreamFrame={emittedStreamFrame}
                selected={selected}
                onEmittedStreamSelection={onEmittedStreamSelection} />
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
