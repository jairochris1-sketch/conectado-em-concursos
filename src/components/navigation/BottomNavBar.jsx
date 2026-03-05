import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, FileText, User, BookCopy, BookOpen, Lock, Trophy, MessageSquare, BarChart3, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: 'Planos', url: createPageUrl('Subscription'), icon: CreditCard, feature: null, color: "text-yellow-500", fill: "fill-yellow-500/20" },
  { name: 'Painel', url: createPageUrl('Dashboard'), icon: Home, feature: null, color: "text-blue-500", fill: "fill-blue-500/20" },
  { name: 'Questões', url: createPageUrl('Questions'), icon: FileText, feature: null, color: "text-emerald-500", fill: "fill-emerald-500/20" },
  { name: 'Provas', url: createPageUrl('Exams'), icon: BookCopy, feature: null, color: "text-amber-500", fill: "fill-amber-500/20" },
  { name: 'Resumos', url: createPageUrl('ComoEstudarPrimeiroLugar'), icon: BookOpen, feature: 'Resumos', color: "text-pink-500", fill: "fill-pink-500/20" },
  { name: 'Área de Estudos', url: createPageUrl('Studies'), icon: BookOpen, feature: 'Área de Estudos', color: "text-cyan-500", fill: "fill-cyan-500/20" },
  { name: 'Ranking', url: createPageUrl('Ranking'), icon: Trophy, feature: 'Ranking de Usuários', color: "text-orange-500", fill: "fill-orange-500/20" },
  { name: 'Fórum', url: createPageUrl('Community'), icon: MessageSquare, feature: null, color: "text-green-500", fill: "fill-green-500/20" },
  { name: 'Relatórios', url: createPageUrl('PerformanceReports'), icon: BarChart3, feature: null, color: "text-indigo-500", fill: "fill-indigo-500/20" }
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
              className={`flex flex-col items-center justify-center min-w-[50px] px-0.5 transition-colors duration-200 relative ${
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
              <item.icon 
                style={{ width: '1.25rem', height: '1.25rem' }} 
                className={`mb-0.5 transition-all duration-300 ${item.color} ${isCurrentPage ? item.fill : 'fill-transparent opacity-80'}`} 
                strokeWidth={isCurrentPage ? 2 : 1.5}
              />
              <span className={`text-[9px] font-bold leading-tight text-center ${isCurrentPage ? item.color : 'text-gray-500 dark:text-gray-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}