// noinspection TypeScriptValidateTypes

import React, { useEffect, useRef, useState } from 'react';

import { LINE_SPACE, OUT_GAP } from '../styles-constants';
import { PipeFrame } from '../types';
import { Pipe } from './Pipe';

type ScrollMarker = {
  top: number;
};

export type SchemaProps = {
  pipeFrames: PipeFrame[];
  maxDataLevel: number;
  maxErrorLevel: number;
  selectedPipe: null | [symbol, symbol];
  selectedStreamGroup: null | [symbol, symbol];
  selectedEmittedStream: null | [symbol, symbol];
  onPipeSelection: (uniqKey: symbol) => void;
  onStreamGroupSelection: (uniqKey: [symbol, symbol]) => void;
  onEmittedStreamSelection: (uniqKey: [symbol, symbol]) => void;
};

export const Schema = React.memo(function Schema(props: SchemaProps) {
  const { pipeFrames, maxDataLevel, maxErrorLevel, selectedPipe, selectedStreamGroup,
    selectedEmittedStream, onPipeSelection, onStreamGroupSelection, onEmittedStreamSelection,
  } = props;

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [[realThumbHeight, scrollMarkers], setScrollMarkersState] = useState<[string, ScrollMarker[]]>(['0px', []]);

  // Задается стилями - смотрите величину и единицу измерения в ваших стилях
  const scrollThumbMinHeight = '1em';
  const scrollShift = `max(0px, ${scrollThumbMinHeight} / 2 - ${realThumbHeight} / 2)`;
  const markerPanelStyle = { top: scrollShift, bottom: scrollShift };

  useEffect(() => {
    const root = rootRef.current!;

    const observer = new ResizeObserver(() => {
      setScrollMarkersState(state => [...state]);
    });

    observer.observe(root);
    return () => observer.unobserve(root);
  }, []);

  useEffect(() => {
    const { realThumbHeight, scrollMarkers } = getScrollMarkers(rootRef.current!, listRef.current!);
    setScrollMarkersState([realThumbHeight, scrollMarkers]);
  }, [pipeFrames, selectedPipe, selectedStreamGroup, selectedEmittedStream, rootRef.current?.clientHeight, listRef.current?.scrollHeight]);

  const style = {
    paddingLeft: `${maxDataLevel * LINE_SPACE + OUT_GAP}em`,
    paddingRight: `${maxErrorLevel * LINE_SPACE + OUT_GAP}em`,
  };

  return (
    <div ref={rootRef} className="ReactPipeDebugPanel-Schema">
      <div className="ReactPipeDebugPanel-ScrollMarkerPanel" style={markerPanelStyle}>
        {scrollMarkers.map((marker, index) => {
          const style = { top: marker.top + '%' };
          return (
            <div key={index} className="ReactPipeDebugPanel-ScrollMarker ReactPipeDebugPanel-ScrollMarker--Log" style={style} />
          );
        })}
      </div>
      <div ref={listRef} className="ReactPipeDebugPanel-SchemaPipes" style={style}>
        {pipeFrames.map((pipe, index) => {
          const selected = !! selectedPipe && pipe.pipeState.dataPipe.uniqKey === selectedPipe[1];
          const pipeSelectedStreamGroup = selectedStreamGroup && selectedStreamGroup[0] === pipe.pipeState.dataPipe.uniqKey
            ? selectedStreamGroup[1]
            : null;
          const pipeSelectedEmittedStream = selectedEmittedStream && selectedEmittedStream[0] === pipe.pipeState.dataPipe.uniqKey
            ? selectedEmittedStream[1]
            : null;

          return (
            <Pipe key={index}
              pipeFrame={pipe}
              selected={selected}
              selectedStreamGroup={pipeSelectedStreamGroup}
              selectedEmittedStream={pipeSelectedEmittedStream}
              onPipeSelection={onPipeSelection}
              onStreamGroupSelection={onStreamGroupSelection}
              onEmittedStreamSelection={onEmittedStreamSelection} />
          );
        })}
      </div>
    </div>
  );
});

function getScrollMarkers(rootElement: HTMLElement, listElement: HTMLElement) {
  const consoleHeight = rootElement.clientHeight;
  const listHeight = listElement.scrollHeight;
  const listTop = listElement.getBoundingClientRect().top - listElement.scrollTop;

  const realThumbHeight = Math.round((consoleHeight * consoleHeight / listHeight)) + 'px';

  const scrollMarkers: ScrollMarker[] = [];
  [
    ...Array.from(rootElement.querySelectorAll('.ReactPipeDebugPanel-Pipe-Selected .ReactPipeDebugPanel-PipeBody')),
    ...Array.from(rootElement.querySelectorAll('.ReactPipeDebugPanel-StreamGroup-Selected')),
  ]
    .forEach((element) => {
      const elementTop = element.getBoundingClientRect().top;
      const elementHeight = element.clientHeight;
      const top = Math.round((elementTop + elementHeight / 2 - listTop) / listHeight * 100);
      scrollMarkers.push({ top });
    });

  return { realThumbHeight, scrollMarkers };
}
