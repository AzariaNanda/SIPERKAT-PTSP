import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'room';
}

const variantStyles = {
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  room: 'bg-room text-room-foreground',
};

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description,
  variant = 'primary' 
}: StatCardProps) => {
  return (
    <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="flex">
          <div className={cn("p-6 flex items-center justify-center", variantStyles[variant])}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1 p-6">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
