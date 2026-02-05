'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  EnvelopeIcon, 
  MagnifyingGlassIcon,
  PhotoIcon,
  Cog6ToothIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Pending Approvals', href: '/dashboard/messages', icon: EnvelopeIcon, badge: true },
  { name: 'The Hunter', href: '/dashboard/hunter', icon: MagnifyingGlassIcon },
  { name: 'Listing Launchpad', href: '/dashboard/launchpad', icon: PhotoIcon },
  { name: 'Team', href: '/dashboard/team', icon: UserGroupIcon },
  { name: 'Settings', href: '/settings/crm', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          AgentAssist
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
              {item.badge && (
                <span className="ml-auto bg-danger-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  3
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
            RA
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Real Agent
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pro Plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
