/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Notebooks from './pages/Notebooks';
import PaymentHistory from './pages/PaymentHistory';
import Subscription from './pages/Subscription';
import LogicCourse from './pages/LogicCourse';
import EditalViewer from './pages/EditalViewer';
import GuiaEstudos from './pages/GuiaEstudos';
import ViewStudyPlan from './pages/ViewStudyPlan';
import Dashboard from './pages/Dashboard';
import SavedContests from './pages/SavedContests';
import ChatGPT from './pages/ChatGPT';
import SDAdmin from './pages/SDAdmin';
import EditalSimulator from './pages/EditalSimulator';
import MathCourse from './pages/MathCourse';
import ResetPassword from './pages/ResetPassword';
import Ranking from './pages/Ranking';
import chatgpt from './pages/chatgpt';
import NotebookStats from './pages/NotebookStats';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import CreateStudyPlan from './pages/CreateStudyPlan';
import CreateNotebook from './pages/CreateNotebook';
import ForgotPassword from './pages/ForgotPassword';
import FavoriteQuestions from './pages/FavoriteQuestions';
import subscription from './pages/subscription';
import PerformanceReports from './pages/PerformanceReports';
import MyDoubts from './pages/MyDoubts';
import Community from './pages/Community';
import Admin from './pages/Admin';
import EnglishCourse from './pages/EnglishCourse';
import studies from './pages/studies';
import Exams from './pages/Exams';
import ActivityFeed from './pages/ActivityFeed';
import StudyPlans from './pages/StudyPlans';
import ExamView from './pages/ExamView';
import SimuladosDigital from './pages/SimuladosDigital';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import SolveNotebook from './pages/SolveNotebook';
import Schedule from './pages/Schedule';
import Statistics from './pages/Statistics';
import AssistirAula from './pages/AssistirAula';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import SolveSimulation from './pages/SolveSimulation';
import Studies from './pages/Studies';
import Questions from './pages/Questions';
import CreateSimulation from './pages/CreateSimulation';
import Notes from './pages/Notes';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Notebooks": Notebooks,
    "PaymentHistory": PaymentHistory,
    "Subscription": Subscription,
    "LogicCourse": LogicCourse,
    "EditalViewer": EditalViewer,
    "GuiaEstudos": GuiaEstudos,
    "ViewStudyPlan": ViewStudyPlan,
    "Dashboard": Dashboard,
    "SavedContests": SavedContests,
    "ChatGPT": ChatGPT,
    "SDAdmin": SDAdmin,
    "EditalSimulator": EditalSimulator,
    "MathCourse": MathCourse,
    "ResetPassword": ResetPassword,
    "Ranking": Ranking,
    "chatgpt": chatgpt,
    "NotebookStats": NotebookStats,
    "Home": Home,
    "Profile": Profile,
    "Calendar": Calendar,
    "CreateStudyPlan": CreateStudyPlan,
    "CreateNotebook": CreateNotebook,
    "ForgotPassword": ForgotPassword,
    "FavoriteQuestions": FavoriteQuestions,
    "subscription": subscription,
    "PerformanceReports": PerformanceReports,
    "MyDoubts": MyDoubts,
    "Community": Community,
    "Admin": Admin,
    "EnglishCourse": EnglishCourse,
    "studies": studies,
    "Exams": Exams,
    "ActivityFeed": ActivityFeed,
    "StudyPlans": StudyPlans,
    "ExamView": ExamView,
    "SimuladosDigital": SimuladosDigital,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "SolveNotebook": SolveNotebook,
    "Schedule": Schedule,
    "Statistics": Statistics,
    "AssistirAula": AssistirAula,
    "DigitalWhiteboard": DigitalWhiteboard,
    "SolveSimulation": SolveSimulation,
    "Studies": Studies,
    "Questions": Questions,
    "CreateSimulation": CreateSimulation,
    "Notes": Notes,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};