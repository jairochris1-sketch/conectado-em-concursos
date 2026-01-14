import ChatGPT from './pages/ChatGPT';
import Dashboard from './pages/Dashboard';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import ExamView from './pages/ExamView';
import Exams from './pages/Exams';
import Home from './pages/Home';
import Notes from './pages/Notes';
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
import Admin from './pages/Admin';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import GuiaEstudos from './pages/GuiaEstudos';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ChatGPT": ChatGPT,
    "Dashboard": Dashboard,
    "DigitalWhiteboard": DigitalWhiteboard,
    "ExamView": ExamView,
    "Exams": Exams,
    "Home": Home,
    "Notes": Notes,
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
    "Admin": Admin,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "GuiaEstudos": GuiaEstudos,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};