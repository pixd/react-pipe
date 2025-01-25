import React from 'react';

import { MOUNT_STREAM_HEAD } from '../../mountStreamHead';
import { EStreamGroupStatus } from '../../types';
import { HeartSolidIcon } from '../icons/HeartSolidIcon';
import { HomeAltSolidIcon } from '../icons/HomeAltSolidIcon';
import { LockSolidIcon } from '../icons/LockSolidIcon';
import { TintSolidIcon } from '../icons/TintSolidIcon';
import type { StreamGroupFrame } from '../types';

export type StreamGroupProps = {
  pipeUniqKey: symbol;
  streamGroupFrame: StreamGroupFrame;
  selected: boolean;
  onStreamGroupFrameSelection: (uniqKey: [symbol, symbol]) => void;
};

export const StreamGroup = React.memo(function StreamGroup(props: StreamGroupProps) {
  const { pipeUniqKey, streamGroupFrame, selected, onStreamGroupFrameSelection } = props;

  const className = [
    'ReactPipeDebugPanel-StreamGroup',
    selected ? 'ReactPipeDebugPanel-StreamGroup-Selected' : null,
  ].filter(Boolean).join(' ');

  const statusClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-HeartSolidIcon',
    streamGroupFrame.streamGroup.status === EStreamGroupStatus.closed ? 'ReactPipeDebugPanel-IconStatus-Active ReactPipeDebugPanel-IconStatus-Pulse' : 'ReactPipeDebugPanel-IconStatus-Muted',
  ].join(' ');

  const finishedStatusClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Warning ReactPipeDebugPanel-LockSolidIcon',
    streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleStreamGroupClick = () => {
    onStreamGroupFrameSelection([pipeUniqKey, streamGroupFrame.streamGroup.uniqKey]);

    console.log({
      uniqKey: streamGroupFrame.streamGroup.uniqKey,
      papa: streamGroupFrame.streamGroup.papa,
      members: streamGroupFrame.streamGroup.members,
      status: streamGroupFrame.streamGroup.status,
      deleted: streamGroupFrame.deleted,
    });
  };

  return (
    <div className={className}
      onClick={handleStreamGroupClick}
    >
      <div className="ReactPipeDebugPanel-StreamGroupMembers">
        {streamGroupFrame.streamGroup.papa === MOUNT_STREAM_HEAD
          ? (
            <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-HomeAltSolidIcon ReactPipeDebugPanel-IconStatus-Success">
              <HomeAltSolidIcon />
            </div>
          )
          : streamGroupFrame.streamGroup.members.map((member, index) => {
            const className = [
              'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-TintSolidIcon',
              streamGroupFrame.streamGroup.status === EStreamGroupStatus.retired && streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
              member ? 'ReactPipeDebugPanel-IconStatus-Success' : 'ReactPipeDebugPanel-IconStatus-Muted',
            ].join(' ');

            return (
              <div key={index} className={className}>
                <TintSolidIcon key={className} />
              </div>
            );
          })}

        {streamGroupFrame.streamGroup.status === EStreamGroupStatus.retired
          ? (
            <div className={finishedStatusClassName}>
              <LockSolidIcon key={finishedStatusClassName} />
            </div>
          )
          : (
            <div className={statusClassName}>
              <HeartSolidIcon key={statusClassName} />
            </div>
          )}
      </div>
      <div className="ReactPipeDebugPanel-StreamGroupName">
        {streamGroupFrame.streamGroup.papa.toString().replace(/Symbol\(papa-([a-z0-9]+)\)/, (...args) => args[1])}
      </div>
    </div>
  );
});
