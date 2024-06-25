import React, { useState } from 'react';

import { DebugRecord } from '../types';

export enum ComplexData {
  FUNCTION = '[[FUNCTION]]',
  HTML_ELEMENT = '[[HTMLElement]]'
}

const complexDataValues = Object.values(ComplexData);

export type ConsoleRecordProps = {
  record: DebugRecord;
};

export const ConsoleRecord = React.memo(function ConsoleRecord(props: ConsoleRecordProps) {
  const { record } = props;

  const [open, setOpen] = useState<boolean>(false);

  const handleToggle = () => setOpen((open) => ! open);

  return (
    <>
      {record.pilot
        ? (
          <div className="ReactPipeDebugPanel-Pilot">
            <div className="ReactPipeDebugPanel-PilotTime">
              <span>
                ###
              </span>
            </div>
            <div className="ReactPipeDebugPanel-PilotAddress">
              {record.pilot}
            </div>
          </div>
        )
        : null}
      <div className="ReactPipeDebugPanel-ConsoleRecord">
        <div className="ReactPipeDebugPanel-Time">
          {record.time}
        </div>
        <div className="ReactPipeDebugPanel-Message">
          <div>
            <span className="ReactPipeDebugPanel-MessageMarker">
              &nbsp;&nbsp;
            </span>
            {record.debugEvent.name}
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
                  <span className="ReactPipeDebugPanel-Brackets"
                    onClick={handleToggle}
                  >
                    {leftBrace}<span>..</span>{rightBrace}
                  </span>
                )
              : (
                <span className="ReactPipeDebugPanel-Brackets ReactPipeDebugPanel-Brackets-Dead">
                  {leftBrace}{rightBrace}
                </span>
              )
            : (
              <ScalarData
                data={data} />
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
                  {rightBrace}&nbsp;
                </span>
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
  return [
    ...Object.getOwnPropertyNames(data),
    ...Object.getOwnPropertySymbols(data),
  ];
}
