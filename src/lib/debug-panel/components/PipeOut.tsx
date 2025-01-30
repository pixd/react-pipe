import { memo } from 'react';

import { EDataType } from '../../types';
import { ArrowAltLeftSolidIcon } from '../icons/ArrowAltLeftSolidIcon';
import { ArrowAltRightSolidIcon } from '../icons/ArrowAltRightSolidIcon';
import type { DataBarrelFrame } from '../types';
import { DataBarrel } from './DataBarrel';
import { FakeStreamGroup } from './FakeStreamGroup';

export type PipeOutProps = {
  pipeUniqKey: symbol;
  dataBarrelFrames: DataBarrelFrame[];
  selectedDataBarrelFrame: null | symbol;
  onDataBarrelFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const PipeOut = memo(function PipeOut(props: PipeOutProps) {
  const { pipeUniqKey, dataBarrelFrames, selectedDataBarrelFrame, onDataBarrelFrameSelection }
    = props;

  const dataDataBarrelFrames: DataBarrelFrame[] = [];
  const errorDataBarrelFrames: DataBarrelFrame[] = [];
  dataBarrelFrames.forEach((dataBarrelFrame) => {
    if (dataBarrelFrame.dataBarrel.dataType === EDataType.error) {
      errorDataBarrelFrames.push(dataBarrelFrame);
    }
    else {
      dataDataBarrelFrames.push(dataBarrelFrame);
    }
  });

  return (
    <div className="ReactPipeDebugPanel-PipeOut">
      <div className="ReactPipeDebugPanel-EmitDataOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <ArrowAltLeftSolidIcon />
          <span>DATA OUT</span>
        </span>
        {dataDataBarrelFrames.length
          ? dataDataBarrelFrames.map((dataBarrelFrame, index) => {
            const selected = dataBarrelFrame.dataBarrel.uniqKey === selectedDataBarrelFrame;

            return (
              <DataBarrel key={index}
                pipeUniqKey={pipeUniqKey}
                dataBarrelFrame={dataBarrelFrame}
                selected={selected}
                onDataBarrelFrameSelection={onDataBarrelFrameSelection} />
            );
          })
          : (
            <FakeStreamGroup />
          )}
      </div>
      <div className="ReactPipeDebugPanel-EmitErrorOut">
        <span className="ReactPipeDebugPanel-SectionName">
          <span>ERROR OUT</span>
          <ArrowAltRightSolidIcon />
        </span>
        {errorDataBarrelFrames.length
          ? errorDataBarrelFrames.map((dataBarrelFrame, index) => {
            const selected = dataBarrelFrame.dataBarrel.uniqKey === selectedDataBarrelFrame;

            return (
              <DataBarrel key={index}
                pipeUniqKey={pipeUniqKey}
                dataBarrelFrame={dataBarrelFrame}
                selected={selected}
                onDataBarrelFrameSelection={onDataBarrelFrameSelection} />
            );
          })
          : (
            <FakeStreamGroup />
          )}
      </div>
    </div>
  );
});
