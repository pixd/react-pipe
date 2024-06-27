import { Debugger, PipeState, StreamGroup } from '../types';

export type PanelState = {
  debugRecords: DebugRecord[];
  pipeFrames: PipeFrame[];
  maxPipeLineIndex: number;
  maxDataLevel: number;
  maxErrorLevel: number;
  selectedPipe: null | symbol;
};

export type PipeFrame = {
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
  emittedStreamFrames: EmittedStreamFrame[];
  selected: boolean;
};

export type StreamGroupFrame = {
  data: StreamGroup;
  deleted: boolean;
  selected: boolean;
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

export type EmittedStreamFrame = {
  streamHead: symbol;
  value: any;
  valueType: StreamValueType;
  released: boolean;
  selected: boolean;
};

export type StreamValueType = 'data' | 'error';

export type DebugEvent = {
  [TKey in keyof Debugger]: {
    name: TKey;
    data: Parameters<Debugger[TKey]>[0];
  };
}[keyof Debugger];

export type DebugRecord = {
  pilot?: null | string;
  time: string;
  debugEvent: DebugEvent;
};
