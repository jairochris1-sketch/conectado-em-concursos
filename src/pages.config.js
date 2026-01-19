import Admin from './pages/Admin';
import AssistirAula from './pages/AssistirAula';
import ChatGPT from './pages/ChatGPT';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import Dashboard from './pages/Dashboard';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import ExamView from './pages/ExamView';
import Exams from './pages/Exams';
import FavoriteQuestions from './pages/FavoriteQuestions';
import GuiaEstudos from './pages/GuiaEstudos';
import Home from './pages/Home';
import Notes from './pages/Notes';
import PerformanceReports from './pages/PerformanceReports';
import Profile from './pages/Profile';
import Questions from './pages/Questions';
import Ranking from './pages/Ranking';
import SDAdmin from './pages/SDAdmin';
import SavedContests from './pages/SavedContests';
import Schedule from './pages/Schedule';
import SimuladosDigital from './pages/SimuladosDigital';
import Statistics from './pages/Statistics';
import Studies from './pages/Studies';
import Subscription from './pages/Subscription';
import Welcome from './pages/Welcome';
import chatgpt from './pages/chatgpt';
import studies from './pages/studies';
import subscription from './pages/subscription';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AssistirAula": AssistirAula,
    "ChatGPT": ChatGPT,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "Dashboard": Dashboard,
    "DigitalWhiteboard": DigitalWhiteboard,
    "ExamView": ExamView,
    "Exams": Exams,
    "FavoriteQuestions": FavoriteQuestions,
    "GuiaEstudos": GuiaEstudos,
    "Home": Home,
    "Notes": Notes,
    "PerformanceReports": PerformanceReports,
    "Profile": Profile,
    "Questions": Questions,
    "Ranking": Ranking,
    "SDAdmin": SDAdmin,
    "SavedContests": SavedContests,
    "Schedule": Schedule,
    "SimuladosDigital": SimuladosDigital,
    "Statistics": Statistics,
    "Studies": Studies,
    "Subscription": Subscription,
    "Welcome": Welcome,
    "chatgpt": chatgpt,
    "studies": studies,
    "subscription": subscription,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};