import { memo } from 'react';

import { dataType } from '@@es-pipes/core';

import { IN_END_GAP } from '../styles-constants';
import { HEEL_LENGTH } from '../styles-constants';
import { HEEL_SHIFT } from '../styles-constants';
import { HOLE_LENGTH } from '../styles-constants';
import { IN_GAP } from '../styles-constants';
import { IN_SHIFT } from '../styles-constants';
import { IN_TAP_LENGTH } from '../styles-constants';
import { LINE_SPACE } from '../styles-constants';
import { LINE_WIDTH } from '../styles-constants';
import { OUT_GAP } from '../styles-constants';
import { OUT_SHIFT } from '../styles-constants';
import { round } from '../styles-tools';
import type { StreamConnection } from '../types';
import type { StreamEntry } from '../types';

export type ConnectionsProps = {
  maxDataEntryLevel: number;
  maxErrorEntryLevel: number;
  maxDataConnectionLevel: number;
  maxErrorConnectionLevel: number;
  streamConnections: StreamConnection[];
  streamEntries: StreamEntry[];
};

export const Connections = memo(function Connections(props: ConnectionsProps) {
  const { maxDataEntryLevel, maxErrorEntryLevel, maxDataConnectionLevel, maxErrorConnectionLevel,
    streamConnections, streamEntries } = props;

  const maxEntryLevel = Math.max(maxDataEntryLevel, maxErrorEntryLevel);

  const baseOutDataWidth = round((maxDataConnectionLevel - 1) * LINE_SPACE + OUT_GAP);
  const baseOutErrorWidth = round((maxErrorConnectionLevel - 1) * LINE_SPACE + OUT_GAP);

  return (
    <div className="ReactPipeDebugPanel-Connections">
      {maxDataConnectionLevel
        ? (
          <div className="ReactPipeDebugPanel-DataOut" style={{ left: `-${baseOutDataWidth}em`, width: `${baseOutDataWidth}em` }}>
            <div />
            <i />
          </div>
        )
        :  null}
      {maxErrorConnectionLevel
        ? (
          <div className="ReactPipeDebugPanel-ErrorOut" style={{ right: `-${baseOutErrorWidth}em`, width: `${baseOutErrorWidth}em` }}>
            <div />
            <i />
          </div>
        )
        :  null}
      {streamConnections.map((connection, index) => {
        const ConnectionTypeClassName = connection.type === dataType.error ? 'ReactPipeDebugPanel-ErrorConnection' : 'ReactPipeDebugPanel-DataConnection';
        const horizontalProp = connection.type === dataType.error ? 'right' : 'left';

        if (connection.directionType === 'connection') {
          const maxConnectionLevelProp = connection.type === dataType.error ? maxErrorConnectionLevel : maxDataConnectionLevel;
          const TConnectionClassName = maxConnectionLevelProp === connection.level ? 'ReactPipeDebugPanel-LConnection' : 'ReactPipeDebugPanel-TConnection';

          const className = [
            'ReactPipeDebugPanel-Connection',
            ConnectionTypeClassName,
            TConnectionClassName,
          ].filter(Boolean).join(' ');

          const style = {
            [horizontalProp]: `-${round((connection.level - 1) * LINE_SPACE + OUT_GAP + LINE_WIDTH + HEEL_SHIFT)}em`,
          };

          return (
            <div key={index} className={className} style={style} />
          );
        }
        else {
          const className = [
            'ReactPipeDebugPanel-PathThrough',
            ConnectionTypeClassName,
          ].filter(Boolean).join(' ');

          const style = {
            height: `calc(100% + ${round((maxEntryLevel - 1) * LINE_SPACE + IN_GAP + IN_END_GAP)}em)`,
            [horizontalProp]: `-${round((connection.level - 1) * LINE_SPACE + OUT_GAP + LINE_WIDTH)}em`,
          };

          return (
            <div key={index} className={className} style={style}>
              <div style={{ zIndex: `-${connection.lineGlobalIndex + 2}` }} />
              <span />
            </div>
          );
        }
      })}
      {streamEntries.map((streamEntry, index) => {
        const className = streamEntry.type === dataType.error
          ? 'ReactPipeDebugPanel-ErrorEntry'
          : 'ReactPipeDebugPanel-DataEntry'

        const leftShift = round(index * LINE_SPACE + IN_SHIFT - LINE_WIDTH);
        const extraWidth = round((streamEntry.level - 1) * LINE_SPACE + OUT_GAP);
        const inHeight = round((streamEntry.entryLevel - 1) * LINE_SPACE + IN_GAP);
        const outHeight = round((maxEntryLevel - streamEntry.entryLevel) * LINE_SPACE + IN_END_GAP - LINE_WIDTH + OUT_SHIFT);
        const zIndex = `-${streamEntry.lineGlobalIndex + 2}`;

        const inStyle = {
          height: `${round(inHeight + IN_TAP_LENGTH)}em`,
          left: `${leftShift}em`,
          top: `-${inHeight}em`,
          zIndex,
        };

        const centerStyle = {
          left: streamEntry.type === dataType.error
            ? `${round(leftShift + LINE_WIDTH)}em`
            : `-${extraWidth}em`,
          top: `-${round(inHeight + LINE_WIDTH)}em`,
          width: streamEntry.type === dataType.error
            ? `calc(100% - ${round(leftShift + LINE_WIDTH - extraWidth)}em)`
            : `${round(extraWidth + leftShift)}em`,
          zIndex,
        };

        const outStyle = {
          height: `${outHeight}em`,
          left: streamEntry.type === dataType.error
            ? `calc(100% + ${extraWidth}em)`
            : `-${round(extraWidth + LINE_WIDTH)}em`,
          top: `-${round(inHeight + LINE_WIDTH + outHeight)}em`,
          zIndex,
        };

        const holeStyle = {
          left: `${leftShift - (HOLE_LENGTH - LINE_WIDTH) / 2}em`,
        };

        const inHeelStyle = {
          top: `-${round(inHeight + LINE_WIDTH + HEEL_SHIFT)}em`,
          left: streamEntry.type === dataType.error
            ? `${round(leftShift - HEEL_SHIFT)}em`
            : `${round(leftShift + LINE_WIDTH - HEEL_LENGTH + HEEL_SHIFT)}em`,
        };

        const outHeelStyle = {
          top: `-${round(inHeight + HEEL_LENGTH - HEEL_SHIFT)}em`,
          left: streamEntry.type === dataType.error
            ? `calc(100% + ${extraWidth - HEEL_LENGTH + LINE_WIDTH + HEEL_SHIFT}em)`
            : `-${round(extraWidth + LINE_WIDTH + HEEL_SHIFT)}em`,
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
  );
});
