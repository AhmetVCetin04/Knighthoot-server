import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CardPage from './pages/CardPage';
import FrontPage from './pages/FrontPage';
import AccountTypePage from './pages/AccountTypePage';
import TeacherDashPage from './pages/TeacherDashPage';
import StudentDashPage from './pages/StudentDashPage';
import TeacherLayout from './components/TeacherLayout';
import CreateQuizPage from './pages/CreateQuizPage';
import MyQuizzesPage from './pages/MyQuizzesPage';
import EditQuiz from "./components/EditQuiz";  
import ViewQuiz from "./pages/ViewQuiz"; 
import StartTestPage from './pages/StartTestPage';
import WaitingRoom from './pages/WaitingRoom';
import HostQuiz from './pages/HostQuiz';

function App() {
	return (
		<BrowserRouter>
		<Routes>
		<Route path="/" element={<FrontPage />} />
		<Route path="/login" element={<LoginPage />} />
		<Route path="/account-type" element={<AccountTypePage />} />
		<Route path="/register/:role" element={<RegisterPage />} />
		<Route path="/dashboard/teacher" element={<TeacherDashPage />} />
		<Route path="/dashboard/teacher" element={<TeacherLayout />}>
			<Route index element={<TeacherDashPage />} />                  {/* default dashboard view */}
			<Route path="create-quiz" element={<CreateQuizPage />} />   {/* nested page */}
			<Route path="quizzes" element={<MyQuizzesPage />} /> 
			<Route path="edit/:id" element={<EditQuiz />} />
			<Route path="quiz/:id" element={<ViewQuiz />} /> 
			<Route path="start" element={<StartTestPage />} />
			<Route path="start/waiting" element={<WaitingRoom />} />
			<Route path="/dashboard/teacher/live" element={<HostQuiz />} />
		</Route>

		<Route path="/dashboard/student" element={<StudentDashPage />} />
		<Route path="/cards" element={<CardPage />} />
		</Routes>
		</BrowserRouter>
	);
}
export default App;
