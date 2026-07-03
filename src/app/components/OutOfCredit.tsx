// components/OutOfCreditsModal.tsx
import { AlertCircle, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
 
interface OutOfCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutOfCreditsModal({ open, onOpenChange }: OutOfCreditsModalProps) {
 

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-description="Out of credits modal">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle className="text-xl">Out of Credits</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="text-base pt-2 space-y-3">
              <p>
                You've used all your available credits. To continue using the AI assistant,
                please contact our support team.
              </p>
              <p className="text-sm text-muted-foreground">
                We'll help you get back up and running as quickly as possible!
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}