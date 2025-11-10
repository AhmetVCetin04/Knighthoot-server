import React, { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (seconds: number) => void;
  defaultValue?: number;
};

const OPTIONS = [15, 30, 45];

export default function TimeLimitModal({
  open,
  onClose,
  onConfirm,
  defaultValue = 30,
}: Props) {
  const [value, setValue] = useState<number>(defaultValue);
  useEffect(() => { if (open) setValue(defaultValue); }, [open, defaultValue]);
  if (!open) return null;

  return (
    <div className="kh-modal__backdrop" role="dialog" aria-modal="true">
      <div className="kh-modal">
        <div className="kh-modal__header">
          <h3>Set Time Limit</h3>
          <button className="kh-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <p className="kh-modal__sub">Choose the time limit for each question.</p>

        <div className="kh-modal__options">
          {OPTIONS.map((sec) => (
            <label key={sec} className="kh-radio">
              <input
                type="radio"
                name="timeLimit"
                value={sec}
                checked={value === sec}
                onChange={() => setValue(sec)}
              />
              <span>{sec} seconds</span>
            </label>
          ))}
        </div>

        <div className="kh-modal__actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--gold" onClick={() => onConfirm(value)}>Start Test</button>
        </div>
      </div>
    </div>
  );
}

