import { BasePipe, StreamGroups } from '../types';
import { EmittedStreamFrame, PipeFrame, StreamGroupFrame } from './types';

export function getUpstreamPipeParams(upstreamPipe: BasePipe, pipeFrames: PipeFrame[]): [number, number] {
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

export function addPipeFrame(pipeFrames: PipeFrame[], newPipeFrame: PipeFrame): [PipeFrame[], number, number, number] {
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

export function addStreamGroupFrame(streamGroupFrames: StreamGroupFrame[], newStreamGroupFrame: StreamGroupFrame): [StreamGroupFrame[]] {
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

export function updateStreamGroupFrames(streamGroupFrames: StreamGroupFrame[], streamGroups: StreamGroups): StreamGroupFrame[] {
  let changed = false;

  const nextStreamGroupFrames = streamGroupFrames.map((streamGroupFrame: StreamGroupFrame) => {
    const streamHead = Object.getOwnPropertySymbols(streamGroups).find((streamHead) => {
      return streamGroups[streamHead].uniqKey === streamGroupFrame.data.uniqKey;
    });

    if (streamHead) {
      changed = true;

      return {
        ...streamGroupFrame,
        data: streamGroups[streamHead],
        deleted: false,
      };
    }
    else {
      if ( ! streamGroupFrame.deleted) {
        changed = true;

        return {
          ...streamGroupFrame,
          deleted: true,
        };
      }
      else {
        return streamGroupFrame;
      }
    }
  });

  return changed ? nextStreamGroupFrames : streamGroupFrames;
}

export function addEmittedStreamFrame(emittedStreamFrames: EmittedStreamFrame[], newEmittedStreamFrame: EmittedStreamFrame): [EmittedStreamFrame[]] {
  const nextEmittedStreamFrames = [
    ...emittedStreamFrames,
    newEmittedStreamFrame,
  ];

  return [nextEmittedStreamFrames];
}

export function updateEmittedStreamFrames(emittedStreamFrames: EmittedStreamFrame[], streamGroups: StreamGroups): EmittedStreamFrame[] {
  let changed = false;

  const nextEmittedStreamFrames = emittedStreamFrames.map((emittedStreamFrame) => {
    const released = Object.getOwnPropertySymbols(streamGroups).every((streamHead) => {
      return null
        ?? (Object.getOwnPropertySymbols(streamGroups[streamHead].emitValueGroups).find((emitGroupStreamHead) => {
          return emitGroupStreamHead === emittedStreamFrame.streamHead && ! streamGroups[streamHead].emitValueGroups[emitGroupStreamHead].every(Boolean);
        }) && false)
        ?? (Object.getOwnPropertySymbols(streamGroups[streamHead].emitErrorGroups).find((emitGroupStreamHead) => {
          return emitGroupStreamHead === emittedStreamFrame.streamHead && ! streamGroups[streamHead].emitErrorGroups[emitGroupStreamHead].every(Boolean);
        }) && false)
        ?? true;
    });

    if (emittedStreamFrame.released !== released) {
      changed = true;

      return {
        ...emittedStreamFrame,
        released,
      };
    }
    else {
      return emittedStreamFrame;
    }
  });

  return changed ? nextEmittedStreamFrames : emittedStreamFrames;
}

export function selectStreamGroupFrame(uniqKey: symbol, selected: boolean, pipeFrames: PipeFrame[]): PipeFrame[] {
  return pipeFrames.map((pipeFrame) => {
    let changed = false;

    const nextStreamGroupFrames = pipeFrame.streamGroupFrames.map((streamGroupFrame) => {
      const nextSelected = streamGroupFrame.data.uniqKey === uniqKey ? selected : false;

      if (streamGroupFrame.selected !== nextSelected) {
        changed = true;

        return {
          ...streamGroupFrame,
          selected: nextSelected,
        };
      }
      else {
        return streamGroupFrame;
      }
    });

    return {
      ...pipeFrame,
      streamGroupFrames: changed ? nextStreamGroupFrames : pipeFrame.streamGroupFrames,
    };
  });
}

export function selectEmittedStreamFrame(streamHead: symbol, selected: boolean, pipeFrames: PipeFrame[]): PipeFrame[] {
  return pipeFrames.map((pipeFrame) => {
    let changed = false;

    const nextEmittedStreamFrames = pipeFrame.emittedStreamFrames.map((emittedStreamFrame) => {
      const nextSelected = emittedStreamFrame.streamHead === streamHead ? selected : false;

      if (emittedStreamFrame.selected !== nextSelected) {
        changed = true;

        return {
          ...emittedStreamFrame,
          selected: nextSelected,
        };
      }
      else {
        return emittedStreamFrame;
      }
    });

    return {
      ...pipeFrame,
      emittedStreamFrames: changed ? nextEmittedStreamFrames : pipeFrame.emittedStreamFrames,
    };
  });
}
