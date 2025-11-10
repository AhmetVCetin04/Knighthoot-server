import { Link, useNavigate } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
import ucf from '../assets/ucf.png'
import pegasusIcon from '../assets/pegasus.png'
import knight from '../assets/knight.png'
import '../styles/AccountType.css';

function AccountTypePage() {
  const navigate = useNavigate();

  return (
    <main className="site-bg">
      <SiteBackground />

      {/* ===== Top Bar ===== */}
      <header className="accounttype__topbar">
        <button
          className="accounttype__back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ← Back
        </button>

        <h1 className="accounttype__title">Knighthoot</h1>
        <img src={ucf} alt="UCF Logo" className="accounttype__logo" />
      </header>

      {/* ===== Center Card ===== */}
      <div className="accounttype__stage">
        <section className="accounttype__card">
            <h2 className="accounttype__cardtitle"> Choose the account type that best describes you. </h2>
            <div className="accounttype__options">
                <Link to="/register/student" className="accounttype__btn gold">
                    <img src={pegasusIcon} alt="" className="accounttype__icon" />
                    <span>Student</span>
                </Link>

                <Link to="/register/teacher" className="accounttype__btn silver">
                    <img src={knight} alt="" className="accounttype__icon" />
                    <span>Teacher</span>
                </Link>
            </div>
            <p className="accounttype__footer">
                Already have an account?{" "}
                <Link to="/login" className="accounttype__loginlink">
                    Login
                </Link>
            </p>
        </section>
      </div>

    </main>
  );
}
export default AccountTypePage;
