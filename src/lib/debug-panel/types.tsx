import { Debugger, PipeState, StreamGroup } from '../types';

export type PanelState = {
  debugRecords: DebugRecord[];
  pipeFrames: PipeFrame[];
  maxPipeLineIndex: number;
  maxDataLevel: number;
  maxErrorLevel: number;
  selectedPipe: null | [symbol, symbol];
  selectedStreamGroup: null | [symbol, symbol];
  selectedEmittedData: null | [symbol, symbol];
  selectedDebugRecord: null | number;
};

export type PipeFrame = {
  pipeState: PipeState;
  streamConnections: StreamConnection[];
  streamEntries: StreamEntry[];
  maxDataLevel: number;
  maxDataConnectionLevel: number;
  maxErrorLevel: number;
  maxErrorConnectionLevel: number;
  maxDataEntryLevel: number;
  maxErrorEntryLevel: number;
  streamGroupFrames: StreamGroupFrame[];
  emittedDataFrames: EmittedDataFrame[];
};

export type StreamGroupFrame = {
  data: StreamGroup;
  deleted: boolean;
};

export type StreamConnection = {
  type: StreamLineType;
  directionType: StreamConnectionDirectionType;
  lineGlobalIndex: number;
  level: number;
  source: symbol;
  destination: symbol;
};

export type StreamEntry = {
  type: StreamLineType;
  lineGlobalIndex: number;
  level: number;
  entryLevel: number;
};

export type StreamLineType = 'data' | 'error';

export type StreamConnectionDirectionType = 'pass-through' | 'connection';

export type EmittedDataFrame = {
  papa: symbol;
  data: any;
  dataType: EmittedDataType;
  released: boolean;
};

export type EmittedDataType = 'data' | 'error';

export type DebugRecord = {
  time: string;
  rawTime: number;
  selected: boolean;
  pilot?: null | string;
  pilotSelected?: null | boolean;
  debugEvent: DebugEvent;
  timeTravelPanelState: PanelState;
  syncIdleTime?: string;
};

export type DebugEvent = {
  [TKey in keyof Debugger]: {
    eventTargetType: EventTargetType;
    eventTargetKey: [symbol, symbol];
    message: string;
    data: Parameters<Debugger[TKey]>[1];
  };
}[keyof Debugger];

export type EventTargetType = 'pipe' | 'streamGroup' | 'stream';
