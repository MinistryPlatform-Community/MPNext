"use client";

import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { MPUserProfile } from "@/lib/providers/ministry-platform/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  onClose?: () => void;
  userProfile: MPUserProfile;
  children: React.ReactNode; // This will be the trigger element (e.g., user avatar/button)
}

const userMenuItems = [
  // { name: 'Profile', href: '/profile', icon: UserIcon },
  // { name: 'Settings', href: '/settings', icon: CogIcon },
  {
    name: "Sign out",
    href: "/api/auth/signout",
    icon: ArrowRightOnRectangleIcon,
  },
];

export function UserMenu({ onClose, userProfile, children }: UserMenuProps) {
  const handleItemClick = (href: string) => {
    if (onClose) {
      onClose();
    }
    // Navigate to the href
    window.location.href = href;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 bg-[#344767] border-[#344767]"
        align="end"
      >
        <DropdownMenuLabel className="text-white">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-white">
              {userProfile.Nickname || userProfile.First_Name}{" "}
              {userProfile.Last_Name}
            </p>
            <p className="text-sm text-gray-300">{userProfile.Email_Address}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-500" />
        {userMenuItems.map((item) => (
          <DropdownMenuItem
            key={item.name}
            onClick={() => handleItemClick(item.href)}
            className="cursor-pointer text-white hover:bg-[#2d3a5f] focus:bg-[#2d3a5f]"
          >
            <item.icon className="mr-2 h-4 w-4 text-white" />
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
