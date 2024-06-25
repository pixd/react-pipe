import { MAIM_CLASS_NAME } from '../styles-constants';
import { css } from '../styles-tools';

export const styles = css`
  @keyframes ${MAIM_CLASS_NAME}-PulseAnimation {
    0% {
      transform: scale(1);
    }
    5% {
      transform: scale(0.9);
    }
    10% {
      transform: scale(1.2);
    }
    15% {
      transform: scale(0.9);
    }
    20% {
      transform: scale(1);
    }
  }
`;
