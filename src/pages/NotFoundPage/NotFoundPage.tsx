import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center">
        <div className="text-6xl font-bold text-primary mb-2">404</div>
        <h1 className="text-xl font-semibold text-foreground mb-2">页面不存在</h1>
        <p className="text-muted-foreground mb-6">你访问的页面不存在或已被移动</p>
        <Link to="/">
          <Button>
            <Home className="size-4" />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
