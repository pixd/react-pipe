import { ALT_BACKGROUND_COLOR, MAIM_CLASS_NAME } from '../styles-constants';
import { css } from '../styles-tools';

export const styles = css`
  .${MAIM_CLASS_NAME}-Console {
    background-color: ${ALT_BACKGROUND_COLOR};
    border-bottom: 1px solid #454b56;
    font-family: "Source Code Pro", monospace;
  }

  .${MAIM_CLASS_NAME}-ConsoleRecords {
    height: 100%;
  }

  .${MAIM_CLASS_NAME}-ConsoleRecord:last-child {
    min-height: 100%;
  }

  .${MAIM_CLASS_NAME}-Pilot,
  .${MAIM_CLASS_NAME}-ConsoleRecord {
    display: flex;
  }

  .${MAIM_CLASS_NAME}-PilotTime,
  .${MAIM_CLASS_NAME}-Time {
    background-color: #2f3541;
    border-right: 1px solid #454b56;
    box-sizing: content-box;
    width: 7.6em;
  }

  .${MAIM_CLASS_NAME}-PilotAddress,
  .${MAIM_CLASS_NAME}-Message {}

  .${MAIM_CLASS_NAME}-ConsoleRecord + .${MAIM_CLASS_NAME}-Pilot .${MAIM_CLASS_NAME}-PilotTime,
  .${MAIM_CLASS_NAME}-ConsoleRecord + .${MAIM_CLASS_NAME}-Pilot .${MAIM_CLASS_NAME}-PilotAddress {
    padding-top: 0.6em;
  }

  .${MAIM_CLASS_NAME}-PilotTime,
  .${MAIM_CLASS_NAME}-Time {
    padding: 0.1em 0 0.1em 0.4em;
  }

  .${MAIM_CLASS_NAME}-PilotAddress,
  .${MAIM_CLASS_NAME}-Message {
    padding: 0.1em 0.4em 0.1em 0.6em;
  }

  .${MAIM_CLASS_NAME}-Pilot {}

  .${MAIM_CLASS_NAME}-PilotTime {
    color: #757c8c;
    font-weight: 300;
  }

  .${MAIM_CLASS_NAME}-PilotTime span {
    cursor: pointer;
  }

  .${MAIM_CLASS_NAME}-PilotAddress {
    color: #757c8c;
    cursor: pointer;
  }

  .${MAIM_CLASS_NAME}-ConsoleRecord {}

  .${MAIM_CLASS_NAME}-ConsoleRecord:last-child {
    min-height: 100%;
  }

  .${MAIM_CLASS_NAME}-Time {
    color: #537f7e;
  }

  .${MAIM_CLASS_NAME}-Message {
    align-items: center;
    color: #56afdb;
  }

  .${MAIM_CLASS_NAME}-MessageMarker {
    cursor: pointer;
    position: relative;
  }

  .${MAIM_CLASS_NAME}-MessageMarker:before {
    aspect-ratio: 1;
    background-color: #383d48;
    border-radius: 0.5em;
    content: " ";
    display: inline-block;
    height: 0.5em;
    left: -0.04em;
    position: absolute;
    top: 0.44em;
  }

  .${MAIM_CLASS_NAME}-Brackets {
    color: #bfc5d2;
    cursor: pointer;
    display: inline-block;
  }

  .${MAIM_CLASS_NAME}-Brackets-Dead {
    cursor: initial;
  }

  .${MAIM_CLASS_NAME}-Brackets span {
    color: #907f31;
    font-size: 0.7em;
    font-weight: 600;
  }

  .${MAIM_CLASS_NAME}-LogData {
    color: #757c8c;
    margin-top: 0.2em;
  }

  .${MAIM_CLASS_NAME}-LogDataLine {
    display: flex;
  }

  .${MAIM_CLASS_NAME}-LogDataKey {}

  .${MAIM_CLASS_NAME}-LogValue {}

  .${MAIM_CLASS_NAME}-LogValue-Complex,
  .${MAIM_CLASS_NAME}-LogValue-Symbol {
    color: #56afdb;
    font-style: italic;
  }

  .${MAIM_CLASS_NAME}-LogValue-Undefined,
  .${MAIM_CLASS_NAME}-LogValue-Null,
  .${MAIM_CLASS_NAME}-LogValue-Boolean {
    color: #db8181;
  }

  .${MAIM_CLASS_NAME}-LogValue-Number,
  .${MAIM_CLASS_NAME}-LogValue-Bigint {
    color: #daaa40;
  }

  .${MAIM_CLASS_NAME}-LogValue-String {
    color: #34c46d;
  }
`;
