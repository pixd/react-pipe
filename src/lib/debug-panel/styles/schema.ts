import { ALT_BACKGROUND_COLOR, IN_GAP, MAIM_CLASS_NAME, PIPE_BORDER_RADIUS, PIPE_BORDER_WIDTH,
  PIPE_INNER_BORDER_RADIUS } from '../styles-constants';
import { css } from '../styles-tools';

const PIPE_BORDER_COLOR = '#758596';

export const styles = css`
  .${MAIM_CLASS_NAME}-Schema {}

  .${MAIM_CLASS_NAME}-Pipe {
    position: relative;
  }

  .${MAIM_CLASS_NAME}-Pipe:last-of-type {
    margin-bottom: ${IN_GAP}em;
  }

  .${MAIM_CLASS_NAME}-PipeBody {
    border: ${PIPE_BORDER_WIDTH}em solid ${PIPE_BORDER_COLOR};
    border-radius: ${PIPE_BORDER_RADIUS}em;
    position: relative;
    width: 35em;
    z-index: 1;
  }

  .${MAIM_CLASS_NAME}-PipeIn {
    display: flex;
    overflow: hidden;
    padding: 0.4em;
    position: relative;
  }

  .${MAIM_CLASS_NAME}-PipeOut {
    justify-content: space-between;
    border-top: 1px dashed #3e4551;
    display: flex;
  }

  .${MAIM_CLASS_NAME}-EmitDataOut {
    background-color: ${ALT_BACKGROUND_COLOR};
    border-radius: 0 0 0 ${PIPE_INNER_BORDER_RADIUS}em;
    display: flex;
    flex: 1;
    overflow: hidden;
    padding: 0.4em;
    position: relative;
  }

  .${MAIM_CLASS_NAME}-EmitErrorOut {
    background-color: #322c2c;
    border-left: 1px dashed #3e4551;
    border-radius: 0 0 ${PIPE_INNER_BORDER_RADIUS}em 0;
    display: flex;
    overflow: hidden;
    padding: 0.4em;
    position: relative;
    width: 10.4em;
  }

  .${MAIM_CLASS_NAME}-StreamGroup {
    align-items: center;
    background: #242933;
    border: 0.1em solid #222427;
    border-radius: 0.2em;
    cursor: pointer;
    display: flex;
    height: fit-content;
    margin-right: 0.4em;
    padding: 0.5em 0.6em;
    z-index: 1;
  }

  .${MAIM_CLASS_NAME}-StreamGroupMember {
    align-items: center;
    display: flex;
    justify-content: center;
    height: 1em;
    width: 1em;
  }

  .${MAIM_CLASS_NAME}-StreamGroupMember:not(.${MAIM_CLASS_NAME}-IconStatus-Pulse) svg {
    animation: ${MAIM_CLASS_NAME}-PulseAnimation 1.6s;
    display: block;
  }

  .${MAIM_CLASS_NAME}-StreamGroupMember + .${MAIM_CLASS_NAME}-StreamGroupMember {
    margin-left: 0.3em;
  }

  .${MAIM_CLASS_NAME}-StreamGroup-Selected,
  .${MAIM_CLASS_NAME}-StreamGroup-SelectedMinor {
    border-color: #556789;
  }

  .${MAIM_CLASS_NAME}-StreamGroup-Selected {
    background-color: #3e4d6c;
  }

  .${MAIM_CLASS_NAME}-PipeName {
    color: #9fabb9;
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 500;
    padding: 0.2em 0.6em;
    position: relative;
    user-select: none;
    width: fit-content;
    z-index: 1;
  }

  .${MAIM_CLASS_NAME}-SectionName {
    align-items: center;
    color: #98c8ff;
    display: flex;
    font-size: 1.3em;
    font-weight: 900;
    justify-content: center;
    left: 0;
    line-height: 1.6em;
    opacity: 0.04;
    position: absolute;
    text-align: center;
    user-select: none;
    width: 100%;
    z-index: 0;
  }

  .${MAIM_CLASS_NAME}-SectionName > * + * {
    margin-left: 0.2em;
  }

  .${MAIM_CLASS_NAME}-SectionName svg {
    fill: currentColor;
    width: 0.86em;
  }
`;
