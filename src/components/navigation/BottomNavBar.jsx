import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, FileText, User, BookCopy, BookOpen, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: 'Painel', url: createPageUrl('Dashboard'), icon: Home, feature: null },
  { name: 'Questões', url: createPageUrl('Questions'), icon: FileText, feature: null },
  { name: 'Provas', url: createPageUrl('Exams'), icon: BookCopy, feature: null },
  { name: 'Resumos', url: createPageUrl('ComoEstudarPrimeiroLugar'), icon: BookOpen, feature: 'Resumos' },
  { name: 'Área de Estudos', url: createPageUrl('Studies'), icon: BookOpen, feature: 'Área de Estudos' }
];

export default function BottomNavBar({ userPlan, checkAccess, isAdmin, className }) {
  const location = useLocation();

  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50",
      className
    )}>
      <div className="flex items-center h-16 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {navItems.map((item) => {
          const hasAccess = isAdmin || (item.feature ? checkAccess(item.feature, userPlan) : true);
          const isCurrentPage = location.pathname === item.url;

          return (
            <Link
              key={item.name}
              to={hasAccess ? item.url : createPageUrl("Subscription")}
              className={`flex flex-col items-center justify-center min-w-[70px] px-2 transition-colors duration-200 relative ${
                isCurrentPage
                  ? 'dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              style={isCurrentPage ? { color: 'var(--primary-color)' } : {}} 
              onMouseEnter={(e) => {
                if (!isCurrentPage) e.currentTarget.style.color = 'var(--primary-color)'; 
              }}
              onMouseLeave={(e) => {
                if (!isCurrentPage) e.currentTarget.style.color = '';
              }}
            >
              {!hasAccess && item.feature && <Lock className="absolute top-1 right-3 w-3 h-3 text-yellow-500" />}
              <item.icon style={{ width: 'var(--icon-size, 1.5rem)', height: 'var(--icon-size, 1.5rem)' }} className="mb-1" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}