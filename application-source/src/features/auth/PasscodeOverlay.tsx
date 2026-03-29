import React, { useState, useRef, useEffect } from 'react';
import styles from './PasscodeOverlay.module.css';

interface PasscodeOverlayProps {
  onVerify: (pin: string) => void;
  error?: string | null;
}

export const PasscodeOverlay: React.FC<PasscodeOverlayProps> = ({ onVerify, error }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onVerify(pinString);
    }
  };

  // Auto-submit when 4th digit is entered
  useEffect(() => {
    const pinString = pin.join('');
    if (pinString.length === 4) {
      onVerify(pinString);
    }
  }, [pin, onVerify]);

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.logo}>Pixel Hunter</div>
        <h2 className={styles.title}>Secure Access</h2>
        <p className={styles.subtitle}>Enter your 4-digit passcode to continue</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.pinInputs}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={styles.pinDigit}
                autoFocus={index === 0}
                autoComplete="one-time-code"
              />
            ))}
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={pin.join('').length < 4}>
            Unlock Application
          </button>
          
          {error && <div className={styles.errorMsg}>{error}</div>}
        </form>
      </div>
    </div>
  );
};
