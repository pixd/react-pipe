import { MAIM_CLASS_NAME, SCROLL_WIDTH } from '../styles-constants';
import { css, round } from '../styles-tools';

export const styles = css`
  .${MAIM_CLASS_NAME} {
    border: 1px solid #454b56;
    box-sizing: border-box;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .${MAIM_CLASS_NAME} *,
  .${MAIM_CLASS_NAME} *:before,
  .${MAIM_CLASS_NAME} *:after {
    box-sizing: border-box;
  }

  .${MAIM_CLASS_NAME}-Inner {
    height: 100%;
    width: 52em;
  }

  .${MAIM_CLASS_NAME}-Schema {
    height: 65%;
    position: relative;
  }

  .${MAIM_CLASS_NAME}-Console {
    height: 35%;
    position: relative;
  }

  .${MAIM_CLASS_NAME}-SchemaPipes {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .${MAIM_CLASS_NAME}-ConsoleRecords {}

  .${MAIM_CLASS_NAME}-SchemaPipes,
  .${MAIM_CLASS_NAME}-ConsoleRecords {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .${MAIM_CLASS_NAME}-SchemaPipes::-webkit-scrollbar,
  .${MAIM_CLASS_NAME}-ConsoleRecords::-webkit-scrollbar {
    width: ${SCROLL_WIDTH}em;
    height: ${SCROLL_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-SchemaPipes::-webkit-scrollbar-track,
  .${MAIM_CLASS_NAME}-ConsoleRecords::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .${MAIM_CLASS_NAME}-SchemaPipes::-webkit-scrollbar-thumb,
  .${MAIM_CLASS_NAME}-ConsoleRecords::-webkit-scrollbar-thumb {
    background-color: #1c2129;
    border-radius: ${round(SCROLL_WIDTH / 2)}em;
  }

  .${MAIM_CLASS_NAME}-SchemaPipes::-webkit-scrollbar-corner,
  .${MAIM_CLASS_NAME}-ConsoleRecords::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  .${MAIM_CLASS_NAME}-FakeSpace {
    height: 0;
  }

  .${MAIM_CLASS_NAME}-ScrollMarkerPanel {
    position: absolute;
    right: 0;
  }

  .${MAIM_CLASS_NAME}-ScrollMarker {
    position: absolute;
    right: 1px;
    width: calc(${SCROLL_WIDTH}em - 2px);
  }

  .${MAIM_CLASS_NAME}-ScrollMarker--Time {
    box-shadow: 0 0 0 1px #e18e42;
  }

  .${MAIM_CLASS_NAME}-ScrollMarker--Log {
    box-shadow: 0 0 0 1px #cfe142;
  }
`;
