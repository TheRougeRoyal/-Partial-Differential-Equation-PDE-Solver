import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calculator, 
  Activity, 
  Table, 
  Menu, 
  X, 
  Upload,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/greeks', label: 'Greeks', icon: Calculator },
  { path: '/backtest', label: 'Backtest', icon: TrendingUp },
  { path: '/live', label: 'Live Monitor', icon: Activity },
  { path: '/data', label: 'Data Explorer', icon: Table },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className="flex items-center gap-2">
            <LineChart className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">OCaml Quant Dashboard</h1>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <Link to="/data">
              <Button variant="default" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload CSV</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background pt-14 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:pt-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col gap-2 p-4">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3',
                        isActive && 'bg-secondary'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
            
            <Separator className="my-2" />
            
            <div className="mt-auto text-xs text-muted-foreground p-2">
              <p>OCaml Quant Dashboard v1.0</p>
              <p className="mt-1">Bridge: localhost:3001</p>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
