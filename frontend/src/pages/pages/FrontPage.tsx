import { Link } from "react-router-dom";
import SiteBackground from '../components/SiteBackground';
import ucf from '../assets/ucf.png'
import pegasusIcon from '../assets/pegasus.png'
import knightHelmetIcon from '../assets/knight.png'
import rubberDuckIcon from '../assets/duck.png'
import crossedSwordsIcon from '../assets/swords.png'

function FrontPage() {
  const options = [
    { id: 'student-login', title: 'Student Login', icon: pegasusIcon, to: '/login', type: 'student' },
    { id: 'teacher-login', title: 'Teacher Login', icon: knightHelmetIcon, to: '/login', type: 'teacher' },
    { id: 'create-account', title: 'Create Account', icon: rubberDuckIcon, to: '/account-type', type: 'create' },
    { id: 'about-us', title: 'About Us', icon: crossedSwordsIcon, to: '/about', type: 'about' },
  ];

  return (
    <main className="site-bg">
      <SiteBackground />

      <div className="frontpage">
        <img src={ucf} alt="UCF Logo" className="frontpage__logo" />

        {/* Header */}
        <div className="frontpage__header">
          <p className="frontpage__welcome">Welcome to</p>
          <h1 className="frontpage__title">Knighthoot</h1>
          <p className="frontpage__subtitle">Choose from the following options...</p>
        </div>

        {/* 2x2 Button Grid */}
        <div className="frontpage__grid">
          {options.map(opt => (
            <Link key={opt.id} to={opt.to} className={`frontpage__button ${opt.type}`}>
              <img src={opt.icon} alt={opt.title} className="frontpage__icon" />
              <span className="frontpage__text">{opt.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default FrontPage;
