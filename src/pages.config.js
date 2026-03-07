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
import Calendar from './pages/Calendar';
import CreateNotebook from './pages/CreateNotebook';
import CreateSimulation from './pages/CreateSimulation';
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
import MyDoubts from './pages/MyDoubts';
import Schedule from './pages/Schedule';
import SolveNotebook from './pages/SolveNotebook';
import SolveSimulation from './pages/SolveSimulation';
import SimuladosDigital from './pages/SimuladosDigital';
import Notebooks from './pages/Notebooks';
import ViewStudyPlan from './pages/ViewStudyPlan';
import Welcome from './pages/Welcome';
import studies from './pages/studies';
import subscription from './pages/subscription';
import Exams from './pages/Exams';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';
import GuiaEstudos from './pages/GuiaEstudos';
import Notes from './pages/Notes';
import PerformanceReports from './pages/PerformanceReports';
import Ranking from './pages/Ranking';
import Statistics from './pages/Statistics';
import Reviews from './pages/Reviews';
import SimulationReview from './pages/SimulationReview';
import ComoEstudarPrimeiroLugar from './pages/ComoEstudarPrimeiroLugar';
import Studies from './pages/Studies';
import SubscriptionsDashboard from './pages/SubscriptionsDashboard';
import Community from './pages/Community';
import StudyPlans from './pages/StudyPlans';
import People from './pages/People';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import CreateStudyPlan from './pages/CreateStudyPlan';
import UserProfile from './pages/UserProfile';
import EditalSimulator from './pages/EditalSimulator';
import EditalVerticalizado from './pages/EditalVerticalizado';
import SavedContests from './pages/SavedContests';
import ActivityFeed from './pages/ActivityFeed';
import SimulationHistory from './pages/SimulationHistory';
import ExamView from './pages/ExamView';
import Flashcards from './pages/Flashcards';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AssistirAula": AssistirAula,
    "Calendar": Calendar,
    "CreateNotebook": CreateNotebook,
    "CreateSimulation": CreateSimulation,
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
    "MyDoubts": MyDoubts,
    "Schedule": Schedule,
    "SolveNotebook": SolveNotebook,
    "SolveSimulation": SolveSimulation,
    "SimuladosDigital": SimuladosDigital,
    "Notebooks": Notebooks,
    "ViewStudyPlan": ViewStudyPlan,
    "Welcome": Welcome,
    "studies": studies,
    "subscription": subscription,
    "Exams": Exams,
    "Dashboard": Dashboard,
    "Subscription": Subscription,
    "GuiaEstudos": GuiaEstudos,
    "Notes": Notes,
    "PerformanceReports": PerformanceReports,
    "Ranking": Ranking,
    "Statistics": Statistics,
    "Reviews": Reviews,
    "SimulationReview": SimulationReview,
    "ComoEstudarPrimeiroLugar": ComoEstudarPrimeiroLugar,
    "Studies": Studies,
    "SubscriptionsDashboard": SubscriptionsDashboard,
    "Community": Community,
    "StudyPlans": StudyPlans,
    "People": People,
    "Admin": Admin,
    "Profile": Profile,
    "CreateStudyPlan": CreateStudyPlan,
    "UserProfile": UserProfile,
    "EditalSimulator": EditalSimulator,
    "EditalVerticalizado": EditalVerticalizado,
    "SavedContests": SavedContests,
    "ActivityFeed": ActivityFeed,
    "SimulationHistory": SimulationHistory,
    "ExamView": ExamView,
    "Flashcards": Flashcards,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};