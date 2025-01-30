import { memo } from 'react';
import { useState } from 'react';

import type { DebugRecord } from '../types';
import type { EventTargetType } from '../types';

export enum ComplexData {
  FUNCTION = '[[FUNCTION]]',
  HTML_ELEMENT = '[[HTMLElement]]'
}

const complexDataValues = Object.values(ComplexData);

export type ConsoleRecordProps = {
  record: DebugRecord;
  recordIndex: number;
  active: boolean;
  selected: boolean;
  onEventSelect: (eventTargetType: EventTargetType, eventTargetKey: [symbol, symbol]) => void;
  onDebugRecordSelect: (index: number) => void;
};

export const ConsoleRecord = memo(function ConsoleRecord(props: ConsoleRecordProps) {
  const { record, recordIndex, active, selected, onEventSelect, onDebugRecordSelect } = props;

  const [open, setOpen] = useState<boolean>(false);

  const handleToggle = () => setOpen((open) => ! open);

  const handleEventSelect = () => onEventSelect(record.debugEvent.eventTargetType, record.debugEvent.eventTargetKey);

  const handlePipeSelect = () => onEventSelect('pipe', [record.debugEvent.data.pipeState.dataPipe.uniqKey, record.debugEvent.data.pipeState.dataPipe.uniqKey]);

  const handleDebugRecordSelect = () => onDebugRecordSelect(recordIndex);

  const pilotClassName = [
    'ReactPipeDebugPanel-Pilot',
    active ? null : 'ReactPipeDebugPanel-Pilot-Inactive',
  ].filter(Boolean).join(' ');

  const pilotMarkerClassName = [
    'ReactPipeDebugPanel-LogMarker',
    record.pilotSelected ? 'ReactPipeDebugPanel-LogMarker-Selected' : null,
  ].filter(Boolean).join(' ');

  const recordClassName = [
    'ReactPipeDebugPanel-ConsoleRecord',
    active ? null : 'ReactPipeDebugPanel-ConsoleRecord-Inactive',
    selected ? 'ReactPipeDebugPanel-ConsoleRecord-Selected': null,
  ].filter(Boolean).join(' ');

  const eventMarkerClassName = [
    'ReactPipeDebugPanel-LogMarker',
    record.selected ? 'ReactPipeDebugPanel-LogMarker-Selected' : null,
  ].filter(Boolean).join(' ');

  return (
    <>
      {record.pilot
        ? (
          <div className={pilotClassName}>
            <div className="ReactPipeDebugPanel-PilotTime">
              <span
                onClick={handlePipeSelect}
              >
                Pipe
              </span>
            </div>
            <div className="ReactPipeDebugPanel-PilotMessage">
              <span className={pilotMarkerClassName} />
              <span className="ReactPipeDebugPanel-LogName"
                onClick={handlePipeSelect}
              >
                {record.pilot}
              </span>
            </div>
          </div>
        )
        : null}
      <div className={recordClassName}>
        <div className="ReactPipeDebugPanel-Time">
          <span
            onClick={handleDebugRecordSelect}
          >
            {record.time}
          </span>
          {record.syncIdleTime
            ? (
              <i>~ {record.syncIdleTime} ~</i>
            )
            : null}
        </div>
        <div className="ReactPipeDebugPanel-Message">
          <div>
            <span className={eventMarkerClassName} />
            <span className="ReactPipeDebugPanel-LogName"
              onClick={handleEventSelect}
            >
              {record.debugEvent.message}
            </span>
            {' '}
            {objectKeys(record.debugEvent.data).length > 0
              ? open
                ? (
                  <span className="ReactPipeDebugPanel-Brackets"
                    onClick={handleToggle}
                  >
                    {'{'}&nbsp;
                  </span>
                )
                : (
                  <span className="ReactPipeDebugPanel-Brackets"
                    onClick={handleToggle}
                  >
                    {'{'}<span>..</span>{'}'}
                  </span>
                )
              : (
                (
                  <span className="ReactPipeDebugPanel-Brackets ReactPipeDebugPanel-Brackets-Dead">
                    {'{}'}
                  </span>
                )
              )}
          </div>
          {open
            ? (
              <>
                <div className="ReactPipeDebugPanel-LogDataLine">
                  <ObjectData
                    data={record.debugEvent.data} />
                </div>
                <div>
                  <span className="ReactPipeDebugPanel-Brackets"
                    onClick={handleToggle}
                  >
                    {'}'}&nbsp;
                  </span>
                </div>
              </>
            )
            : null}
        </div>
      </div>
    </>
  );
});

type ObjectDataProps = {
  data: Record<symbol | string, any>;
};

function ObjectData(props: ObjectDataProps) {
  const { data } = props;

  return (
    <div className="ReactPipeDebugPanel-LogData">
      {objectKeys(data).map((key, index) => {
        const accurateKey = typeof key === 'symbol' ? index : key;

        return (
          <DataLine key={accurateKey}
            name={key}
            data={data[key]} />
        );
      })}
    </div>
  );
}

type DataLineProps = {
  name: symbol | string;
  data: any;
};

function DataLine(props: DataLineProps) {
  const { name, data } = props;

  const [open, setOpen] = useState<boolean>(false);

  const handleToggle = () => setOpen((open) => ! open);

  const [leftBrace, rightBrace] = Array.isArray(data) ? ['[', ']'] : ['{', '}'];

  return (
    <div className="ReactPipeDebugPanel-LogDataLine">
      <div>
        &nbsp;&nbsp;
      </div>
      <div>
        <div className="ReactPipeDebugPanel-LogDataKey">
          {typeof name === 'symbol' ? `[${String(name)}]` : name}:{' '}
          {data && typeof data === 'object'
            ? objectKeys(data).length > 0
              ? open
                ? (
                  <span className="ReactPipeDebugPanel-Brackets"
                    onClick={handleToggle}
                  >
                    {leftBrace}&nbsp;
                  </span>
                )
                : (
                  <>
                    <span className="ReactPipeDebugPanel-Brackets"
                      onClick={handleToggle}
                    >
                      {leftBrace}<span>..</span>{rightBrace}
                    </span>
                    <span className="ReactPipeDebugPanel-Comma">,</span>
                  </>
                )
              : (
                <>
                  <span className="ReactPipeDebugPanel-Brackets ReactPipeDebugPanel-Brackets-Dead">
                    {leftBrace}{rightBrace}
                  </span>
                  <span className="ReactPipeDebugPanel-Comma">,</span>
                </>
              )
            : (
              <>
                <ScalarData
                  data={data} />
                <span className="ReactPipeDebugPanel-Comma">,</span>
              </>
            )}
        </div>
        {data && typeof data === 'object' && open
          ? (
            <>
              <ObjectData
                data={data} />
              <div>
                <span className="ReactPipeDebugPanel-Brackets"
                  onClick={handleToggle}
                >
                  {rightBrace}
                </span>
                <span className="ReactPipeDebugPanel-Comma">,</span>
              </div>
            </>
          )
          : null}
      </div>
    </div>
  );
}

type ScalarDataProps = {
  data: any;
};

function ScalarData(props: ScalarDataProps) {
  const { data } = props;

  if (complexDataValues.includes(data)) {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Complex">
        {data}
      </span>
    );
  }
  else if (data === undefined) {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Undefined">
        undefined
      </span>
    );
  }
  else if (data === null) {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Null">
        null
      </span>
    );
  }
  else if (typeof data === 'symbol') {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Symbol">
        {String(data)}
      </span>
    );
  }
  else if (typeof data === 'boolean') {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Boolean">
        {String(data)}
      </span>
    );
  }
  else if (typeof data === 'number') {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Number">
        {data}
      </span>
    );
  }
  else if (typeof data === 'bigint') {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Bigint">
        {String(data)}
      </span>
    );
  }
  else if (typeof data === 'string') {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-String">
        "{data}"
      </span>
    );
  }
  else {
    return (
      <span className="ReactPipeDebugPanel-LogValue ReactPipeDebugPanel-LogValue-Complex">
        {String(data)}
      </span>
    );
  }
}

function objectKeys(data: object): (symbol | string)[] {
  const keys = [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)];
  return Array.isArray(data) ? keys.filter((key) => key !== 'length') : keys;
}
