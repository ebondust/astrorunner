import { useState, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ResetPasswordFormProps {
  /**
   * Callback function to handle form submission
   * Will receive email as parameter
   */
  onSubmit?: (email: string) => void | Promise<void>;
}

/**
 * ResetPasswordForm component for password recovery
 * Provides email input field to request password reset
 */
export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      // Basic validation
      if (!email) {
        setError("Please enter your email address");
        return;
      }

      if (!email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      setIsSubmitting(true);

      try {
        // Call the onSubmit callback if provided
        if (onSubmit) {
          await onSubmit(email);
        }
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, onSubmit]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          {success
            ? "Check your email for a password reset link"
            : "Enter your email address and we'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
              <a href="/auth/login" className="text-sm text-primary hover:underline">
                Back to sign in
              </a>
            </div>
          </div>
        ) : (
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

            {/* Error Message */}
            {error && (
              <div className="text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>

            {/* Links */}
            <div className="space-y-2 text-center text-sm">
              <div>
                <a href="/auth/login" className="text-primary hover:underline">
                  Back to sign in
                </a>
              </div>
              <div className="text-muted-foreground">
                Don't have an account?{" "}
                <a href="/auth/register" className="text-primary hover:underline">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
