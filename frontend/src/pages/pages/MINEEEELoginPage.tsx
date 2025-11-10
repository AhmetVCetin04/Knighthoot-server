import PageTitle from '../components/PageTitle.tsx';
import Login from '../components/Login.tsx';
import SiteBackground from '../components/SiteBackground.tsx';
const LoginPage = () =>
{
	return(
		
		<main className="site-bg">
      		<SiteBackground />
      		<div className="login-card">
				<PageTitle />
				<Login />
      		</div>
    	</main>
	);
};
export default LoginPage;
