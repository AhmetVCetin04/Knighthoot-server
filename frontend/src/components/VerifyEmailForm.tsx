import React, { useEffect, useRef } from "react";
import '../VerifyEmailForm.css';
import Container from '../assets/Container.png'

type Props = {
  email: string;
  code: string;                        
  setCode: (v: string) => void;         
  submitting?: boolean;                 
  onSubmit: (e: any) => void;           
  onResend?: () => void;                
  onBack?: () => void;                  
  devCode?: string;                     
  logoSrc?: string;                     
};

export default function VerifyEmailForm({
  email, code, setCode, submitting, onSubmit, onResend, onBack, devCode, logoSrc
}: Props) {
  const boxesRef = useRef<Array<HTMLInputElement | null>>([]);

  // expand Register's single string "code" into 6 boxes
  const digits = (code || "").padStart(0, "").slice(0, 6).split("");
  while (digits.length < 6) digits.push("");

  useEffect(() => { boxesRef.current[0]?.focus(); }, []);

  const handleChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[idx] = val;
    setCode(next.join(""));
    if (val && idx < 5) boxesRef.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      boxesRef.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) boxesRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) boxesRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    setCode(text);
    const last = Math.min(text.length, 6) - 1;
    boxesRef.current[last >= 0 ? last : 0]?.focus();
    e.preventDefault();
  };

  const filled = (code || "").length === 6;

  return (
    <form className="ve-page" onSubmit={onSubmit}>

      <main className="ve-stage">
        <section className="ve-card">
          <div className="ve-icon-wrap">
            <img src={Container} alt="Mail" className="icon-image" />
          </div>

          <h2 className="ve-heading">Verify Your Email</h2>
          <p className="ve-sub">We sent a 6-digit code to</p>
          <p className="ve-email">{email}</p>

          <div className="ve-otp">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { boxesRef.current[i] = el; }}
                className="ve-otp-box"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={handleChange(i)}
                onKeyDown={handleKeyDown(i)}
                onPaste={handlePaste}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button className="ve-submit" disabled={submitting}>
            {submitting ? "Verifying..." : "Verify Email"}
          </button>

          {onResend && (
            <div className="ve-resend">
              Didn’t receive the code?{" "}
              <button type="button" className="ve-resend-link" onClick={onResend}>Resend Code</button>
            </div>
          )}

          {devCode && (
            <div className="ve-devbar">
              <strong>Development Mode:</strong>
              <span className="ve-devcode">Your code is {devCode}</span>
            </div>
          )}
        </section>
      </main>
    </form>
  );
}
