import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, User, LogOut, Settings, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import LanguageThemeSwitcher from '@/components/LanguageThemeSwitcher';
import NotificationPanel from '@/components/NotificationPanel';

interface HeaderProps {
  sidebarCollapsed: boolean;
  onMenuClick: () => void;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

  let currentPath = '';
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Handle dynamic segments
    if (segment.startsWith('P') && segment.length === 4) {
      breadcrumbs.push({ label: `Patient ${segment}`, path: currentPath });
    } else if (segment.startsWith('V') && segment.length === 4) {
      breadcrumbs.push({ label: `Visit ${segment}` });
    } else {
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      const isLast = index === paths.length - 1;
      breadcrumbs.push({ 
        label, 
        path: isLast ? undefined : currentPath 
      });
    }
  });

  return breadcrumbs;
};

const getPageTitle = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard';
  
  const paths = pathname.split('/').filter(Boolean);
  const lastSegment = paths[paths.length - 1];
  
  if (lastSegment.startsWith('P') && lastSegment.length === 4) {
    return 'Patient Details';
  }
  if (lastSegment.startsWith('V') && lastSegment.length === 4) {
    return 'Visit Details';
  }
  
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
};

const Header: React.FC<HeaderProps> = ({ sidebarCollapsed, onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const breadcrumbs = getBreadcrumbs(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header 
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 transition-all duration-300",
        sidebarCollapsed ? "left-16" : "left-64"
      )}
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="page-header mb-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm mb-1">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                {crumb.path ? (
                  <Link to={crumb.path} className="breadcrumb-link">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
          
          {/* Page Title */}
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Language & Theme Switcher */}
        <LanguageThemeSwitcher />

        {/* Notifications */}
        <NotificationPanel />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Staff'}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
