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
import ActivityFeed from './pages/ActivityFeed';
import Admin from './pages/Admin';
import AssistirAula from './pages/AssistirAula';
import Calendar from './pages/Calendar';
import ChatGPT from './pages/ChatGPT';
import Community from './pages/Community';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import CreateNotebook from './pages/CreateNotebook';
import CreateSimulation from './pages/CreateSimulation';
import CreateStudyPlan from './pages/CreateStudyPlan';
import Dashboard from './pages/Dashboard';
import DigitalWhiteboard from './pages/DigitalWhiteboard';
import EditalSimulator from './pages/EditalSimulator';
import EditalViewer from './pages/EditalViewer';
import EnglishCourse from './pages/EnglishCourse';
import ExamView from './pages/ExamView';
import Exams from './pages/Exams';
import FavoriteQuestions from './pages/FavoriteQuestions';
import ForgotPassword from './pages/ForgotPassword';
import GuiaEstudos from './pages/GuiaEstudos';
import Home from './pages/Home';
import LogicCourse from './pages/LogicCourse';
import MathCourse from './pages/MathCourse';
import MyDoubts from './pages/MyDoubts';
import NotebookStats from './pages/NotebookStats';
import Notebooks from './pages/Notebooks';
import Notes from './pages/Notes';
import PaymentHistory from './pages/PaymentHistory';
import PerformanceReports from './pages/PerformanceReports';
import Profile from './pages/Profile';
import Questions from './pages/Questions';
import Ranking from './pages/Ranking';
import ResetPassword from './pages/ResetPassword';
import SDAdmin from './pages/SDAdmin';
import SavedContests from './pages/SavedContests';
import Schedule from './pages/Schedule';
import SimuladosDigital from './pages/SimuladosDigital';
import SimulationHistory from './pages/SimulationHistory';
import SimulationReview from './pages/SimulationReview';
import SolveNotebook from './pages/SolveNotebook';
import SolveSimulation from './pages/SolveSimulation';
import Statistics from './pages/Statistics';
import Studies from './pages/Studies';
import StudyPlans from './pages/StudyPlans';
import Subscription from './pages/Subscription';
import ViewStudyPlan from './pages/ViewStudyPlan';
import Welcome from './pages/Welcome';
import chatgpt from './pages/chatgpt';
import studies from './pages/studies';
import subscription from './pages/subscription';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActivityFeed": ActivityFeed,
    "Admin": Admin,
    "AssistirAula": AssistirAula,
    "Calendar": Calendar,
    "ChatGPT": ChatGPT,
    "Community": Community,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "CreateNotebook": CreateNotebook,
    "CreateSimulation": CreateSimulation,
    "CreateStudyPlan": CreateStudyPlan,
    "Dashboard": Dashboard,
    "DigitalWhiteboard": DigitalWhiteboard,
    "EditalSimulator": EditalSimulator,
    "EditalViewer": EditalViewer,
    "EnglishCourse": EnglishCourse,
    "ExamView": ExamView,
    "Exams": Exams,
    "FavoriteQuestions": FavoriteQuestions,
    "ForgotPassword": ForgotPassword,
    "GuiaEstudos": GuiaEstudos,
    "Home": Home,
    "LogicCourse": LogicCourse,
    "MathCourse": MathCourse,
    "MyDoubts": MyDoubts,
    "NotebookStats": NotebookStats,
    "Notebooks": Notebooks,
    "Notes": Notes,
    "PaymentHistory": PaymentHistory,
    "PerformanceReports": PerformanceReports,
    "Profile": Profile,
    "Questions": Questions,
    "Ranking": Ranking,
    "ResetPassword": ResetPassword,
    "SDAdmin": SDAdmin,
    "SavedContests": SavedContests,
    "Schedule": Schedule,
    "SimuladosDigital": SimuladosDigital,
    "SimulationHistory": SimulationHistory,
    "SimulationReview": SimulationReview,
    "SolveNotebook": SolveNotebook,
    "SolveSimulation": SolveSimulation,
    "Statistics": Statistics,
    "Studies": Studies,
    "StudyPlans": StudyPlans,
    "Subscription": Subscription,
    "ViewStudyPlan": ViewStudyPlan,
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