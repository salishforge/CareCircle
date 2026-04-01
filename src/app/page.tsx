import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  UtensilsCrossed,
  Heart,
  Shield,
  MessageCircle,
  Pill,
  Users,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "24/7 Shift Coordination",
    description: "Schedule caregivers around the clock with check-in tracking and escalation alerts.",
    color: "bg-sage/10 text-sage-dark",
  },
  {
    icon: UtensilsCrossed,
    title: "Meal Planning",
    description: "Plan meals, track nutrition, and let community members sign up to bring food.",
    color: "bg-amber/10 text-amber-dark",
  },
  {
    icon: Heart,
    title: "Wellness Tracking",
    description: "Daily mood, energy, pain, and sleep journals with trend visualization.",
    color: "bg-coral/10 text-coral-dark",
  },
  {
    icon: Pill,
    title: "Medication Management",
    description: "Track medications, log doses, and receive reminders so nothing is missed.",
    color: "bg-teal/10 text-teal-600",
  },
  {
    icon: MessageCircle,
    title: "AI Care Assistant",
    description: "Ask questions about schedules, meals, and care tasks with an always-available assistant.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shield,
    title: "Safety & Escalation",
    description: "Automatic 3-level escalation when caregivers are late, with SMS alerts to the whole team.",
    color: "bg-red-50 text-red-700",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
          <span className="text-lg font-bold text-primary tracking-tight">
            CareCircle
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>
              Sign In
            </Button>
            <Button size="sm" render={<Link href="/register" />}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
            <Users className="h-4 w-4" />
            Community-powered care
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Coordinate care for your loved one,{" "}
            <span className="text-primary">together</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Organize 24/7 caregiving shifts, meal plans, medications, and daily
            logistics with your family and community — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Button size="lg" render={<Link href="/register" />}>
              Start Your Care Circle
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg" render={<Link href="#features" />}>
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything your care team needs</h2>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              From scheduling shifts to tracking meals and medications — built for
              families navigating cancer care, chronic illness, and elder care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${feature.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="text-muted-foreground mt-2">
            Create your care circle in minutes and invite your team.
          </p>
          <Button size="lg" className="mt-6" render={<Link href="/register" />}>
            Create Your Care Circle
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-semibold text-primary">CareCircle</span>
          <span>Built with care for caregivers</span>
        </div>
      </footer>
    </div>
  );
}
