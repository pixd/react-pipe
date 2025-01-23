import React from 'react';

import { MOUNT_STREAM_HEAD } from '../../mountStreamHead';
import { HeartSolidIcon } from '../icons/HeartSolidIcon';
import { HomeAltSolidIcon } from '../icons/HomeAltSolidIcon';
import { LockSolidIcon } from '../icons/LockSolidIcon';
import { TintSolidIcon } from '../icons/TintSolidIcon';
import { StreamGroupFrame } from '../types';

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
    streamGroupFrame.data.status === 'active' ? 'ReactPipeDebugPanel-IconStatus-Active ReactPipeDebugPanel-IconStatus-Pulse' : 'ReactPipeDebugPanel-IconStatus-Muted',
  ].join(' ');

  const finishedStatusClassName = [
    'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-IconStatus-Warning ReactPipeDebugPanel-LockSolidIcon',
    streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
  ].filter(Boolean).join(' ');

  const handleStreamGroupClick = () => {
    onStreamGroupFrameSelection([pipeUniqKey, streamGroupFrame.data.uniqKey]);

    // const members = Array(streamGroupFrame.data.members.length);
    // streamGroupFrame.data.members.forEach((member, index) => {
    //   if (member) {
    //     members[index] = member.value;
    //   }
    // });

    console.log({
      uniqKey: streamGroupFrame.data.uniqKey,
      streamHead: streamGroupFrame.data.streamHead,
      members: streamGroupFrame.data.members,
      status: streamGroupFrame.data.status,
      deleted: streamGroupFrame.deleted,
    });
  };

  return (
    <div className={className}
      onClick={handleStreamGroupClick}
    >
      {streamGroupFrame.data.streamHead === MOUNT_STREAM_HEAD
        ? (
          <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-HomeAltSolidIcon ReactPipeDebugPanel-IconStatus-Success">
            <HomeAltSolidIcon />
          </div>
        )
        : streamGroupFrame.data.members.map((member, index) => {
          const className = [
            'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-TintSolidIcon',
            streamGroupFrame.data.status === 'finished' && streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
            member ? 'ReactPipeDebugPanel-IconStatus-Success' : 'ReactPipeDebugPanel-IconStatus-Muted',
          ].join(' ');

          return (
            <div key={index} className={className}>
              <TintSolidIcon key={className} />
            </div>
          );
        })}

      {streamGroupFrame.data.status === 'finished'
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
  );
});
