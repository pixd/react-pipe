import { MAIM_CLASS_NAME } from '../styles-constants';
import { css } from '../styles-tools';

export const styles = css`
  .${MAIM_CLASS_NAME} {
    border: 1px solid #454b56;
    box-sizing: border-box;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .${MAIM_CLASS_NAME} * {
    box-sizing: border-box;
  }

  .${MAIM_CLASS_NAME}-Inner {
    height: 100%;
  }

  .${MAIM_CLASS_NAME}-Schema,
  .${MAIM_CLASS_NAME}-Console {
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .${MAIM_CLASS_NAME}-Schema {
    height: 65%;
  }

  .${MAIM_CLASS_NAME}-Console {
    height: 35%;
  }

  .${MAIM_CLASS_NAME}-Schema::-webkit-scrollbar,
  .${MAIM_CLASS_NAME}-Console::-webkit-scrollbar {
    width: 0.5em;
    height: 0.5em;
  }

  .${MAIM_CLASS_NAME}-Schema::-webkit-scrollbar-track,
  .${MAIM_CLASS_NAME}-Console::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .${MAIM_CLASS_NAME}-Schema::-webkit-scrollbar-thumb,
  .${MAIM_CLASS_NAME}-Console::-webkit-scrollbar-thumb {
    background-color: #1c2129;
    border-radius: 0.25em;
  }

  .${MAIM_CLASS_NAME}-Schema::-webkit-scrollbar-corner,
  .${MAIM_CLASS_NAME}-Console::-webkit-scrollbar-corner {
    background-color: transparent;
  }

  .${MAIM_CLASS_NAME}-FakeSpace {
    height: 0;
  }
`;
