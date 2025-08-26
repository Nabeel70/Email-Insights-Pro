'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Mail, 
  UserX, 
  Download, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Unsubscribes', href: '/unsubscribes', icon: UserX },
  { name: 'Exports', href: '/exports', icon: Download },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-background border-r border-border w-64 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary">Email Insights Pro</h1>
      </div>
      
      <div className="flex-1 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </nav>
  );
}
