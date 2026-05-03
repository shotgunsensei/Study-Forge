import { useCreateCheckoutSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function Pricing() {
  useDocumentMeta("Pricing");
  const checkout = useCreateCheckoutSession();

  const handleUpgrade = async (plan: "pro" | "tutor") => {
    try {
      const res = await checkout.mutateAsync({ data: { plan } });
      if (res.demoMode) {
        toast.info(res.message);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      toast.error("Failed to initiate checkout");
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-muted-foreground">Upgrade your study game with powerful AI tools.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Free</CardTitle>
            <CardDescription>Perfect to try out the forge</CardDescription>
            <div className="mt-4 text-4xl font-bold">$0<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 3 Study Sets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Basic Flashcards</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 5 Quiz Attempts</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>Current Plan</Button>
          </CardFooter>
        </Card>

        <Card className="border-primary shadow-lg shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-lg">POPULAR</div>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Pro</CardTitle>
            <CardDescription>For serious students</CardDescription>
            <div className="mt-4 text-4xl font-bold">$9.99<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited Study Sets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced Flashcards</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Unlimited Quizzes</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Study Planner</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleUpgrade("pro")} disabled={checkout.isPending}>
              {checkout.isPending ? "Loading..." : "Upgrade to Pro"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tutor</CardTitle>
            <CardDescription>For educators & groups</CardDescription>
            <div className="mt-4 text-4xl font-bold">$29<span className="text-xl font-normal text-muted-foreground">/mo</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Everything in Pro</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Export & Share Sets</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Student Analytics</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Support</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => handleUpgrade("tutor")} disabled={checkout.isPending}>
              Upgrade to Tutor
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}