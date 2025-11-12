import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import RegisterPage from './pages/RegisterPage';
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
import EndQuiz from './pages/EndQuiz';
import TeacherReportsListPage from "./pages/TeachersReportsListPage";
import TeacherReportDetailsPage from "./pages/TeachersReportDetailsPage";
import EnterAccessCode from './pages/EnterAccessCode';
import StudentWaitingRoom from './pages/StudentWaitingRoom';
import StudentLiveQuiz from './pages/StudentLiveQuiz';
import StudentQuizResults from './pages/StudentQuizResults';
import StudentReports from './pages/StudentReports';
import StudentReportDetails from './pages/StudentReportDetails';
import PasswordResetPage from "./pages/PasswordReset";
import NewPasswordPage from "./pages/NewPassword";
import StudentSettingsPage from "./pages/StudentSettings";
import TeacherSettings from "./pages/TeacherSettings";



function App() {
	return (
		<BrowserRouter>
		<Routes>
		<Route path="/" element={<FrontPage />} />
		<Route path="/login" element={<LoginPage />} />
		<Route path="/about" element={<AboutPage />} />
		<Route path="/password-reset" element={<PasswordResetPage />} />
		<Route path="/password-reset/new" element={<NewPasswordPage />} />
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
			<Route path="live" element={<HostQuiz />} />
			<Route path="finished" element={<EndQuiz />} />
			<Route path="reports" element={<TeacherReportsListPage />} />
			<Route path="reports/:testId" element={<TeacherReportDetailsPage />} />
			<Route path="settings" element={<TeacherSettings />} />
		</Route>
 
		<Route path="/dashboard/student" element={<StudentDashPage />} />
		<Route path="/student/start" element={<EnterAccessCode />} />
		<Route path="/dashboard/student/waiting" element={<StudentWaitingRoom />} />
		<Route path="/dashboard/student/live" element={<StudentLiveQuiz />} />
		<Route path="/student/results" element={<StudentQuizResults />} />
		<Route path="/student/reports" element={<StudentReports />} />
		<Route path="/dashboard/student/report-details" element={<StudentReportDetails />} />
		<Route path="/student/settings" element={<StudentSettingsPage />} />

		
		</Routes>
		</BrowserRouter>
	);
}
export default App;
