import { Outlet, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { PieChart, ListChecks, Wallet, CheckSquare } from 'lucide-react';
import { ExpenseProvider } from '@/hooks/use-expense';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';

const MOBILE_NAV = [
  { path: '/', label: '总览', icon: PieChart },
  { path: '/records', label: '记录', icon: ListChecks },
  { path: '/budget', label: '预算', icon: Wallet },
  { path: '/progress', label: '进度', icon: CheckSquare },
];

export const Layout = () => {
  const { pathname } = useLocation();

  return (
    <ExpenseProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col">
        <Header />
        <main className="flex-1 w-full">
          <Outlet />
        </main>
        {/* 移动端底部导航 */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50">
          <div className="flex items-center justify-around py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
            {MOBILE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="size-5" />
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
        <Toaster />
      </div>
    </ExpenseProvider>
  );
};
