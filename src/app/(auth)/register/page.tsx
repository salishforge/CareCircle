"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "credentials" | "profile" | "role";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    role: "CAREGIVER",
  });

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCredentialsStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setStep("profile");
  }

  async function handleProfileStep(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setStep("role");
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const stepLabels = { credentials: "Account", profile: "Profile", role: "Role" };
  const steps: Step[] = ["credentials", "profile", "role"];

  return (
    <Card className="shadow-lg border-0 bg-card">
      <CardContent className="pt-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  steps.indexOf(step) >= i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {stepLabels[s]}
              </span>
              {i < steps.length - 1 && (
                <div className="w-8 h-0.5 bg-muted" />
              )}
            </div>
          ))}
        </div>

        {step === "credentials" && (
          <form onSubmit={handleCredentialsStep} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                required
                autoComplete="new-password"
                className="h-12"
              />
            </div>
            {error && <p className="text-sm text-coral">{error}</p>}
            <Button type="submit" className="w-full h-12 text-base font-semibold">
              Continue
            </Button>
          </form>
        )}

        {step === "profile" && (
          <form onSubmit={handleProfileStep} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                autoFocus
                autoComplete="name"
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                For shift reminders and check-in notifications
              </p>
            </div>
            {error && <p className="text-sm text-coral">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("credentials")}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1 h-12 text-base font-semibold">
                Continue
              </Button>
            </div>
          </form>
        )}

        {step === "role" && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Your Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => v && updateField("role", v)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIMARY_CAREGIVER">
                    Primary Caregiver
                  </SelectItem>
                  <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                  <SelectItem value="MEAL_PROVIDER">Meal Provider</SelectItem>
                  <SelectItem value="PATIENT">Patient</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This determines what you see in the app. You can change it later.
              </p>
            </div>
            {error && <p className="text-sm text-coral">{error}</p>}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("profile")}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-center pb-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
