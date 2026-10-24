import { MAX_QTY } from '../../../shared/constants.js';
import { Minus, Plus } from './Icons';

export default function QuantityStepper({ value, onChange, label = 'item', min = 1, max = MAX_QTY, small = false }) {
  return (
    <div className={`qty ${small ? 'qty--small' : ''}`} role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= (small ? 0 : min)} aria-label="Decrease quantity">
        <Minus />
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus />
      </button>
    </div>
  );
}
