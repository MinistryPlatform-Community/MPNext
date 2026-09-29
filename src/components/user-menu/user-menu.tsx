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
import { signOutEverywhere } from "./sign-out-button";

interface UserMenuProps {
  onClose?: () => void;
  /**
   * `null` when the MP profile didn't load (no `dp_Users` match, or MP
   * unreachable). The menu still renders — with sign-out — so a user whose
   * profile failed is never left with no way to sign out.
   */
  userProfile: MPUserProfile | null;
  children: React.ReactNode;
}

const userMenuItems = [
  {
    name: "Sign out",
    action: "signout",
    icon: ArrowRightOnRectangleIcon,
  },
];

export function UserMenu({ onClose, userProfile, children }: UserMenuProps) {
  const handleItemClick = async (action: string) => {
    if (onClose) {
      onClose();
    }
    if (action === "signout") {
      // `signOutEverywhere` re-throws Next's NEXT_REDIRECT signal (so a
      // successful sign-out still navigates), tells the other open tabs, and
      // returns a message only for a genuine failure.
      const message = await signOutEverywhere();
      if (message) alert(`Error: ${message}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-48 bg-[#344767] border-[#344767]"
        align="end"
      >
        <DropdownMenuLabel className="text-white">
          {userProfile ? (
            <div className="flex flex-col space-y-1">
              <p className="font-medium text-white">
                {userProfile.Nickname || userProfile.First_Name}{" "}
                {userProfile.Last_Name}
              </p>
              <p className="text-sm text-gray-300">{userProfile.Email_Address}</p>
            </div>
          ) : (
            <p className="text-sm font-normal text-gray-300">
              Your Ministry Platform profile couldn&apos;t be loaded.
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-500" />
        {userMenuItems.map((item) => (
          <DropdownMenuItem
            key={item.name}
            onClick={() => handleItemClick(item.action)}
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
