import { useDocumentMeta } from "@/hooks/use-document-meta";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Brain, Zap, Target } from "lucide-react";

export default function Landing() {
  useDocumentMeta("Your Notes, Forged Into Study Weapons");

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-24 lg:py-32 flex flex-col items-center text-center px-4">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-8">
          The ultimate study companion
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mb-6">
          Your Notes, Forged Into <span className="text-primary">Study Weapons</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
          Paste your messy notes, lectures, or textbook chapters. Get back perfect flashcards, quizzes, review sheets, and a personalized study plan in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
              Create Your First Study Set
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
              View Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="w-full py-24 bg-card border-t border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to ace your next exam</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-background p-6 rounded-xl border border-border/40 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Smart Flashcards</h3>
              <p className="text-muted-foreground">Automatically generated spaced repetition flashcards that focus on your weak points.</p>
            </div>
            <div className="bg-background p-6 rounded-xl border border-border/40 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Instant Quizzes</h3>
              <p className="text-muted-foreground">Test your knowledge with AI-generated multiple choice and short answer questions.</p>
            </div>
            <div className="bg-background p-6 rounded-xl border border-border/40 flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-2">Custom Study Plans</h3>
              <p className="text-muted-foreground">Get a structured daily checklist breaking down exactly what to study and when.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}