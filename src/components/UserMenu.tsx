import { useState } from "react";
import type { AuthUserBasicDto } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

interface UserMenuProps {
  user: AuthUserBasicDto;
  onLogout?: () => void;
}

/**
 * User menu dropdown component
 * Displays user information and provides navigation to profile and logout
 */
export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior - call logout API
      setIsLoggingOut(true);

      try {
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Logout endpoint returns 204 No Content on success
        if (response.ok || response.status === 204) {
          // Redirect to login page
          window.location.href = "/auth/login";
        } else {
          console.error("Logout failed:", response.status);
          // Still redirect to login page even if logout fails
          window.location.href = "/auth/login";
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Still redirect to login page even on error
        window.location.href = "/auth/login";
      }
    }
  };

  const handleProfileClick = () => {
    // Navigate to profile page
    window.location.href = "/profile";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          aria-label="User menu"
          disabled={isLoggingOut}
        >
          <User className="h-5 w-5" />
          <span className="hidden sm:inline">{user.email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Account</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
