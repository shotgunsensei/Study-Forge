import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/app-layout";
import { MarketingLayout } from "@/components/marketing-layout";

// Pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Pricing from "@/pages/pricing";
import Dashboard from "@/pages/dashboard";
import StudySets from "@/pages/study-sets";
import StudySetNew from "@/pages/study-sets-new";
import StudySetDetail from "@/pages/study-set-detail";
import StudySetFlashcards from "@/pages/study-set-flashcards";
import StudySetQuiz from "@/pages/study-set-quiz";
import StudySetReview from "@/pages/study-set-review";
import StudySetPlan from "@/pages/study-set-plan";
import Exams from "@/pages/exams";
import Account from "@/pages/account";
import Admin from "@/pages/admin";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
              <Switch>
                <Route path="/">
                  <MarketingLayout><Landing /></MarketingLayout>
                </Route>
                <Route path="/login">
                  <MarketingLayout><Login /></MarketingLayout>
                </Route>
                <Route path="/signup">
                  <MarketingLayout><Signup /></MarketingLayout>
                </Route>
                <Route path="/pricing">
                  <MarketingLayout><Pricing /></MarketingLayout>
                </Route>
                <Route path="/terms">
                  <MarketingLayout><Terms /></MarketingLayout>
                </Route>
                <Route path="/privacy">
                  <MarketingLayout><Privacy /></MarketingLayout>
                </Route>
                
                <Route path="/app" nest>
                  <AppLayout>
                    <Switch>
                      <Route path="/" component={Dashboard} />
                      <Route path="/sets" component={StudySets} />
                      <Route path="/sets/new" component={StudySetNew} />
                      <Route path="/sets/:id" component={StudySetDetail} />
                      <Route path="/sets/:id/flashcards" component={StudySetFlashcards} />
                      <Route path="/sets/:id/quiz" component={StudySetQuiz} />
                      <Route path="/sets/:id/review" component={StudySetReview} />
                      <Route path="/sets/:id/plan" component={StudySetPlan} />
                      <Route path="/exams" component={Exams} />
                      <Route path="/account" component={Account} />
                      <Route path="/admin" component={Admin} />
                      <Route component={NotFound} />
                    </Switch>
                  </AppLayout>
                </Route>

                <Route component={NotFound} />
              </Switch>
            </WouterRouter>
            <Toaster />
            <SonnerToaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;