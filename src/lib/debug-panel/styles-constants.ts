import { round } from './styles-tools';

export const MAIM_CLASS_NAME = 'ReactPipeDebugPanel';

export const ALT_BACKGROUND_COLOR = '#262a32';
export const BACKGROUND_COLOR = '#292e38';
export const COLOR = '#a9b2c4';
export const FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif';
export const FONT_SIZE = '1rem';
export const SCROLL_WIDTH = 0.5;

export const PIPE_WIDTH = 35;
export const PIPE_BORDER_WIDTH = 0.2;
export const PIPE_BORDER_RADIUS = 0.4;
export const PIPE_INNER_BORDER_RADIUS = round(PIPE_BORDER_RADIUS - PIPE_BORDER_WIDTH);
export const IN_SHIFT = 1.84;
export const IN_GAP = 1.1;
export const IN_END_GAP = 1;
export const IN_TAP_LENGTH = 0;
export const OUT_SHIFT = 3;
export const OUT_GAP = 1.2;
export const LINE_SPACE = 1.3;
export const LINE_BORDER_RADIUS = 0.4;
export const LINE_WIDTH = 0.2;
export const LINE_SHADOW_WIDTH = 0.46;
export const LINE_SHADOW_SHIFT = round((LINE_SHADOW_WIDTH - LINE_WIDTH) / 2);
export const HEEL_LENGTH = 0.8;
export const HEEL_WIDTH = 0.38;
export const HEEL_SHIFT = round((HEEL_WIDTH - LINE_WIDTH) / 2);
export const HEEL_RADIUS = round(LINE_BORDER_RADIUS + HEEL_SHIFT);
export const HOLE_LENGTH = 0.46;
export const HOLE_WIDTH = 0.16;
