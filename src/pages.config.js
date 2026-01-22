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
import GuiaEstudos from './pages/GuiaEstudos';
import Home from './pages/Home';
import LogicCourse from './pages/LogicCourse';
import MathCourse from './pages/MathCourse';
import MyDoubts from './pages/MyDoubts';
import NotebookStats from './pages/NotebookStats';
import Notebooks from './pages/Notebooks';
import Notes from './pages/Notes';
import PerformanceReports from './pages/PerformanceReports';
import Profile from './pages/Profile';
import Questions from './pages/Questions';
import Ranking from './pages/Ranking';
import SDAdmin from './pages/SDAdmin';
import SavedContests from './pages/SavedContests';
import Schedule from './pages/Schedule';
import SimuladosDigital from './pages/SimuladosDigital';
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
import ResetPassword from './pages/ResetPassword';
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
    "GuiaEstudos": GuiaEstudos,
    "Home": Home,
    "LogicCourse": LogicCourse,
    "MathCourse": MathCourse,
    "MyDoubts": MyDoubts,
    "NotebookStats": NotebookStats,
    "Notebooks": Notebooks,
    "Notes": Notes,
    "PerformanceReports": PerformanceReports,
    "Profile": Profile,
    "Questions": Questions,
    "Ranking": Ranking,
    "SDAdmin": SDAdmin,
    "SavedContests": SavedContests,
    "Schedule": Schedule,
    "SimuladosDigital": SimuladosDigital,
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
    "ResetPassword": ResetPassword,
}

export const pagesConfig = {
    mainPage: "Questions",
    Pages: PAGES,
    Layout: __Layout,
};