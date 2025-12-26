"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SessionRecoveryDialogProps {
  isOpen: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

/**
 * Session Recovery Dialog
 * Shown when a previous scanning session was interrupted
 */
export function SessionRecoveryDialog({
  isOpen,
  onResume,
  onDiscard,
}: SessionRecoveryDialogProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume Previous Session?</AlertDialogTitle>
          <AlertDialogDescription>
            You have an incomplete scanning session. Some cards may have been
            interrupted during processing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>Start Fresh</AlertDialogCancel>
          <AlertDialogAction onClick={onResume}>
            Resume Session
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
