"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { Sidebar } from "./sidebar";
import { UserMenu } from "@/components/user-menu";
import { useAppSession, useUser } from "@/contexts";

// The header is `fixed`, and `<main>` reserves its height with `mt-16`. Anything
// rendered in its place — a skeleton, a Suspense fallback — must be fixed and
// h-16 too, or content drops 64px while it shows and jumps back when it goes.
const HEADER_CLASS =
  "fixed top-0 left-0 right-0 z-50 bg-[#344767] shadow-sm border-b border-[#2d3a5f]";
const BAR_CLASS = "flex items-center justify-between h-16 px-4";
const HAMBURGER_CLASS =
  "p-2 rounded-md text-white hover:text-gray-200 hover:bg-[#2d3a5f] focus:outline-none focus:ring-2 focus:ring-blue-300";
const AVATAR_BUTTON_CLASS =
  "p-1 rounded-full text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300";

function AppTitle() {
  return (
    <h1 className="text-lg font-semibold text-white truncate">
      {process.env.NEXT_PUBLIC_APP_NAME || "MPNext"}
    </h1>
  );
}

/**
 * The avatar slot before the MP profile is available — while it loads, and for
 * a user MP has no profile for. Same 40px box as the loaded avatar.
 */
function AvatarPlaceholder() {
  return (
    <button className={AVATAR_BUTTON_CLASS} aria-label="User menu">
      <UserCircleIcon className="h-8 w-8 text-white" />
    </button>
  );
}

/**
 * The only part of the header that depends on the MP profile, so the only part
 * that suspends on it. Isolating it keeps the bar, hamburger and sidebar on
 * screen (and the sidebar's open state intact) while the profile loads.
 */
function HeaderAvatar() {
  const { userProfile } = useUser();
  const session = useAppSession();

  if (!userProfile) {
    return <AvatarPlaceholder />;
  }

  return (
    <UserMenu userProfile={userProfile}>
      <button
        className={AVATAR_BUTTON_CLASS}
        aria-label="User menu"
        title={
          userProfile.First_Name && userProfile.Last_Name
            ? `${userProfile.First_Name} ${userProfile.Last_Name}`
            : session?.user?.name ||
              // `session.user.email` is a synthetic per-user value
              // (see `syntheticEmailForSub` in src/lib/auth.ts); the
              // real MP address is the `mpEmail` additional field.
              (session?.user as { mpEmail?: string | null } | undefined)?.mpEmail ||
              "User menu"
        }
      >
        {userProfile.Image_GUID ? (
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
  );
}

/**
 * A static, pixel-identical stand-in for the header, for use as a Suspense
 * fallback. `Header` itself should never suspend (its avatar has its own
 * boundary), so this only guards against a future descendant that does.
 */
export function HeaderSkeleton() {
  return (
    <header className={HEADER_CLASS} aria-busy="true">
      <div className={BAR_CLASS}>
        <span className="p-2" aria-hidden="true">
          <Bars3Icon className="h-6 w-6 text-white" />
        </span>
        <AppTitle />
        <span className="p-1" aria-hidden="true">
          <UserCircleIcon className="h-8 w-8 text-white" />
        </span>
      </div>
    </header>
  );
}

export function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className={HEADER_CLASS}>
        <div className={BAR_CLASS}>
          {/* Left side - Hamburger menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={HAMBURGER_CLASS}
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* Center - App title */}
          <AppTitle />

          {/* Right side - User avatar */}
          <div className="relative">
            <Suspense fallback={<AvatarPlaceholder />}>
              <HeaderAvatar />
            </Suspense>
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
