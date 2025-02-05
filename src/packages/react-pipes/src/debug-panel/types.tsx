import type { DataBarrel } from '@@es-pipes/core';
import type { DataType } from '@@es-pipes/core';
import type { PipeState } from '@@es-pipes/core';
import type { StreamGroup } from '@@es-pipes/core';
import type { Debugger } from '@@es-pipes/debug';

export type PanelState = {
  debugRecords: DebugRecord[];
  pipeFrames: PipeFrame[];
  maxPipeLineIndex: number;
  maxDataLevel: number;
  maxErrorLevel: number;
  selectedPipe: null | [symbol, symbol];
  selectedStreamGroup: null | [symbol, symbol];
  selectedDataBarrel: null | [symbol, symbol];
  selectedTimeTravelPointIndex: null | number;
};

export type TimeTravelPanelState = {
  pipeFrames: PipeFrame[];
  maxPipeLineIndex: number;
  maxDataLevel: number;
  maxErrorLevel: number;
};

export type PipeFrame = {
  pipeState: PipeState;
  streamGroupFrames: StreamGroupFrame[];
  dataBarrelFrames: DataBarrelFrame[];
  streamConnections: StreamConnection[];
  streamEntries: StreamEntry[];
  maxDataLevel: number;
  maxDataConnectionLevel: number;
  maxErrorLevel: number;
  maxErrorConnectionLevel: number;
  maxDataEntryLevel: number;
  maxErrorEntryLevel: number;
};

export type StreamGroupFrame = {
  streamGroup: StreamGroup;
  deleted: boolean;
};

export type StreamConnection = {
  type: DataType;
  directionType: StreamConnectionDirectionType;
  lineGlobalIndex: number;
  level: number;
  source: symbol;
  destination: symbol;
};

export type StreamEntry = {
  type: DataType;
  lineGlobalIndex: number;
  level: number;
  entryLevel: number;
};

export type StreamConnectionDirectionType = 'pass-through' | 'connection';

export type DataBarrelFrame = {
  dataBarrel: DataBarrel;
  deleted: boolean;
};

export type DebugRecord = {
  time: string;
  rawTime: number;
  selected: boolean;
  pilot?: null | string;
  pilotSelected?: null | boolean;
  debugEvent: DebugEvent;
  timeTravelPanelState: TimeTravelPanelState;
  syncIdleTime?: string;
};

export type DebugEvent = {
  [TKey in keyof Debugger]: {
    eventTargetType: EventTargetType;
    eventTargetKey: [symbol, symbol];
    message: string;
    data: Parameters<Debugger[TKey]>[0] extends string ? Parameters<Debugger[TKey]>[1] : { error: Error, pipeState: PipeState };
    error?: boolean;
  };
}[keyof Debugger];

export type EventTargetType = 'pipe' | 'streamGroup' | 'dataBarrel';
