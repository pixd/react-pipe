import { streamGroupStatus } from 'es-pipes/core';
import { memo } from 'react';

import { GhostSolidIcon } from '../icons/GhostSolidIcon';
import { HeartSolidIcon } from '../icons/HeartSolidIcon';
import { HomeAltSolidIcon } from '../icons/HomeAltSolidIcon';
import { TintSolidIcon } from '../icons/TintSolidIcon';
import type { StreamGroupFrame } from '../types';

export type StreamGroupProps = {
  pipeUniqKey: symbol;
  streamGroupFrame: StreamGroupFrame;
  selected: boolean;
  onStreamGroupFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const StreamGroup = memo(function StreamGroup(props: StreamGroupProps) {
  const { pipeUniqKey, streamGroupFrame, selected, onStreamGroupFrameSelection } = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const openClosedStatusClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-HeartSolidIcon',
    streamGroupFrame.streamGroup.status === streamGroupStatus.closed ? 'ReactPipeDebugPanel-IconStatus-Active ReactPipeDebugPanel-IconStatus-Pulse' : 'ReactPipeDebugPanel-IconStatus-Muted',
  ].filter(Boolean).join(' ');

  const retiredStatusClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-GhostSolidIcon',
    streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const papaClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-HomeAltSolidIcon ReactPipeDebugPanel-IconStatus-Success',
    streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleStreamGroupClick = () => {
    onStreamGroupFrameSelection([pipeUniqKey, streamGroupFrame.streamGroup.uniqKey]);
    console.log(streamGroupFrame);
  };

  const isPapa = streamGroupFrame.streamGroup.members.length === 0
    && streamGroupFrame.streamGroup.papa.toString() === 'Symbol(papa-mount)';

  return (
    <div className={className}
      onClick={handleStreamGroupClick}
    >
      <div className="ReactPipeDebugPanel-StreamGroupMembers">
        {isPapa
          ? (
            <div className={papaClassName}>
              <HomeAltSolidIcon />
            </div>
          )
          : streamGroupFrame.streamGroup.members.map((member, index) => {
            const className = [
              'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-TintSolidIcon',
              streamGroupFrame.streamGroup.status === streamGroupStatus.retired && streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
              member ? 'ReactPipeDebugPanel-IconStatus-Success' : 'ReactPipeDebugPanel-IconStatus-Muted',
            ].filter(Boolean).join(' ');

            return (
              <div key={index} className={className}>
                <TintSolidIcon key={className} />
              </div>
            );
          })}

        {streamGroupFrame.streamGroup.status === streamGroupStatus.open
          ? (
            <div className={openClosedStatusClassName}>
              <HeartSolidIcon key={openClosedStatusClassName} />
            </div>
          )
          : streamGroupFrame.streamGroup.status === streamGroupStatus.closed
            ? (
              <div className={openClosedStatusClassName}>
                <HeartSolidIcon key={openClosedStatusClassName} />
              </div>
            )
            : (
              <div className={retiredStatusClassName}>
                <GhostSolidIcon key={retiredStatusClassName} />
              </div>
            )}
      </div>
      <div className="ReactPipeDebugPanel-StreamGroupName">
        {streamGroupFrame.streamGroup.papa.toString().replace(/Symbol\(papa-([a-z0-9]+)\)/, (...args) => args[1])}
      </div>
    </div>
  );
});
