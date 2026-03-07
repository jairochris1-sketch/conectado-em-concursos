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
import AssistirAula from './pages/AssistirAula';
import CreateNotebook from './pages/CreateNotebook';
import CreateSimulation from './pages/CreateSimulation';
import ExamView from './pages/ExamView';
import Welcome from './pages/Welcome';
import EditalViewer from './pages/EditalViewer';
import EnglishCourse from './pages/EnglishCourse';
import FavoriteQuestions from './pages/FavoriteQuestions';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import LogicCourse from './pages/LogicCourse';
import MathCourse from './pages/MathCourse';
import NotebookStats from './pages/NotebookStats';
import PaymentHistory from './pages/PaymentHistory';
import Questions from './pages/Questions';
import ResetPassword from './pages/ResetPassword';
import SDAdmin from './pages/SDAdmin';
import SimulationHistory from './pages/SimulationHistory';
import SolveNotebook from './pages/SolveNotebook';
import SolveSimulation from './pages/SolveSimulation';
import PerformanceReports from './pages/PerformanceReports';
import Schedule from './pages/Schedule';
import ViewStudyPlan from './pages/ViewStudyPlan';
import studies from './pages/studies';
import subscription from './pages/subscription';
import ActivityFeed from './pages/ActivityFeed';
import Profile from './pages/Profile';
import EditalSimulator from './pages/EditalSimulator';
import ChatGPT from './pages/ChatGPT';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import Ranking from './pages/Ranking';
import Statistics from './pages/Statistics';
import Notebooks from './pages/Notebooks';
import SimulationReview from './pages/SimulationReview';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import Subscription from './pages/Subscription';
import Calendar from './pages/Calendar';
import Admin from './pages/Admin';
import People from './pages/People';
import Studies from './pages/Studies';
import chatgpt from './pages/chatgpt';
import MyDoubts from './pages/MyDoubts';
import StudyPlans from './pages/StudyPlans';
import Notes from './pages/Notes';
import SimuladosDigital from './pages/SimuladosDigital';
import GuiaEstudos from './pages/GuiaEstudos';
import CreateStudyPlan from './pages/CreateStudyPlan';
import Exams from './pages/Exams';
import Community from './pages/Community';
import SavedContests from './pages/SavedContests';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AssistirAula": AssistirAula,
    "CreateNotebook": CreateNotebook,
    "CreateSimulation": CreateSimulation,
    "ExamView": ExamView,
    "Welcome": Welcome,
    "EditalViewer": EditalViewer,
    "EnglishCourse": EnglishCourse,
    "FavoriteQuestions": FavoriteQuestions,
    "ForgotPassword": ForgotPassword,
    "Home": Home,
    "LogicCourse": LogicCourse,
    "MathCourse": MathCourse,
    "NotebookStats": NotebookStats,
    "PaymentHistory": PaymentHistory,
    "Questions": Questions,
    "ResetPassword": ResetPassword,
    "SDAdmin": SDAdmin,
    "SimulationHistory": SimulationHistory,
    "SolveNotebook": SolveNotebook,
    "SolveSimulation": SolveSimulation,
    "PerformanceReports": PerformanceReports,
    "Schedule": Schedule,
    "ViewStudyPlan": ViewStudyPlan,
    "studies": studies,
    "subscription": subscription,
    "ActivityFeed": ActivityFeed,
    "Profile": Profile,
    "EditalSimulator": EditalSimulator,
    "ChatGPT": ChatGPT,
    "DigitalWhiteboard": DigitalWhiteboard,
    "Ranking": Ranking,
    "Statistics": Statistics,
    "Notebooks": Notebooks,
    "SimulationReview": SimulationReview,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "Subscription": Subscription,
    "Calendar": Calendar,
    "Admin": Admin,
    "People": People,
    "Studies": Studies,
    "chatgpt": chatgpt,
    "MyDoubts": MyDoubts,
    "StudyPlans": StudyPlans,
    "Notes": Notes,
    "SimuladosDigital": SimuladosDigital,
    "GuiaEstudos": GuiaEstudos,
    "CreateStudyPlan": CreateStudyPlan,
    "Exams": Exams,
    "Community": Community,
    "SavedContests": SavedContests,
    "Dashboard": Dashboard,
    "UserProfile": UserProfile,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};