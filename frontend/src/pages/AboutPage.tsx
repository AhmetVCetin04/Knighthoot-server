import PageTitle from '../components/PageTitle.tsx';
import About from '../components/About.tsx';
import SiteBackground from '../components/SiteBackground.tsx';
const AboutPage = () =>
{
	return(
		
		<main className="site-bg">
      		<SiteBackground />
      		<div className="about-card">
				<PageTitle />
				<About />
      		</div>
    	</main>
	);
};
export default AboutPage;
