import ActivityFeed from './pages/ActivityFeed';
import Admin from './pages/Admin';
import AssistirAula from './pages/AssistirAula';
import Calendar from './pages/Calendar';
import ChatGPT from './pages/ChatGPT';
import Community from './pages/Community';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import Dashboard from './pages/Dashboard';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import EnglishCourse from './pages/EnglishCourse';
import ExamView from './pages/ExamView';
import Exams from './pages/Exams';
import FavoriteQuestions from './pages/FavoriteQuestions';
import GuiaEstudos from './pages/GuiaEstudos';
import Home from './pages/Home';
import LogicCourse from './pages/LogicCourse';
import MathCourse from './pages/MathCourse';
import Notes from './pages/Notes';
import PerformanceReports from './pages/PerformanceReports';
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
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityFeed": ActivityFeed,
    "Admin": Admin,
    "AssistirAula": AssistirAula,
    "Calendar": Calendar,
    "ChatGPT": ChatGPT,
    "Community": Community,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "Dashboard": Dashboard,
    "DigitalWhiteboard": DigitalWhiteboard,
    "EnglishCourse": EnglishCourse,
    "ExamView": ExamView,
    "Exams": Exams,
    "FavoriteQuestions": FavoriteQuestions,
    "GuiaEstudos": GuiaEstudos,
    "Home": Home,
    "LogicCourse": LogicCourse,
    "MathCourse": MathCourse,
    "Notes": Notes,
    "PerformanceReports": PerformanceReports,
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
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};