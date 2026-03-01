import React, { useState, useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { base44 } from "@/api/base44Client";

let staffPromise = null;

const fetchStaff = () => {
  if (!staffPromise) {
    staffPromise = base44.functions.invoke('getStaffUsers')
      .then(res => res.data?.staff || {})
      .catch((err) => {
        console.error("Failed to load staff roles", err);
        return {};
      });
  }
  return staffPromise;
};

export function StaffBadge({ email, role, className = "" }) {
  const [inferredRole, setInferredRole] = useState(role);

  useEffect(() => {
    if (!role && email) {
      let isMounted = true;
      fetchStaff().then(staffMap => {
        if (isMounted && staffMap[email]) {
          setInferredRole(staffMap[email]);
        }
      });
      return () => { isMounted = false; };
    }
  }, [email, role]);

  if (!inferredRole || (inferredRole !== 'admin' && inferredRole !== 'moderator')) {
    return null;
  }

  const tooltipText = inferredRole === 'admin' 
    ? "Perfil oficial — Administrador do site" 
    : "Perfil oficial — Moderador do site";

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center justify-center text-blue-500 transition-colors cursor-pointer ${className}`}>
             <BadgeCheck className="w-4 h-4 fill-blue-50" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-900 text-white border-slate-800 text-xs px-2 py-1 z-50">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}