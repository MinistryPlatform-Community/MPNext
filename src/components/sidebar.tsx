"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { HomeIcon, UsersIcon } from "@heroicons/react/24/outline";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Contact Lookup", href: "/contactlookup", icon: UsersIcon },
  // { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
  // { name: 'Settings', href: '/settings', icon: CogIcon },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <div
      className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#344767] shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#2d3a5f]">
        <h2 className="text-lg font-semibold text-white">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-white hover:text-gray-200 hover:bg-[#2d3a5f]"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <nav className="mt-4">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-[#2d3a5f] hover:text-gray-200"
                onClick={onClose}
              >
                <item.icon className="mr-3 h-5 w-5 text-white" />
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
