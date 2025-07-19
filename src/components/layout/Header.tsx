import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-lab-blue font-bold text-xl">Semiconductor Physics VLab</span>
        </Link>

        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col space-y-4 mt-8">
                <Link to="/" className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
                  Home
                </Link>
                <Link
                  to="/lab"
                  className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  All Experiments
                </Link>
                <Link
                  to="/about"
                  className="px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  About VLab
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <nav className="flex items-center space-x-6">
            <Link to="/" className={cn('text-sm font-medium transition-colors hover:text-primary')}>
              Home
            </Link>
            <Link
              to="/lab"
              className={cn('text-sm font-medium transition-colors hover:text-primary')}
            >
              All Experiments
            </Link>
            <Link
              to="/about"
              className={cn('text-sm font-medium transition-colors hover:text-primary')}
            >
              About VLab
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
