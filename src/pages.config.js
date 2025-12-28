import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import Home from './pages/Home';
import SDAdmin from './pages/SDAdmin';
import SimuladosDigital from './pages/SimuladosDigital';
import chatgpt from './pages/chatgpt';
import studies from './pages/studies';
import subscription from './pages/subscription';
import Admin from './pages/Admin';
import ChatGPT from './pages/ChatGPT';
import Dashboard from './pages/Dashboard';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import ExamView from './pages/ExamView';
import Exams from './pages/Exams';
import Notes from './pages/Notes';
import Profile from './pages/Profile';
import Questions from './pages/Questions';
import Ranking from './pages/Ranking';
import SavedContests from './pages/SavedContests';
import Schedule from './pages/Schedule';
import Statistics from './pages/Statistics';
import Studies from './pages/Studies';
import Subscription from './pages/Subscription';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "Home": Home,
    "SDAdmin": SDAdmin,
    "SimuladosDigital": SimuladosDigital,
    "chatgpt": chatgpt,
    "studies": studies,
    "subscription": subscription,
    "Admin": Admin,
    "ChatGPT": ChatGPT,
    "Dashboard": Dashboard,
    "DigitalWhiteboard": DigitalWhiteboard,
    "ExamView": ExamView,
    "Exams": Exams,
    "Notes": Notes,
    "Profile": Profile,
    "Questions": Questions,
    "Ranking": Ranking,
    "SavedContests": SavedContests,
    "Schedule": Schedule,
    "Statistics": Statistics,
    "Studies": Studies,
    "Subscription": Subscription,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};