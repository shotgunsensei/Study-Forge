import { useGetBillingStatus, useCreateBillingPortal, useLogout } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Loader2, Settings, User, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function Account() {
  useDocumentMeta("Account Settings");
  const { user, refresh } = useAuth();
  const { data: billing, isLoading: billingLoading } = useGetBillingStatus();
  const portal = useCreateBillingPortal();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handlePortal = async () => {
    try {
      const res = await portal.mutateAsync();
      if (res.demoMode) {
        toast.info(res.message);
      } else if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      toast.error("Failed to open billing portal");
    }
  };

  const handleLogout = async () => {
    await logout.mutateAsync();
    refresh();
    setLocation("/");
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile and subscription.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
            <div className="text-lg">{user.name}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
            <div className="text-lg">{user.email}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Role</div>
            <div className="capitalize">{user.role}</div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t border-border py-4">
          <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            Log Out
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {billingLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : billing ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Current Plan</div>
                  <div className="text-xl font-bold uppercase tracking-wider text-primary">{billing.plan}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                  <div className="text-sm">
                    {billing.demoMode ? (
                      <span className="text-accent font-medium">Demo Mode</span>
                    ) : billing.cancelAtPeriodEnd ? (
                      <span className="text-destructive font-medium">Cancels {billing.renewsAt && new Date(billing.renewsAt).toLocaleDateString()}</span>
                    ) : billing.renewsAt ? (
                      <span className="text-green-500 font-medium">Renews {new Date(billing.renewsAt).toLocaleDateString()}</span>
                    ) : (
                      "Active"
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-destructive">Failed to load billing status</div>
          )}
        </CardContent>
        <CardFooter className="bg-muted/50 border-t border-border py-4 flex gap-4">
          {billing?.plan === "free" ? (
            <Link href="~/pricing" className="w-full">
              <Button className="w-full">Upgrade Plan</Button>
            </Link>
          ) : (
            <Button onClick={handlePortal} disabled={portal.isPending} className="w-full">
              {portal.isPending ? "Loading..." : "Manage Billing & Payment"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}