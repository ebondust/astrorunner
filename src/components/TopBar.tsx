import type { AuthUserBasicDto } from "@/types";
import { UserMenu } from "./UserMenu";

interface TopBarProps {
  user: AuthUserBasicDto;
  onLogout?: () => void;
}

/**
 * Top navigation bar component
 * Displays logo/branding on the left and user menu on the right
 */
export function TopBar({ user, onLogout }: TopBarProps) {
  return (
    <nav className="flex h-16 items-center justify-between px-4 md:px-6" aria-label="Main navigation">
      {/* Logo / Branding */}
      <div className="flex items-center">
        <a
          href="/activities"
          className="flex items-center gap-2 text-lg font-semibold transition-colors hover:opacity-80"
          aria-label="Go to activities page"
        >
          <img src="/logo.png" alt="Activity Logger" className="h-8 w-auto" />
          <span className="hidden sm:inline">Activity Logger</span>
        </a>
      </div>

      {/* User Menu */}
      <div className="flex items-center">
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
}
