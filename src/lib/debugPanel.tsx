import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

import { BugSolidIcon } from './icons/BugSolidIcon';
import { DatabaseSolidIcon } from './icons/DatabaseSolidIcon';
import { HeartSolidIcon } from './icons/HeartSolidIcon';
import { HomeAltSolidIcon } from './icons/HomeAltSolidIcon';
import { LockSolidIcon } from './icons/LockSolidIcon';
import { TintSolidIcon } from './icons/TintSolidIcon';
import { TrashSolidIcon } from './icons/TrashSolidIcon';
import { createInstruction } from './instruction';
import { MOUNT_STREAM_HEAD } from './mountStreamHead';
import { DEBUG_INSTRUCTION_TYPE, BasePipe, Debugger, PipeState, StreamGroup, StreamGroups }
  from './types';

const COLOR = '#a9b2c4';
const BACKGROUND_COLOR = '#292e38';
const ALT_BACKGROUND_COLOR = '#262a32';
const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
const FONT_SIZE = '1rem';

type PipeFrame = {
  displayName: string;
  pipeState: PipeState;
  streamGroupFrames: StreamGroupFrame[];
  streamConnections: StreamConnection[];
  streamEntries: StreamEntry[];
  maxDataLevel: number;
  maxDataConnectionLevel: number;
  maxErrorLevel: number;
  maxErrorConnectionLevel: number;
  maxDataEntryLevel: number;
  maxErrorEntryLevel: number;
  emitStreamFrames: EmitStreamFrame[];
};

type StreamGroupFrame = {
  deleted: boolean;
  data: StreamGroup;
};

type StreamValueType = 'data' | 'error';

type EmitStreamFrame = {
  streamHead: symbol;
  value: any;
  valueType: StreamValueType;
  released: boolean;
};

const getDefaultPipeFrame = (): Omit<PipeFrame, 'displayName' | 'pipeState'> => {
  return {
    streamConnections: [],
    streamGroupFrames: [],
    streamEntries: [],
    maxDataLevel: 0,
    maxErrorLevel: 0,
    maxDataConnectionLevel: 0,
    maxErrorConnectionLevel: 0,
    maxDataEntryLevel: 0,
    maxErrorEntryLevel: 0,
    emitStreamFrames: [],
  };
};

export function initDebugPanel() {
  const element = document.createElement('div');
  element.style.backgroundColor = BACKGROUND_COLOR;
  element.style.color = COLOR;
  element.style.fontFamily = FONT_FAMILY;
  element.style.fontSize = FONT_SIZE;
  element.style.height = 'calc(100vh - 2em)';
  element.style.position = 'fixed';
  element.style.right = '1em';
  element.style.top = '1em';

  document.body.appendChild(element);

  let state: PanelState = {
    pipeFrames: [],
    maxPipeLineIndex: 0,
    maxDataLevel: 0,
    maxErrorLevel: 0,
  };

  let updatePanelState: (state: PanelState) => void;
  const updatePanel = (nextState: PanelState) => {
    updatePanelState(nextState);
    state = nextState;
  };

  const subscribe = (cb: (state: PanelState) => void) => { updatePanelState = updatePanelState ?? cb; };

  const root = ReactDOM.createRoot(element);
  root.render(<Panel initialState={state} subscribe={subscribe} />);

  const onPipeCreate = (displayName: string, data: { pipeState: PipeState }) => {
    const pipeFrame = {
      displayName,
      pipeState: data.pipeState,
      ...getDefaultPipeFrame(),
    };

    const [pipeFrames, maxPipeLineIndex, maxDataLevel, maxErrorLevel] = addPipeFrame(state.pipeFrames, pipeFrame);

    updatePanel({
      ...state,
      pipeFrames,
      maxPipeLineIndex,
      maxDataLevel,
      maxErrorLevel,
    });
  };

  const onParentPipeStream = (data: { streamGroup: StreamGroup, pipeState: PipeState }) => {
    const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
      return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
    });

    const pipeFrame = state.pipeFrames[pipeFrameIndex];

    const streamGroupFrame = {
      data: data.streamGroup,
      deleted: false,
    };

    let [streamGroupFrames] = addStreamGroupFrame(pipeFrame.streamGroupFrames, streamGroupFrame);
    streamGroupFrames = updateStreamGroupFrames(streamGroupFrames, data.pipeState.streamGroups);
    const emitStreamFrames = updateEmitStreamFrames(pipeFrame.emitStreamFrames, data.pipeState.streamGroups);

    const pipeFrames = [...state.pipeFrames];

    pipeFrames[pipeFrameIndex] = {
      ...pipeFrame,
      pipeState: data.pipeState,
      streamGroupFrames,
      emitStreamFrames,
    };

    updatePanel({
      ...state,
      pipeFrames,
    });
  };

  const onEmit = (data: { streamHead: symbol, value: any, valueType: StreamValueType, streamGroup: StreamGroup, pipeState: PipeState }) => {
    const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
      return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
    });

    const pipeFrame = state.pipeFrames[pipeFrameIndex];

    const emitStreamFrame = { streamHead: data.streamHead, value: data.value, valueType: data.valueType, released: false };

    const streamGroupFrames = updateStreamGroupFrames(pipeFrame.streamGroupFrames, data.pipeState.streamGroups);
    let [emitStreamFrames] = addEmitStreamFrame(pipeFrame.emitStreamFrames, emitStreamFrame);
    emitStreamFrames = updateEmitStreamFrames(emitStreamFrames, data.pipeState.streamGroups);

    const pipeFrames = [...state.pipeFrames];

    pipeFrames[pipeFrameIndex] = {
      ...pipeFrame,
      pipeState: data.pipeState,
      streamGroupFrames,
      emitStreamFrames,
    };

    updatePanel({
      ...state,
      pipeFrames,
    });
  };

  const updatePipeState = (data: { pipeState: PipeState }) => {
    const pipeFrameIndex = state.pipeFrames.findIndex((pipeFrame) => {
      return pipeFrame.pipeState.dataPipe.uniqKey === data.pipeState.dataPipe.uniqKey;
    });

    const pipeFrame = state.pipeFrames[pipeFrameIndex];

    const streamGroupFrames = updateStreamGroupFrames(pipeFrame.streamGroupFrames, data.pipeState.streamGroups);
    const emitStreamFrames = updateEmitStreamFrames(pipeFrame.emitStreamFrames, data.pipeState.streamGroups);

    const pipeFrames = [...state.pipeFrames];

    pipeFrames[pipeFrameIndex] = {
      ...pipeFrame,
      pipeState: data.pipeState,
      streamGroupFrames,
      emitStreamFrames,
    };

    updatePanel({
      ...state,
      pipeFrames,
    });
  };

  const createDebugger = (displayName: string = 'unknown'): Debugger => {
    return {
      onPipeCreate: (data) => {
        console.log('onPipeCreate', data);
        onPipeCreate(displayName, data);
      },
      onPipeCancel: (data) => {
        console.log('onPipeCancel', data);
        updatePipeState(data);
      },
      onPipeCanceled: (data) => {
        console.log('onPipeCanceled', data);
        updatePipeState(data);
      },
      onMountStream: (data) => {
        console.log('onMountStream', data);
        onParentPipeStream(data);
      },
      onParentPipeStream: (data) => {
        console.log('onParentPipeStream', data);
        onParentPipeStream(data);
      },
      onParentPipeTerminate: (data) => {
        console.log('onParentPipeTerminate', data);
        updatePipeState(data);
      },
      onParentPipeTerminated: (data) => {
        console.log('onParentPipeTerminated', data);
        updatePipeState(data);
      },
      onStreamGroupFulfill: (data) => {
        console.log('onStreamGroupFulfill', data);
        updatePipeState(data);
      },
      onStreamRelease: (data) => {
        console.log('onStreamRelease', data);
        updatePipeState(data);
      },
      onStreamGroupFinished: (data) => {
        console.log('onStreamGroupFinished', data);
        updatePipeState(data);
      },
      onStreamGroupRelease: (data) => {
        console.log('onStreamGroupRelease', data);
        updatePipeState(data);
      },
      onStreamGroupReleased: (data) => {
        console.log('onStreamGroupReleased', data);
        updatePipeState(data);
      },
      onStreamGroupTerminate: (data) => {
        console.log('onStreamGroupTerminate', data);
        updatePipeState(data);
      },
      onEmit: (data) => {
        console.log('onEmit', data);
        onEmit(data);
      },
    }
  };

  const debugPanel = {
    ...createInstruction(DEBUG_INSTRUCTION_TYPE),
    createDebugger,
  };

  return { debugPanel };
}

type StreamLineType = 'data' | 'error';

type StreamConnectionDirectionType = 'pass-through' | 'connection';

type StreamConnection = {
  type: StreamLineType;
  directionType: StreamConnectionDirectionType;
  lineGlobalIndex: number;
  level: number;
  source: symbol;
  destination: symbol;
};

type StreamEntry = {
  type: StreamLineType;
  lineGlobalIndex: number;
  level: number;
  entryLevel: number;
};

type PanelState = {
  pipeFrames: PipeFrame[];
  maxPipeLineIndex: number;
  maxDataLevel: number;
  maxErrorLevel: number;
};

function addPipeFrame(pipeFrames: PipeFrame[], newPipeFrame: PipeFrame): [PipeFrame[], number, number, number] {
  const nextPipeFrames = [
    ...pipeFrames.map((pipe) => {
      return {
        ...pipe,
        streamConnections: [],
        streamEntries: [],
        maxDataLevel: 0,
        maxErrorLevel: 0,
        maxDataConnectionLevel: 0,
        maxErrorConnectionLevel: 0,
        maxDataEntryLevel: 0,
        maxErrorEntryLevel: 0,
      } as PipeFrame;
    }),
    newPipeFrame,
  ];

  let lineGlobalIndex = -1;
  let maxDataLevel = 0;
  let maxErrorLevel = 0;

  nextPipeFrames.forEach((destination, destinationIndex) => {
    const targetPipeFrames = nextPipeFrames.slice(0, destinationIndex);

    let lastDataUpstreamPipeIndex = -1;
    let leftErrorUpstreamNumber = 0;

    const dataUpstreamPipes = destination.pipeState.upstreamPipes
      .map((upstreamPipe, index) => {
        upstreamPipe.type === 'data' && (lastDataUpstreamPipeIndex = index);
        return [upstreamPipe, index] as const;
      })
      .filter((data) => data[0].type === 'data')
      .reverse();
    const errorUpstreamPipes = destination.pipeState.upstreamPipes
      .map((upstreamPipe, index) => {
        upstreamPipe.type === 'error' && index < lastDataUpstreamPipeIndex && leftErrorUpstreamNumber ++;
        return [upstreamPipe, index] as const;
      })
      .filter((data) => data[0].type === 'error');

    let dataEntryLevel = dataUpstreamPipes.length;
    let errorEntryLevel = Math.max(leftErrorUpstreamNumber + errorUpstreamPipes.length, errorUpstreamPipes.length);

    [...dataUpstreamPipes, ...errorUpstreamPipes].forEach(([upstreamPipe, upstreamPipeIndex]) => {
      const [sourceIndex, level] = getUpstreamPipeParams(upstreamPipe, targetPipeFrames);
      const source = nextPipeFrames[sourceIndex];

      if (level) {
        lineGlobalIndex ++;

        if (upstreamPipe.type === 'error') {
          maxErrorLevel = Math.max(maxErrorLevel, level);
        }
        else {
          maxDataLevel = Math.max(maxDataLevel, level);
        }

        const maxLevelProp = upstreamPipe.type === 'error' ? 'maxErrorLevel': 'maxDataLevel';
        const maxLevelConnectionProp = upstreamPipe.type === 'error' ? 'maxErrorConnectionLevel': 'maxDataConnectionLevel';
        const maxEntryLevelProp = upstreamPipe.type === 'error' ? 'maxErrorEntryLevel' : 'maxDataEntryLevel';
        const entryLevel = upstreamPipe.type === 'error' ? errorEntryLevel -- : dataEntryLevel -- ;
        const sourceUniqKey = destination.pipeState.dataPipe.uniqKey;
        const destinationUniqKey = source.pipeState.errorPipe.uniqKey;

        nextPipeFrames.slice(sourceIndex + 1, destinationIndex).forEach((pipeFrame) => {
          pipeFrame.streamConnections.push({
            type: upstreamPipe.type,
            directionType: 'pass-through',
            lineGlobalIndex,
            level,
            source: sourceUniqKey,
            destination: destinationUniqKey,
          });
          pipeFrame[maxLevelProp] = Math.max(pipeFrame[maxLevelProp], level);
        });

        source.streamConnections.push({
          type: upstreamPipe.type,
          directionType: 'connection',
          lineGlobalIndex,
          level,
          source: sourceUniqKey,
          destination: destinationUniqKey,
        });
        source[maxLevelProp] = Math.max(source[maxLevelProp], level);
        source[maxLevelConnectionProp] = Math.max(source[maxLevelConnectionProp], level);

        destination.streamEntries[upstreamPipeIndex] = {
          type: upstreamPipe.type,
          lineGlobalIndex,
          level,
          entryLevel,
        };
        destination[maxLevelProp] = Math.max(destination[maxLevelProp], level);
        destination[maxEntryLevelProp] = Math.max(destination[maxEntryLevelProp], entryLevel);
      }
    });
  });

  return [nextPipeFrames, lineGlobalIndex, maxDataLevel, maxErrorLevel];
}

function getUpstreamPipeParams(upstreamPipe: BasePipe, pipeFrames: PipeFrame[]): [number, number] {
  const levels: boolean[] = [];
  let level: number = 0;

  const stateProp = upstreamPipe.type === 'error' ? 'errorPipe' : 'dataPipe';

  const index = [...pipeFrames].reverse().findIndex((pipeFrame) => {
    pipeFrame.streamConnections
      .filter((connection) => connection.type === upstreamPipe.type)
      .forEach((connection) => levels[connection.level - 1] = true);

    if (pipeFrame.pipeState[stateProp].uniqKey === upstreamPipe.uniqKey) {
      level = levels.findIndex(level => ! level) + 1 || levels.length + 1;
      return true;
    }
    else {
      return false;
    }
  });

  const sourceIndex = index > -1 ? pipeFrames.length - index - 1 : -1;

  return [sourceIndex, level];
}

function addStreamGroupFrame(streamGroupFrames: StreamGroupFrame[], newStreamGroupFrame: StreamGroupFrame): [StreamGroupFrame[]] {
  const streamGroupFrameIndex = streamGroupFrames.findIndex((streamGroupFrame) => {
    return streamGroupFrame.data.uniqKey === newStreamGroupFrame.data.uniqKey;
  })

  const nextStreamGroupFrames = [...streamGroupFrames];

  if (streamGroupFrameIndex > -1) {
    nextStreamGroupFrames[streamGroupFrameIndex] = {
      ...nextStreamGroupFrames[streamGroupFrameIndex],
      data: newStreamGroupFrame.data,
    };
  }
  else {
    nextStreamGroupFrames.push(newStreamGroupFrame);
  }

  return [nextStreamGroupFrames]
}

function updateStreamGroupFrames(streamGroupFrames: StreamGroupFrame[], streamGroups: StreamGroups): any {
  return streamGroupFrames.map((streamGroupFrame: StreamGroupFrame) => {
    const streamHead = Object.getOwnPropertySymbols(streamGroups).find((streamHead) => {
      return streamGroups[streamHead].uniqKey === streamGroupFrame.data.uniqKey;
    });

    if (streamHead) {
      return {
        ...streamGroupFrame,
        data: streamGroups[streamHead],
        deleted: false,
      };
    }
    else {
      return {
        ...streamGroupFrame,
        deleted: true,
      }
    }
  });
}

function addEmitStreamFrame(emitStreamFrames: EmitStreamFrame[], newEmitStreamFrame: EmitStreamFrame): [EmitStreamFrame[]] {
  const nextEmitStreamFrames = [
    ...emitStreamFrames,
    newEmitStreamFrame,
  ];

  return [nextEmitStreamFrames];
}

function updateEmitStreamFrames(emitStreamFrames: EmitStreamFrame[], streamGroups: StreamGroups) {
  return emitStreamFrames.map((emitStreamFrame) => {
    const released = Object.getOwnPropertySymbols(streamGroups).every((streamHead) => {
      return null
      ?? (Object.getOwnPropertySymbols(streamGroups[streamHead].emitValueGroups).find((emitGroupStreamHead) => {
        return emitGroupStreamHead === emitStreamFrame.streamHead && ! streamGroups[streamHead].emitValueGroups[emitGroupStreamHead].every(Boolean);
      }) && false)
      ?? (Object.getOwnPropertySymbols(streamGroups[streamHead].emitErrorGroups).find((emitGroupStreamHead) => {
        return emitGroupStreamHead === emitStreamFrame.streamHead && ! streamGroups[streamHead].emitErrorGroups[emitGroupStreamHead].every(Boolean);
      }) && false)
      ?? true;
    });

    return {
      ...emitStreamFrame,
      released,
    };
  });
}

type AppProps = {
  initialState: PanelState;
  subscribe: (cb: (state: PanelState) => void) => void;
};

function Panel(props: AppProps) {
  const { initialState, subscribe } = props;

  const [panelState, setPanelState] = useState<PanelState>(initialState);

  subscribe((state: PanelState) => {
    setPanelState(state);
  });

  const style = {
    marginLeft: `${panelState.maxDataLevel * lineSpace + outGap}em`,
    marginRight: `${panelState.maxErrorLevel * lineSpace + outGap}em`,
  };

  return (
    <div className="ReactPipeDebugPanel">
      <style dangerouslySetInnerHTML={{ __html: styles }}/>
      <div className="ReactPipeDebugPanel-Inner" style={style}>
        {panelState.pipeFrames.map((pipe, index) => {
          return (
            <Pipe key={index}
              maxPipeLineIndex={panelState.maxPipeLineIndex}
              pipe={pipe}
              pipes={panelState.pipeFrames} />
          );
        })}
      </div>
    </div>
  );
}

const pipeBoxWidth = 0.2;
const pipeBoxRadius = 0.4;
const lineSpace = 1.3;
const inShift = 1.84;
const inGap = 1.1;
const inTapLength = 0;
const outShift = 3.2;
const outGap = 1.2;
const centerGap = 0.8;
const borderRadius = 0.4;
const lineWidth = 0.2;
const shadowWidth = 0.46;
const heelWidth = 0.38;
const heelLength = 0.8;
const holeWidth = 0.16;
const holeLength = 0.46;

const shadowShift = round((shadowWidth - lineWidth) / 2);
const heelShift = round((heelWidth - lineWidth) / 2);
const heelRadius = round(borderRadius + heelShift);
const pipeInnerBoxRadius = round(pipeBoxRadius - pipeBoxWidth);

type PipeProps = {
  maxPipeLineIndex: number;
  pipe: PipeFrame;
  pipes: PipeFrame[];
};

const Pipe = React.memo(function Pipe(props: PipeProps) {
  const { pipe } = props;

  const handlePipeClick = (pipe: PipeFrame) => {
    console.log(pipe);
  };

  const maxEntryLevel = Math.max(pipe.maxDataEntryLevel, pipe.maxErrorEntryLevel);

  const style = {
    marginTop: maxEntryLevel ? `${(maxEntryLevel - 1) * lineSpace + inGap + centerGap}em` : `${inGap}em`,
  };

  const baseOutDataWidth = round((pipe.maxDataConnectionLevel - 1) * lineSpace + outGap);
  const baseOutErrorWidth = round((pipe.maxErrorConnectionLevel - 1) * lineSpace + outGap);

  return (
    <div className="ReactPipeDebugPanel-Pipe" style={style}>
      <div className="ReactPipeDebugPanel-Connections">
        {pipe.maxDataConnectionLevel
          ? (
            <div className="ReactPipeDebugPanel-DataOut" style={{ left: `-${baseOutDataWidth}em`, width: `${baseOutDataWidth}em` }}>
              <div />
              <i />
            </div>
          )
          :  null}
        {pipe.maxErrorConnectionLevel
          ? (
            <div className="ReactPipeDebugPanel-ErrorOut" style={{ right: `-${baseOutErrorWidth}em`, width: `${baseOutErrorWidth}em` }}>
              <div />
              <i />
            </div>
          )
          :  null}
        {pipe.streamConnections.map((connection, index) => {
          const ConnectionTypeClassName = connection.type === 'error' ? 'ReactPipeDebugPanel-ErrorConnection' : 'ReactPipeDebugPanel-DataConnection';
          const horizontalProp = connection.type === 'error' ? 'right' : 'left';

          if (connection.directionType === 'connection') {
            const maxConnectionLevelProp = connection.type === 'error' ? 'maxErrorConnectionLevel' : 'maxDataConnectionLevel';
            const TConnectionClassName = pipe[maxConnectionLevelProp] === connection.level ? 'ReactPipeDebugPanel-LConnection' : 'ReactPipeDebugPanel-TConnection';

            const className = [
              'ReactPipeDebugPanel-Connection',
              ConnectionTypeClassName,
              TConnectionClassName,
            ].join(' ');

            const style = {
              [horizontalProp]: `-${round((connection.level - 1) * lineSpace + outGap + lineWidth + heelShift)}em`,
            };

            return (
              <div key={index} className={className} style={style} />
            );
          }
          else {
            const className = [
              'ReactPipeDebugPanel-PathThrough',
              ConnectionTypeClassName,
            ].join(' ');

            const style = {
              height: `calc(100% + ${round((maxEntryLevel - 1) * lineSpace + inGap + centerGap)}em)`,
              [horizontalProp]: `-${round((connection.level - 1) * lineSpace + outGap + lineWidth)}em`,
            };

            return (
              <div key={index} className={className} style={style}>
                <div style={{ zIndex: `-${connection.lineGlobalIndex + 2}` }} />
                <span />
              </div>
            );
          }
        })}
        {pipe.streamEntries.map((streamEntry, index) => {
          const className = streamEntry.type === 'error'
            ? 'ReactPipeDebugPanel-ErrorEntry'
            : 'ReactPipeDebugPanel-DataEntry'

          const leftShift = round(index * lineSpace + inShift - lineWidth);
          const extraWidth = round((streamEntry.level - 1) * lineSpace + outGap);
          const inHeight = round((streamEntry.entryLevel - 1) * lineSpace + inGap);
          const outHeight = round((maxEntryLevel - streamEntry.entryLevel) * lineSpace + centerGap - lineWidth + outShift);
          const zIndex = `-${streamEntry.lineGlobalIndex + 2}`;

          const inStyle = {
            height: `${round(inHeight + inTapLength)}em`,
            left: `${leftShift}em`,
            top: `-${inHeight}em`,
            zIndex,
          };

          const centerStyle = {
            left: streamEntry.type === 'error'
              ? `${round(leftShift + lineWidth)}em`
              : `-${extraWidth}em`,
            top: `-${round(inHeight + lineWidth)}em`,
            width: streamEntry.type === 'error'
              ? `calc(100% - ${round(leftShift + lineWidth - extraWidth)}em)`
              : `${round(extraWidth + leftShift)}em`,
            zIndex,
          };

          const outStyle = {
            height: `${outHeight}em`,
            left: streamEntry.type === 'error'
              ? `calc(100% + ${extraWidth}em)`
              : `-${round(extraWidth + lineWidth)}em`,
            top: `-${round(inHeight + lineWidth + outHeight)}em`,
            zIndex,
          };

          const holeStyle = {
            left: `${leftShift - (holeLength - lineWidth) / 2}em`,
          };

          const inHeelStyle = {
            top: `-${round(inHeight + lineWidth + heelShift)}em`,
            left: streamEntry.type === 'error'
              ? `${round(leftShift - heelShift)}em`
              : `${round(leftShift + lineWidth - heelLength + heelShift)}em`,
          };

          const outHeelStyle = {
            top: `-${round(inHeight + heelLength - heelShift)}em`,
            left: streamEntry.type === 'error'
              ? `calc(100% + ${extraWidth - heelLength + lineWidth + heelShift}em)`
              : `-${round(extraWidth + lineWidth + heelShift)}em`,
          };

          return (
            <div key={index} className={className}>
              <div style={inStyle} />
              <div style={centerStyle} />
              <div style={outStyle} />
              <i style={holeStyle} />
              <span style={inHeelStyle} />
              <span style={outHeelStyle} />
            </div>
          );
        })}
      </div>
      <div className="ReactPipeDebugPanel-PipeBody"
        onClick={() => handlePipeClick(pipe)}
      >
        <div className="ReactPipeDebugPanel-PipeData">
          {pipe.streamGroupFrames.length === 0
            ? (
              <div className="ReactPipeDebugPanel-StreamGroup" style={{ visibility: 'hidden' }}>
                <div className="ReactPipeDebugPanel-StreamGroupMember" />
              </div>
            )
            : pipe.streamGroupFrames.map((streamGroupFrame, index) => {
              const className = [
                'ReactPipeDebugPanel-StreamGroup',
                streamGroupFrame.data.status === 'finished' && streamGroupFrame.deleted ? 'ReactPipeDebugPanel-InactiveIcon' : null,
              ].filter(Boolean).join(' ');

              return (
                <div key={index} className={className}>
                  {streamGroupFrame.data.streamHead === MOUNT_STREAM_HEAD
                    ? (
                      <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-HomeAltSolidIcon ReactPipeDebugPanel-StreamGroupStatus-Success">
                        <HomeAltSolidIcon />
                      </div>
                    )
                    : streamGroupFrame.data.members.map((member, index) => {
                      const className = [
                        'ReactPipeDebugPanel-StreamGroupMember',
                        'ReactPipeDebugPanel-TintSolidIcon',
                        member ? 'ReactPipeDebugPanel-StreamGroupStatus-Success' : 'ReactPipeDebugPanel-StreamGroupStatus-Muted',
                      ].join(' ');

                      return (
                        <div key={index + className} className={className}>
                          <TintSolidIcon />
                        </div>
                      );
                    })}
                  {streamGroupFrame.data.status === 'finished'
                    ? streamGroupFrame.deleted
                      ? (
                        <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-StreamGroupStatus-Warning ReactPipeDebugPanel-TrashSolidIcon">
                          <LockSolidIcon />
                        </div>
                      )
                      : (
                        <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-StreamGroupStatus-Warning ReactPipeDebugPanel-LockSolidIcon">
                          <LockSolidIcon />
                        </div>
                      )
                    : streamGroupFrame.data.status === 'active'
                      ? (
                        <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-StreamGroupStatus-Active ReactPipeDebugPanel-StreamGroupStatus-Pulse ReactPipeDebugPanel-HeartSolidIcon">
                          <HeartSolidIcon key="a" />
                        </div>
                      )
                      : (
                        <div className="ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-StreamGroupStatus-Muted ReactPipeDebugPanel-HeartSolidIcon">
                          <HeartSolidIcon key="b" />
                        </div>
                      )}
                </div>
              );
            })}
        </div>
        <div className="ReactPipeDebugPanel-PipeOut">
          <div className="ReactPipeDebugPanel-EmitDataOut">
            {pipe.emitStreamFrames.filter((emitStreamFrame) => emitStreamFrame.valueType === 'data').length === 0
              ? (
                <div className="ReactPipeDebugPanel-StreamGroup" style={{ visibility: 'hidden' }}>
                  <div className="ReactPipeDebugPanel-StreamGroupMember" />
                </div>
              )
              : pipe.emitStreamFrames.filter((emitStreamFrame) => emitStreamFrame.valueType === 'data').map((emitStreamFrame, index) => {
                const className = [
                  'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-DatabaseSolidIcon ReactPipeDebugPanel-StreamGroupStatus-Success',
                  emitStreamFrame.released ? 'ReactPipeDebugPanel-InactiveIcon' : null,
                ].filter(Boolean).join(' ');

                return (
                  <div key={index} className="ReactPipeDebugPanel-StreamGroup">
                    <div className={className}>
                      <DatabaseSolidIcon key={className} />
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="ReactPipeDebugPanel-EmitErrorOut">
            {pipe.emitStreamFrames.filter((emitStreamFrame) => emitStreamFrame.valueType === 'error').length === 0
              ? (
                <div className="ReactPipeDebugPanel-StreamGroup" style={{ visibility: 'hidden' }}>
                  <div className="ReactPipeDebugPanel-StreamGroupMember" />
                </div>
              )
              : pipe.emitStreamFrames.filter((emitStreamFrame) => emitStreamFrame.valueType === 'error').map((emitStreamFrame, index) => {
                const className = [
                  'ReactPipeDebugPanel-StreamGroupMember ReactPipeDebugPanel-BugSolidIcon ReactPipeDebugPanel-StreamGroupStatus-Error',
                  emitStreamFrame.released ? 'ReactPipeDebugPanel-InactiveIcon' : null,
                ].filter(Boolean).join(' ');

                return (
                  <div key={index} className="ReactPipeDebugPanel-StreamGroup">
                    <div className={className}>
                      <BugSolidIcon key={className} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <div className="ReactPipeDebugPanel-PipeName">
        {pipe.displayName}
      </div>
    </div>
  );
});

function round(value: number) {
  return Math.round(value * 100) / 100;
}

const lineColor = '#5d6e7e';
const heelColor = '#758596';
const pipeBoxColor = '#758596';
const mutedStatusColor = '#4b515f';
const activeStatusColor = '#3d94ba';
const successStatusColor = '#3dba67';
const warningStatusColor = '#ba7f3d';
const errorStatusColor = '#cd5656';

const styles = `
  .ReactPipeDebugPanel {
    border: 1px solid #454b56;
    box-sizing: border-box;
    height: 100%;
    overflow-y: scroll;
    padding-bottom: ${inGap}em;
    overscroll-behavior: contain;
  }

  .ReactPipeDebugPanel * {
    box-sizing: border-box;
  }

  .ReactPipeDebugPanel-Pipe {
    position: relative;
  }

  .ReactPipeDebugPanel-Connections {
    height: 100%;
    position: absolute;
    width: 100%;
  }

  .ReactPipeDebugPanel-DataOut,
  .ReactPipeDebugPanel-ErrorOut {
    bottom: ${outShift}em;
    height: ${lineWidth}em;
    position: absolute;
  }

  .ReactPipeDebugPanel-PathThrough {
    bottom: ${outShift}em;
    position: absolute;
    width: ${lineWidth}em;
  }

  .ReactPipeDebugPanel-DataEntry,
  .ReactPipeDebugPanel-ErrorEntry {
    position: absolute;
    width: 100%;
  }

  .ReactPipeDebugPanel-DataOut > div,
  .ReactPipeDebugPanel-ErrorOut > div {
    z-index: -1;
  }

  .ReactPipeDebugPanel-DataOut > div,
  .ReactPipeDebugPanel-ErrorOut > div,
  .ReactPipeDebugPanel-PathThrough > div {
    height: 100%;
    position: absolute;
    width: 100%;
  }

  .ReactPipeDebugPanel-DataEntry > div,
  .ReactPipeDebugPanel-ErrorEntry > div {
    height: ${lineWidth}em;
    position: absolute;
    width: ${lineWidth}em;
  }

  .ReactPipeDebugPanel-DataOut > div:before,
  .ReactPipeDebugPanel-DataOut > div:after,
  .ReactPipeDebugPanel-ErrorOut > div:before,
  .ReactPipeDebugPanel-ErrorOut > div:after,
  .ReactPipeDebugPanel-PathThrough > div:before,
  .ReactPipeDebugPanel-PathThrough > div:after,
  .ReactPipeDebugPanel-DataEntry > div:before,
  .ReactPipeDebugPanel-DataEntry > div:after,
  .ReactPipeDebugPanel-ErrorEntry > div:before,
  .ReactPipeDebugPanel-ErrorEntry > div:after,
  .ReactPipeDebugPanel-TConnection:after {
    content: "";
    display: block;
    height: 100%;
    position: absolute;
    width: 100%;
  }

  .ReactPipeDebugPanel-DataOut > div:before,
  .ReactPipeDebugPanel-PathThrough > div:before,
  .ReactPipeDebugPanel-DataEntry > div:before,
  .ReactPipeDebugPanel-ErrorEntry > div:before {
    background-color: ${BACKGROUND_COLOR};
  }

  .ReactPipeDebugPanel-DataOut > div:after,
  .ReactPipeDebugPanel-ErrorOut > div:after,
  .ReactPipeDebugPanel-PathThrough > div:after,
  .ReactPipeDebugPanel-DataEntry > div:after,
  .ReactPipeDebugPanel-ErrorEntry > div:after {
    background-color: ${lineColor};
  }

  .ReactPipeDebugPanel-DataOut > div:before,
  .ReactPipeDebugPanel-DataEntry > div:nth-child(2):before,
  .ReactPipeDebugPanel-ErrorEntry > div:nth-child(2):before {
    height: ${shadowWidth}em;
    top: -${shadowShift}em;
  }

  .ReactPipeDebugPanel-PathThrough > div:before,
  .ReactPipeDebugPanel-DataEntry > div:nth-child(1):before,
  .ReactPipeDebugPanel-DataEntry > div:nth-child(3):before,
  .ReactPipeDebugPanel-ErrorEntry > div:nth-child(1):before,
  .ReactPipeDebugPanel-ErrorEntry > div:nth-child(3):before {
    left: -${shadowShift}em;
    width: ${shadowWidth}em;
  }

  .ReactPipeDebugPanel-PathThrough > span {
    background-color: transparent;
    bottom: -${round(heelLength - lineWidth - heelShift)}em;
    height: ${heelLength}em;
    left: -${heelShift}em;
    width: ${heelWidth}em;
  }

  .ReactPipeDebugPanel-PathThrough > span,
  .ReactPipeDebugPanel-DataEntry > span,
  .ReactPipeDebugPanel-ErrorEntry > span {
    display: block;
    position: absolute;
    z-index: -1;
  }

  .ReactPipeDebugPanel-DataEntry > span,
  .ReactPipeDebugPanel-ErrorEntry > span {
    border-color: ${heelColor};
    border-style: solid;
    height: ${heelLength}em;
    width: ${heelLength}em;
    z-index: -1;
  }

  .ReactPipeDebugPanel-DataEntry > span:first-of-type {
    border-radius: 0 ${heelRadius}em 0 0;
    border-width: ${heelWidth}em ${heelWidth}em 0 0;
  }

  .ReactPipeDebugPanel-ErrorEntry > span:first-of-type {
    border-radius: ${heelRadius}em 0 0 0;
    border-width: ${heelWidth}em 0 0 ${heelWidth}em;
  }

  .ReactPipeDebugPanel-DataEntry > span:last-of-type {
    border-radius: 0 0 0 ${heelRadius}em;
    border-width: 0 0 ${heelWidth}em ${heelWidth}em;
  }

  .ReactPipeDebugPanel-ErrorEntry > span:last-of-type {
    border-radius: 0 0 ${heelRadius}em 0;
    border-width: 0 ${heelWidth}em ${heelWidth}em 0;
  }

  .ReactPipeDebugPanel-DataOut > i,
  .ReactPipeDebugPanel-ErrorOut > i,
  .ReactPipeDebugPanel-DataEntry > i,
  .ReactPipeDebugPanel-ErrorEntry > i {
    background-color: ${heelColor};
    display: block;
    position: absolute;
    z-index: -1;
  }

  .ReactPipeDebugPanel-DataOut > i,
  .ReactPipeDebugPanel-ErrorOut > i {
    bottom: -${round((holeLength - lineWidth) / 2)}em;
    height: ${holeLength}em;
    width: calc(${holeWidth}em + 1px);
  }

  .ReactPipeDebugPanel-DataOut > i {
    right: -1px;
  }

  .ReactPipeDebugPanel-ErrorOut > i {
    left: -1px;
  }

  .ReactPipeDebugPanel-DataEntry > i,
  .ReactPipeDebugPanel-ErrorEntry > i {
    height: calc(${holeWidth}em + 1px);
    position: absolute;
    top: -${holeWidth}em;
    width: ${holeLength}em;
  }

  .ReactPipeDebugPanel-Connection {
    border-color: ${heelColor};
    border-style: solid;
    border-width: ${heelWidth}em 0 0 0;
    bottom: ${round(outShift - heelLength + lineWidth + heelShift)}em;
    height: ${heelLength}em;
    position: absolute;
    width: ${heelLength}em;
    z-index: -1;
  }

  .ReactPipeDebugPanel-DataConnection.ReactPipeDebugPanel-TConnection {
    margin-left: -${round((heelLength - heelWidth) / 2)}em;
  }

  .ReactPipeDebugPanel-ErrorConnection.ReactPipeDebugPanel-TConnection {
    margin-right: -${round((heelLength - heelWidth) / 2)}em;
  }

  .ReactPipeDebugPanel-TConnection:after {
    background-color: ${heelColor};
    height: ${round(heelLength - heelWidth)}em;
    margin-left: ${round((heelLength - heelWidth) / 2)}em;
    width: ${heelWidth}em;
  }

  .ReactPipeDebugPanel-DataConnection.ReactPipeDebugPanel-LConnection {
    border-radius: ${heelRadius}em 0 0 0;
    border-width: ${heelWidth}em 0 0 ${heelWidth}em;
  }

  .ReactPipeDebugPanel-ErrorConnection.ReactPipeDebugPanel-LConnection {
    border-radius: 0 ${heelRadius}em 0 0;
    border-width: ${heelWidth}em ${heelWidth}em 0 0;
  }

  .ReactPipeDebugPanel-PipeBody {
    border: ${pipeBoxWidth}em solid ${pipeBoxColor};
    border-radius: ${pipeBoxRadius}em;
    cursor: pointer;
    position: relative;
    width: 35em;
    z-index: 1;
  }

  .ReactPipeDebugPanel-PipeData {
    display: flex;
    padding: 0.4em;
    position: relative;
  }

  .ReactPipeDebugPanel-PipeOut {
    justify-content: space-between;
    border-top: 1px dashed #3e4551;
    display: flex;
  }

  .ReactPipeDebugPanel-EmitDataOut {
    background-color: ${ALT_BACKGROUND_COLOR};
    border-radius: 0 0 0 ${pipeInnerBoxRadius}em;
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 0.4em;
    position: relative;
  }

  .ReactPipeDebugPanel-EmitErrorOut {
    background-color: #322c2c;
    border-left: 1px dashed #3e4551;
    border-radius: 0 0 ${pipeInnerBoxRadius}em 0;
    display: flex;
    overflow: hidden;
    padding: 0.4em;
    position: relative;
    width: 8em;
  }

  .ReactPipeDebugPanel-StreamGroup {
    align-items: center;
    background: #242933;
    border: 0.1em solid #222427;
    border-radius: 0.2em;
    display: flex;
    height: fit-content;
    margin-right: 0.4em;
    padding: 0.5em 0.6em;
  }

  .ReactPipeDebugPanel-StreamGroupMember {
    align-items: center;
    display: flex;
    justify-content: center;
    height: 1em;
    width: 1em;
  }

  .ReactPipeDebugPanel-StreamGroupMember svg {
    animation: pulse 1.6s;
    display: block;
  }

  .ReactPipeDebugPanel-StreamGroupMember + .ReactPipeDebugPanel-StreamGroupMember {
    margin-left: 0.3em;
  }

  .ReactPipeDebugPanel-StreamGroupStatus-Muted svg {
    fill: ${mutedStatusColor};
  }

  .ReactPipeDebugPanel-StreamGroupStatus-Active svg {
    fill: ${activeStatusColor};
  }

  .ReactPipeDebugPanel-StreamGroupStatus-Success svg {
    fill: ${successStatusColor};
  }

  .ReactPipeDebugPanel-StreamGroupStatus-Warning svg {
    fill: ${warningStatusColor};
  }

  .ReactPipeDebugPanel-StreamGroupStatus-Error svg {
    fill: ${errorStatusColor};
  }

  .ReactPipeDebugPanel-StreamGroupStatus-Pulse svg {
    animation: pulse 1.6s infinite;
  }

  .ReactPipeDebugPanel-DatabaseSolidIcon svg {
    width: 0.76em;
  }

  .ReactPipeDebugPanel-BugSolidIcon svg {
    width: 0.9em;
  }

  .ReactPipeDebugPanel-HeartSolidIcon svg {
    width: 0.96em;
  }

  .ReactPipeDebugPanel-LockSolidIcon svg {
    width: 0.8em;
  }

  .ReactPipeDebugPanel-TrashSolidIcon svg {
    width: 0.8em;
  }

  .ReactPipeDebugPanel-TintSolidIcon svg {
    width: 0.64em;
  }

  .ReactPipeDebugPanel-HomeAltSolidIcon svg {
    width: 1em;
  }

  .ReactPipeDebugPanel-InactiveIcon svg {
    opacity: 0.4;
  }

  .ReactPipeDebugPanel-PipeName {
    font-size: 0.8em;
    padding: 0.4em 0.6em;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    5% {
      transform: scale(0.9);
    }
    10% {
      transform: scale(1.2);
    }
    15% {
      transform: scale(0.9);
    }
    20% {
      transform: scale(1);
    }
  }
`;
