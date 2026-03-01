import { Badge } from '@/components/ui/badge';

export default function NotificationBadge({ count, className = '' }) {
  if (!count || count === 0) return null;

  return (
    <Badge 
      className={`absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}