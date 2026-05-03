import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentPlan: string;
  upgradeTo: string;
}

export function LimitModal({ isOpen, onClose, feature, currentPlan, upgradeTo }: LimitModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limit Reached</DialogTitle>
          <DialogDescription>
            You've reached the limit for {feature} on your {currentPlan} plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p>Upgrade to the <strong>{upgradeTo}</strong> plan to unlock more capacity and advanced features.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Maybe later</Button>
          <Link href="~/pricing">
            <Button>View Pricing</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}