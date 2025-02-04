import type { PipeState } from '../entities';

export function log(displayName: string, message: string | Error, pipeState: PipeState, ...logs: (null | [string, ...any[]])[]) {
  const completeLogs = [
    ...logs,
    ['%c pipe state', 'font-weight: bold; color: #4CAF50;', pipeState] as const,
  ];
  const maxTitleLength = completeLogs.reduce((maxTitleLength, log) => Math.max(maxTitleLength, (log?.[0] ?? '').length), 0);

  const isError = message instanceof Error;
  const logColor = isError ? 'red' : 'gray';
  const logText = isError ? message.message : message;

  console.groupCollapsed(`%c ${displayName}:%c ${logText}`, 'font-weight: bold; color: inherit;', `font-weight: lighter; color: ${logColor};`);
  completeLogs.forEach((log) => {
    if (log) {
      const [title, ...restLog] = log;
      console.log(title.padEnd(maxTitleLength), ...restLog);
    }
  });
  console.groupEnd();
}
