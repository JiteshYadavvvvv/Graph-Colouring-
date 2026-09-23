import { colorFill } from '../utils/helpers';

/** Small numbered color badge. `state`: normal | blocked | available | chosen. */
export default function ColorChip({ color, state = 'normal', label }) {
  return (
    <span
      className={`color-chip chip-${state}`}
      style={{ '--chip': colorFill(color) }}
      title={label || `Color ${color}`}
    >
      {color}
    </span>
  );
}
