import { BACKGROUND_COLOR, HEEL_LENGTH, HEEL_RADIUS, HEEL_SHIFT, HEEL_WIDTH, HOLE_LENGTH,
  HOLE_WIDTH, LINE_WIDTH, MAIM_CLASS_NAME, OUT_SHIFT, LINE_SHADOW_SHIFT, LINE_SHADOW_WIDTH,
  PIPE_WIDTH } from '../styles-constants';
import { css, round } from '../styles-tools';

const LINE_COLOR = '#5d6e7e';
const HEEL_COLOR = '#758596';

export const styles = css`
  .${MAIM_CLASS_NAME}-Connections {
    height: 100%;
    position: absolute;
    width: ${PIPE_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-DataOut,
  .${MAIM_CLASS_NAME}-ErrorOut {
    bottom: ${OUT_SHIFT}em;
    height: ${LINE_WIDTH}em;
    position: absolute;
  }

  .${MAIM_CLASS_NAME}-PathThrough {
    bottom: ${OUT_SHIFT}em;
    position: absolute;
    width: ${LINE_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-DataEntry,
  .${MAIM_CLASS_NAME}-ErrorEntry {
    position: absolute;
    width: 100%;
  }

  .${MAIM_CLASS_NAME}-DataOut > div,
  .${MAIM_CLASS_NAME}-ErrorOut > div {
    z-index: -1;
  }

  .${MAIM_CLASS_NAME}-DataOut > div,
  .${MAIM_CLASS_NAME}-ErrorOut > div,
  .${MAIM_CLASS_NAME}-PathThrough > div {
    height: 100%;
    position: absolute;
    width: 100%;
  }

  .${MAIM_CLASS_NAME}-DataEntry > div,
  .${MAIM_CLASS_NAME}-ErrorEntry > div {
    height: ${LINE_WIDTH}em;
    position: absolute;
    width: ${LINE_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-DataOut > div:before,
  .${MAIM_CLASS_NAME}-DataOut > div:after,
  .${MAIM_CLASS_NAME}-ErrorOut > div:before,
  .${MAIM_CLASS_NAME}-ErrorOut > div:after,
  .${MAIM_CLASS_NAME}-PathThrough > div:before,
  .${MAIM_CLASS_NAME}-PathThrough > div:after,
  .${MAIM_CLASS_NAME}-DataEntry > div:before,
  .${MAIM_CLASS_NAME}-DataEntry > div:after,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:before,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:after,
  .${MAIM_CLASS_NAME}-TConnection:after {
    content: "";
    display: block;
    height: 100%;
    position: absolute;
    width: 100%;
  }

  .${MAIM_CLASS_NAME}-DataOut > div:before,
  .${MAIM_CLASS_NAME}-PathThrough > div:before,
  .${MAIM_CLASS_NAME}-DataEntry > div:before,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:before {
    background-color: ${BACKGROUND_COLOR};
  }

  .${MAIM_CLASS_NAME}-DataOut > div:after,
  .${MAIM_CLASS_NAME}-ErrorOut > div:after,
  .${MAIM_CLASS_NAME}-PathThrough > div:after,
  .${MAIM_CLASS_NAME}-DataEntry > div:after,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:after {
    background-color: ${LINE_COLOR};
  }

  .${MAIM_CLASS_NAME}-DataOut > div:before,
  .${MAIM_CLASS_NAME}-DataEntry > div:nth-child(2):before,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:nth-child(2):before {
    height: ${LINE_SHADOW_WIDTH}em;
    top: -${LINE_SHADOW_SHIFT}em;
  }

  .${MAIM_CLASS_NAME}-PathThrough > div:before,
  .${MAIM_CLASS_NAME}-DataEntry > div:nth-child(1):before,
  .${MAIM_CLASS_NAME}-DataEntry > div:nth-child(3):before,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:nth-child(1):before,
  .${MAIM_CLASS_NAME}-ErrorEntry > div:nth-child(3):before {
    left: -${LINE_SHADOW_SHIFT}em;
    width: ${LINE_SHADOW_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-PathThrough > span {
    background-color: transparent;
    bottom: -${round(HEEL_LENGTH - LINE_WIDTH - HEEL_SHIFT)}em;
    height: ${HEEL_LENGTH}em;
    left: -${HEEL_SHIFT}em;
    width: ${HEEL_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-PathThrough > span,
  .${MAIM_CLASS_NAME}-DataEntry > span,
  .${MAIM_CLASS_NAME}-ErrorEntry > span {
    display: block;
    position: absolute;
    z-index: -1;
  }

  .${MAIM_CLASS_NAME}-DataEntry > span,
  .${MAIM_CLASS_NAME}-ErrorEntry > span {
    border-color: ${HEEL_COLOR};
    border-style: solid;
    height: ${HEEL_LENGTH}em;
    width: ${HEEL_LENGTH}em;
    z-index: -1;
  }

  .${MAIM_CLASS_NAME}-DataEntry > span:first-of-type {
    border-radius: 0 ${HEEL_RADIUS}em 0 0;
    border-width: ${HEEL_WIDTH}em ${HEEL_WIDTH}em 0 0;
  }

  .${MAIM_CLASS_NAME}-ErrorEntry > span:first-of-type {
    border-radius: ${HEEL_RADIUS}em 0 0 0;
    border-width: ${HEEL_WIDTH}em 0 0 ${HEEL_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-DataEntry > span:last-of-type {
    border-radius: 0 0 0 ${HEEL_RADIUS}em;
    border-width: 0 0 ${HEEL_WIDTH}em ${HEEL_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-ErrorEntry > span:last-of-type {
    border-radius: 0 0 ${HEEL_RADIUS}em 0;
    border-width: 0 ${HEEL_WIDTH}em ${HEEL_WIDTH}em 0;
  }

  .${MAIM_CLASS_NAME}-DataOut > i,
  .${MAIM_CLASS_NAME}-ErrorOut > i,
  .${MAIM_CLASS_NAME}-DataEntry > i,
  .${MAIM_CLASS_NAME}-ErrorEntry > i {
    background-color: ${HEEL_COLOR};
    display: block;
    position: absolute;
    z-index: -1;
  }

  .${MAIM_CLASS_NAME}-DataOut > i,
  .${MAIM_CLASS_NAME}-ErrorOut > i {
    bottom: -${round((HOLE_LENGTH - LINE_WIDTH) / 2)}em;
    height: ${HOLE_LENGTH}em;
    width: calc(${HOLE_WIDTH}em + 1px);
  }

  .${MAIM_CLASS_NAME}-DataOut > i {
    right: -1px;
  }

  .${MAIM_CLASS_NAME}-ErrorOut > i {
    left: -1px;
  }

  .${MAIM_CLASS_NAME}-DataEntry > i,
  .${MAIM_CLASS_NAME}-ErrorEntry > i {
    height: calc(${HOLE_WIDTH}em + 1px);
    position: absolute;
    top: -${HOLE_WIDTH}em;
    width: ${HOLE_LENGTH}em;
  }

  .${MAIM_CLASS_NAME}-Connection {
    border-color: ${HEEL_COLOR};
    border-style: solid;
    border-width: ${HEEL_WIDTH}em 0 0 0;
    bottom: ${round(OUT_SHIFT - HEEL_LENGTH + LINE_WIDTH + HEEL_SHIFT)}em;
    height: ${HEEL_LENGTH}em;
    position: absolute;
    width: ${HEEL_LENGTH}em;
    z-index: -1;
  }

  .${MAIM_CLASS_NAME}-DataConnection.${MAIM_CLASS_NAME}-TConnection {
    margin-left: -${round((HEEL_LENGTH - HEEL_WIDTH) / 2)}em;
  }

  .${MAIM_CLASS_NAME}-ErrorConnection.${MAIM_CLASS_NAME}-TConnection {
    margin-right: -${round((HEEL_LENGTH - HEEL_WIDTH) / 2)}em;
  }

  .${MAIM_CLASS_NAME}-TConnection:after {
    background-color: ${HEEL_COLOR};
    height: ${round(HEEL_LENGTH - HEEL_WIDTH)}em;
    margin-left: ${round((HEEL_LENGTH - HEEL_WIDTH) / 2)}em;
    width: ${HEEL_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-DataConnection.${MAIM_CLASS_NAME}-LConnection {
    border-radius: ${HEEL_RADIUS}em 0 0 0;
    border-width: ${HEEL_WIDTH}em 0 0 ${HEEL_WIDTH}em;
  }

  .${MAIM_CLASS_NAME}-ErrorConnection.${MAIM_CLASS_NAME}-LConnection {
    border-radius: 0 ${HEEL_RADIUS}em 0 0;
    border-width: ${HEEL_WIDTH}em ${HEEL_WIDTH}em 0 0;
  }
`;
