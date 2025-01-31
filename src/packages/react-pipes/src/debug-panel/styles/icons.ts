import { MAIM_CLASS_NAME } from '../styles-constants';
import { css } from '../styles-tools';

const MUTED_STATUS_COLOR = '#4b515f';
const ACTIVE_STATUS_COLOR = '#3d94ba';
const SUCCESS_STATUS_COLOR = '#3dba67';
const WARNING_STATUS_COLOR = '#c25d25';
const ERROR_STATUS_COLOR = '#cd5656';

export const styles = css`
  .${MAIM_CLASS_NAME}-IconStatus-Muted svg {
    fill: ${MUTED_STATUS_COLOR};
  }

  .${MAIM_CLASS_NAME}-IconStatus-Active svg {
    fill: ${ACTIVE_STATUS_COLOR};
  }

  .${MAIM_CLASS_NAME}-IconStatus-Success svg {
    fill: ${SUCCESS_STATUS_COLOR};
  }

  .${MAIM_CLASS_NAME}-IconStatus-Warning svg {
    fill: ${WARNING_STATUS_COLOR};
  }

  .${MAIM_CLASS_NAME}-IconStatus-Error svg {
    fill: ${ERROR_STATUS_COLOR};
  }

  .${MAIM_CLASS_NAME}-IconStatus-Pulse svg {
    animation: ${MAIM_CLASS_NAME}-PulseAnimation 1.6s infinite;
  }

  .${MAIM_CLASS_NAME}-DatabaseSolidIcon svg {
    width: 0.76em;
  }

  .${MAIM_CLASS_NAME}-BugSolidIcon svg {
    width: 0.9em;
  }

  .${MAIM_CLASS_NAME}-HeartSolidIcon svg {
    width: 0.96em;
  }

  .${MAIM_CLASS_NAME}-GhostSolidIcon svg {
    fill: #8c96a9;
    width: 0.75em;
  }

  .${MAIM_CLASS_NAME}-TrashSolidIcon svg {
    width: 0.8em;
  }

  .${MAIM_CLASS_NAME}-TintSolidIcon svg {
    width: 0.64em;
  }

  .${MAIM_CLASS_NAME}-HomeAltSolidIcon svg {
    width: 1em;
  }

  .${MAIM_CLASS_NAME}-InactiveIcon svg {
    opacity: 0.4;
  }
`;
