import { memo } from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import { useState } from 'react';

import { MAIM_CLASS_NAME } from '../styles-constants';
import type { DebugRecord } from '../types';
import type { EventTargetType } from '../types';
import { ConsoleRecord } from './ConsoleRecord';

type ScrollMarker = {
  top: number;
  type: 'error' | 'log' | 'time';
};

export type ConsoleProps = {
  records: DebugRecord[];
  selectedRecord: null | number;
  onEventSelect: (eventTargetType: EventTargetType, eventTargetKey: [symbol, symbol]) => void;
  onDebugRecordSelect: (index: number) => void;
};

export const Console = memo(function Console(props: ConsoleProps) {
  const { records, selectedRecord, onEventSelect, onDebugRecordSelect } = props;

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
      setScrollMarkersState((state) => [...state]);
    });

    observer.observe(root);
    return () => observer.unobserve(root);
  }, []);

  useEffect(() => {
    const { realThumbHeight, scrollMarkers } = getScrollMarkers(rootRef.current!, listRef.current!);
    setScrollMarkersState([realThumbHeight, scrollMarkers]);
  }, [records, selectedRecord, rootRef.current?.clientHeight, listRef.current?.scrollHeight]);

  return (
    <div ref={rootRef} className="ReactPipeDebugPanel-Console">
      <div className="ReactPipeDebugPanel-ScrollMarkerPanel" style={markerPanelStyle}>
        {scrollMarkers.map((marker, index) => {
          const style = { top: marker.top + '%' };
          const className = [
            'ReactPipeDebugPanel-ScrollMarker',
            marker.type === 'time' ? 'ReactPipeDebugPanel-ScrollMarker--Time' : null,
            marker.type === 'log' ? 'ReactPipeDebugPanel-ScrollMarker--Log' : null,
            marker.type === 'error' ? 'ReactPipeDebugPanel-ScrollMarker--Error' : null,
          ].filter(Boolean).join(' ');

          return (
            <div key={index} className={className} style={style} />
          );
        })}
      </div>
      <div ref={listRef} className="ReactPipeDebugPanel-ConsoleRecords">
        {records.length
          ? records.map((record, index) => {
            const active = selectedRecord == null || index <= selectedRecord;
            const selected = index === selectedRecord;

            return (
              <ConsoleRecord key={index}
                record={record}
                recordIndex={index}
                active={active}
                selected={selected}
                onEventSelect={onEventSelect}
                onDebugRecordSelect={onDebugRecordSelect} />
            );
          })
          : (
            <div className="ReactPipeDebugPanel-ConsoleRecord">
              <div className="ReactPipeDebugPanel-Time" />
              <div className="ReactPipeDebugPanel-Message" />
            </div>
          )}
      </div>
    </div>
  );
});

function getScrollMarkers(rootElement: HTMLElement, listElement: HTMLElement) {
  const consoleHeight = rootElement.clientHeight;
  const listHeight = listElement.scrollHeight;
  const listTop = listElement.getBoundingClientRect().top - listElement.scrollTop;

  const realThumbHeight = Math.round((consoleHeight * consoleHeight / listHeight)) + 'px';

  const findScrollMarker = (type: ScrollMarker['type'], selector: string): ScrollMarker[] => {
    return Array.from(rootElement.querySelectorAll(selector))
      .map((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const top = Math.round((elementTop - listTop) / listHeight * 100);
        return { top, type };
      });
  }

  const scrollMarkers: ScrollMarker[] = [
    ...findScrollMarker('error', `.${MAIM_CLASS_NAME}-ConsoleRecord-Error`),
    ...findScrollMarker('log', `.${MAIM_CLASS_NAME}-LogMarker-Selected`),
    ...findScrollMarker('time', `.${MAIM_CLASS_NAME}-ConsoleRecord-Selected .${MAIM_CLASS_NAME}-Time`),
  ];

  return { realThumbHeight, scrollMarkers };
}
