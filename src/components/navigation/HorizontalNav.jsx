
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Home, 
  FileText, 
  BarChart3, 
  Calendar,
  Trophy,
  Shield,
  Star
} from 'lucide-react';
import { User } from "@/entities/User";

export default function HorizontalNav() {
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        console.error("User not loaded:", error);
      }
    };
    loadUser();
  }, []);

  const isAdmin = user && user.email === 'conectadoemconcursos@gmail.com';

  const navigationItems = [
    {
      title: "Dashboard",
      url: createPageUrl("Dashboard"),
      icon: Home,
    },
    {
      title: "Questões",
      url: createPageUrl("Questions"),
      icon: FileText,
    },
    {
      title: "Cronograma",
      url: createPageUrl("Schedule"),
      icon: Calendar,
    },
    {
      title: "Ranking",
      url: createPageUrl("Ranking"),
      icon: Trophy,
    },
    {
      title: "Estatísticas",
      url: createPageUrl("Statistics"),
      icon: BarChart3,
    },
    {
      title: "Planos",
      url: createPageUrl("Subscription"),
      icon: Star,
    },
  ];

  if (!user) {
    return null; // Don't render anything if user is not loaded
  }

  return (
    <div className="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {navigationItems.map((item) => (
          <Link 
            key={item.title}
            to={item.url}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              location.pathname === item.url
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-600 hover:text-blue-700 dark:hover:text-blue-300'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span className="font-medium text-sm">{item.title}</span>
          </Link>
        ))}
        {isAdmin && (
          <Link 
            to={createPageUrl("Admin")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              location.pathname === createPageUrl("Admin")
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-gray-600 hover:text-red-700 dark:hover:text-red-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span className="font-medium text-sm">Admin</span>
          </Link>
        )}
      </div>
    </div>
  );
}
