'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  MagnifyingGlassIcon,
  PhotoIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  CalendarIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  HomeModernIcon,
  BoltIcon,
  UsersIcon,
  TrophyIcon,
  ViewColumnsIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { logout, getUser } from '@/lib/auth';

// Grouped navigation structure
const navGroups = [
  {
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ]
  },
  {
    label: 'Sales',
    items: [
      { name: 'Leads', href: '/dashboard/leads', icon: UserGroupIcon },
      { name: 'Pipeline', href: '/dashboard/pipeline', icon: ViewColumnsIcon },
      { name: 'Campaigns', href: '/dashboard/campaigns', icon: BoltIcon },
    ]
  },
  {
    label: 'Schedule',
    items: [
      { name: 'Calendar', href: '/dashboard/calendar', icon: CalendarIcon },
      { name: 'Open Houses', href: '/dashboard/open-house', icon: HomeModernIcon },
    ]
  },
  {
    label: 'Team',
    items: [
      { name: 'My Team', href: '/dashboard/team', icon: TrophyIcon },
      { name: 'Vendors', href: '/dashboard/vendors', icon: UsersIcon },
    ]
  },
  {
    label: 'Finance',
    items: [
      { name: 'Commission', href: '/dashboard/commission', icon: CurrencyDollarIcon },
      { name: 'Expenses', href: '/dashboard/expenses', icon: CalculatorIcon },
    ]
  },
  {
    label: 'Tools',
    items: [
      { name: 'The Hunter', href: '/dashboard/hunter', icon: MagnifyingGlassIcon },
      { name: 'Listing Launchpad', href: '/dashboard/launchpad', icon: PhotoIcon },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = getUser();
  
  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || '?';
  
  return (
    <div className="flex flex-col w-64 glass dark:glass-dark border-r border-white/20 dark:border-white/10 shadow-xl">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
          AgentAssist
        </h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {/* Group Label */}
            {group.label && (
              <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            
            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Settings - always at bottom of nav */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Link
            href="/dashboard/settings"
            className={`
              flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
              ${pathname === '/dashboard/settings'
                ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <Cog6ToothIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            Settings
          </Link>
        </div>
      </nav>
      
      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center px-2">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
            {userInitials}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
