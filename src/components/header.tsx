"use client";

import { useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Sidebar } from "@/components/sidebar";
import { UserMenu } from "@/components/user-menu/user-menu";
import { useAppSession, useUser } from "@/contexts";

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile, isLoading } = useUser();
  const session = useAppSession();

  console.log("Header rendered session: ", session);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#344767] shadow-sm border-b border-[#2d3a5f]">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left side - Hamburger menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-white hover:text-gray-200 hover:bg-[#2d3a5f] focus:outline-none focus:ring-2 focus:ring-blue-300"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Center - App title */}
          <h1 className="text-lg font-semibold text-white truncate">
            {process.env.NEXT_PUBLIC_APP_NAME || "Pastor App"}
          </h1>

          {/* Right side - User avatar */}
          <div className="relative">
            {!isLoading && userProfile ? (
              <UserMenu userProfile={userProfile}>
                <button
                  className="p-1 rounded-full text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="User menu"
                  title={
                    userProfile?.First_Name && userProfile?.Last_Name
                      ? `${userProfile.First_Name} ${userProfile.Last_Name}`
                      : session?.user?.name ||
                        session?.user?.email ||
                        "User menu"
                  }
                >
                  {userProfile?.Image_GUID ? (
                    <Image
                      src={`${process.env.NEXT_PUBLIC_MINISTRY_PLATFORM_FILE_URL}/${userProfile.Image_GUID}?$thumbnail=true`}
                      alt={
                        userProfile.First_Name && userProfile.Last_Name
                          ? `${userProfile.First_Name} ${userProfile.Last_Name}`
                          : "User avatar"
                      }
                      width={32}
                      height={32}
                      className="rounded-full object-cover border-2 border-white"
                      unoptimized
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-white" />
                  )}
                </button>
              </UserMenu>
            ) : (
              <button
                className="p-1 rounded-full text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="User menu"
                disabled={isLoading}
              >
                <UserCircleIcon className="h-8 w-8 text-white" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Animated backdrop for sidebar */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-40 ${
          sidebarOpen
            ? "opacity-30 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
}
