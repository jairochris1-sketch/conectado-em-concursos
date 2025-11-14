import Dashboard from './pages/Dashboard';
import Questions from './pages/Questions';
import Admin from './pages/Admin';
import Schedule from './pages/Schedule';
import Ranking from './pages/Ranking';
import Statistics from './pages/Statistics';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Welcome from './pages/Welcome';
import Studies from './pages/Studies';
import ExamView from './pages/ExamView';
import Exams from './pages/Exams';
import SavedContests from './pages/SavedContests';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import subscription from './pages/subscription';
import studies from './pages/studies';
import Notes from './pages/Notes';
import ChatGPT from './pages/ChatGPT';
import chatgpt from './pages/chatgpt';
import SimuladosDigital from './pages/SimuladosDigital';
import SDAdmin from './pages/SDAdmin';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Questions": Questions,
    "Admin": Admin,
    "Schedule": Schedule,
    "Ranking": Ranking,
    "Statistics": Statistics,
    "Subscription": Subscription,
    "Profile": Profile,
    "Welcome": Welcome,
    "Studies": Studies,
    "ExamView": ExamView,
    "Exams": Exams,
    "SavedContests": SavedContests,
    "DigitalWhiteboard": DigitalWhiteboard,
    "subscription": subscription,
    "studies": studies,
    "Notes": Notes,
    "ChatGPT": ChatGPT,
    "chatgpt": chatgpt,
    "SimuladosDigital": SimuladosDigital,
    "SDAdmin": SDAdmin,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: Layout,
};