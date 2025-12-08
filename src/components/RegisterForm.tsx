import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

interface RegisterFormProps {
  /**
   * Callback function to handle form submission
   * Will receive email and password as parameters
   */
  onSubmit?: (email: string, password: string) => void | Promise<void>;
}

/**
 * RegisterForm component for user registration
 * Provides email, password, and confirm password input fields with validation
 */
export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);

      // Basic validation
      if (!email || !password || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }

      if (!email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      if (!/[a-z]/.test(password)) {
        setError("Password must contain at least one lowercase letter");
        return;
      }

      if (!/[A-Z]/.test(password)) {
        setError("Password must contain at least one uppercase letter");
        return;
      }

      if (!/[0-9]/.test(password)) {
        setError("Password must contain at least one number");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setIsSubmitting(true);

      try {
        // Call the onSubmit callback if provided, otherwise use default API call
        if (onSubmit) {
          await onSubmit(email, password);
        } else {
          // Default: Call signup API endpoint
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 409) {
              throw new Error("An account with this email already exists");
            }
            // Extract validation error messages if available
            if (errorData.error?.details?.validationErrors) {
              const validationMessages = errorData.error.details.validationErrors
                .map((err: { message: string }) => err.message)
                .join(". ");
              throw new Error(validationMessages || "Validation failed");
            }
            throw new Error(errorData.error?.message || errorData.message || "Registration failed");
          }

          // Redirect to activities page on success
          window.location.href = "/activities";
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, confirmPassword, onSubmit]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Enter your details to create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                minLength={8}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>

          {/* Links */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/auth/login" className="text-primary hover:underline">
              Sign in
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
