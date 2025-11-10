import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
import VerifyEmailForm from "../components/VerifyEmailForm";
import ucf from '../assets/ucf.png'
import '../Register.css';

function Register() {
  const [message, setMessage] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setPassword] = useState("");

  const [register, setRegister] = useState(false); 
  const [registerFirstName, setFirstName] = useState("");
  const [registerLastName, setLastName] = useState("");
  const [registerEmail, setEmail] = useState("");
  const [isTeacher, setTeacher] = useState(false);
  const [verifyCode, isSent] = useState(false);
  const [code, setCode] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  // NEW: hold the OTP returned by /api/email so we can verify locally
  const [serverOtp, setServerOtp] = useState<string | null>(null); // NEW
  const [sending, setSending] = useState(false);                   // NEW
  const [registering, setRegistering] = useState(false);           // NEW

  const { role } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === "teacher") setTeacher(true);
    if (role === "student") setTeacher(false);
  }, [role]);

  function handleSetName(e: any) { setLoginName(e.target.value); }
  function handleSetPassword(e: any) { setPassword(e.target.value); }
  function handleSetFirstName(e: any) { setFirstName(e.target.value); }
  function handleSetLastName(e: any) { setLastName(e.target.value); }
  function handleSetEmail(e: any) { setEmail(e.target.value); }
  function handleCode(e: any) { setCode(e.target.value); }

  // STEP 1: send OTP email 
  async function emailVerify(e: any): Promise<void> {
    e.preventDefault();

    if (!registerEmail || !loginName || !loginPassword) {
      setMessage("Please fill email, username, and password first.");
      return;
    }
    if (loginPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setSending(true);
      setMessage("");

      const resp = await fetch("https://knighthoot.app/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerEmail }),
      });

      const data = await resp.json().catch(() => ({} as any));

      if (!resp.ok || !data?.otp) {
        setMessage(data?.error || "Failed to send verification email.");
        return;
      }

      setServerOtp(data.otp); 
      isSent(true);           
    } catch (err: any) {
      setMessage("Network error sending email.");
    } finally {
      setSending(false);
    }
  }

  // STEP 2: local OTP check, then register
  async function doRegister(event: any): Promise<void> {
    event.preventDefault();

    if (!code) {
      setMessage("Please enter the verification code sent to your email.");
      return;
    }
    if (!serverOtp) {
      setMessage("No verification code has been issued yet. Please start over.");
      return;
    }
    if (code.trim() !== serverOtp.trim()) {
      setMessage("Invalid verification code.");
      return;
    }

    const obj = {
      firstName: registerFirstName,
      lastName: registerLastName,
      username: loginName,
      password: loginPassword,
      email: registerEmail,
      isTeacher: isTeacher,
      
    };

    try {
      setRegistering(true);
      const response = await fetch(
        "https://knighthoot.app/api/register",
        { method: "POST", body: JSON.stringify(obj), headers: { "Content-Type": "application/json" } }
      );
      const res = JSON.parse(await response.text());

      if (res?.id <= 0) {
        setMessage(res?.message || "Registration failed.");
      } else {
        localStorage.setItem("user_data", JSON.stringify(res));
        setMessage("");
        window.location.href = "/";
      }
    } catch (error: any) {
      setMessage("Network error registering account.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <main className="site-bg">
      <SiteBackground />

      <header className="reg-topbar">
        <button className="reg-back" onClick={() => navigate(-1)} aria-label="Back">← Back</button>
        <div className="reg-title">Knighthoot</div>
        <img src={ucf} alt="UCF" className="reg-logo" />
      </header>
      <div className="reg-stage">
          {!verifyCode && (
            <section className="reg-card">
              <form className="reg-form" onSubmit={emailVerify}>
                <h2 className="reg-card__heading">
                  {isTeacher ? "Teacher Registration" : "Student Registration"}
                </h2>
                <p className="reg-card__sub">
                  {isTeacher
                    ? "This is registration for teachers only. If you would like to register as a student please press the back button."
                    : "This is registration for students only. If you would like to register as a teacher please press the back button."}
                </p>
                <input type="text" placeholder="Username" className="reg-input" onChange={handleSetName} />
                <div className="reg-row">
                  <input type="text" placeholder="First Name" className="reg-input" onChange={handleSetFirstName} />
                  <input type="text" placeholder="Last Name" className="reg-input" onChange={handleSetLastName} />
                </div>
                <input type="email" placeholder="Email Address" className="reg-input" onChange={handleSetEmail} />
                <input type="password" placeholder="Password" className="reg-input" onChange={handleSetPassword} />
                <input type="password" placeholder="Confirm Password" className="reg-input" onChange={(e) => setConfirmPassword(e.target.value)} />

                <button type="submit" className="reg-submit" disabled={sending}>
                  {sending ? "Sending..." : "Sign Up"}
                </button>

                <p className="reg-footer">
                  Already have an account? <Link to="/login" className="reg-link">Log in</Link>
                </p>
                {message && <p className="reg-error">{message}</p>}
              </form>
            </section>
          )}

          {verifyCode && (
            <VerifyEmailForm
              email={registerEmail}
              code={code}              
              setCode={setCode}          
              submitting={registering}   
              onSubmit={doRegister}      
              // onResend={resendCode}   
              // devCode={serverOtp}     
              // onBack={() => navigate(-1)}
              />
          )}
      </div>
    </main>
  );
}

export default Register;
