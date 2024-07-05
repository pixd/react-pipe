import { ALT_BACKGROUND_COLOR, MAIM_CLASS_NAME } from '../styles-constants';
import { css } from '../styles-tools';

export const styles = css`
  .${MAIM_CLASS_NAME}-Console {
    background-color: ${ALT_BACKGROUND_COLOR};
    border-bottom: 1px solid #454b56;
    font-family: "Source Code Pro", monospace;
  }

  .${MAIM_CLASS_NAME}-ConsoleRecords {}

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
    display: flex;
    justify-content: end;
    padding: 0.1em 0.3em 0.1em 0.4em;
    width: 8.2em;
  }

  .${MAIM_CLASS_NAME}-PilotMessage,
  .${MAIM_CLASS_NAME}-Message {
    padding: 0.1em 0.4em 0.1em 1.4em;
    position: relative;
  }

  .${MAIM_CLASS_NAME}-ConsoleRecord + .${MAIM_CLASS_NAME}-Pilot .${MAIM_CLASS_NAME}-PilotTime,
  .${MAIM_CLASS_NAME}-ConsoleRecord + .${MAIM_CLASS_NAME}-Pilot .${MAIM_CLASS_NAME}-PilotMessage {
    padding-top: 0.6em;
  }

  .${MAIM_CLASS_NAME}-Pilot {}

  .${MAIM_CLASS_NAME}-PilotTime {
    color: #757c8c;
  }

  .${MAIM_CLASS_NAME}-PilotMessage {
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

  .${MAIM_CLASS_NAME}-Time > span:last-child {
    cursor: pointer;
  }

  .${MAIM_CLASS_NAME}-TimeIcon {
    display: none;
    margin-right: 0.28em;
  }

  .${MAIM_CLASS_NAME}-TimeIcon svg {
    display: block;
    height: 0.64lh;
  }

  .${MAIM_CLASS_NAME}-Message {
    align-items: center;
    color: #56afdb;
  }

  .${MAIM_CLASS_NAME}-LogMarker {
    left: 0.5em;
    position: absolute;
  }

  .${MAIM_CLASS_NAME}-LogMarker:before {
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

  .${MAIM_CLASS_NAME}-LogMarker-Selected:before {
    background-color: #cfe142;
  }

  .${MAIM_CLASS_NAME}-LogName {
    cursor: pointer;
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

  .${MAIM_CLASS_NAME}-Comma {
    opacity: 0;
  }
`;
