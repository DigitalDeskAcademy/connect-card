"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  SkipForward,
  Save,
  Image as ImageIcon,
  ClipboardCheck,
  ZoomIn,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { updateConnectCard } from "@/actions/connect-card/update-connect-card";
import { approveAllCards } from "@/actions/connect-card/approve-all-cards";
import { checkDuplicate } from "@/actions/connect-card/check-duplicate";
import { markDuplicate } from "@/actions/connect-card/mark-duplicate";
import type { ConnectCardForReview } from "@/lib/data/connect-card-review";
import { formatPhoneNumber } from "@/lib/utils";
import {
  VISIT_STATUS_OPTIONS,
  INTEREST_OPTIONS,
} from "@/lib/types/connect-card";

interface ReviewQueueClientProps {
  cards: ConnectCardForReview[];
  slug: string;
}

export function ReviewQueueClient({ cards, slug }: ReviewQueueClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Form state for current card
  const currentCard = cards[currentIndex];
  const [formData, setFormData] = useState(() =>
    currentCard
      ? {
          name: currentCard.name || "",
          email: currentCard.email || "",
          phone: currentCard.phone || "",
          visitType: currentCard.visitType || "First Visit",
          interests: currentCard.interests || [],
          prayerRequest: currentCard.prayerRequest || "",
        }
      : null
  );

  // Duplicate detection state
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    existingCard?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      scannedAt: Date;
    };
  } | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Image error state
  const [imageError, setImageError] = useState(false);

  // Check for duplicates when card changes
  useEffect(() => {
    if (!currentCard || !formData) return;

    const checkForDuplicate = async () => {
      setCheckingDuplicate(true);
      try {
        const result = await checkDuplicate(slug, {
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          currentCardId: currentCard.id,
        });

        if (result.status === "success" && result.isDuplicate) {
          setDuplicateInfo({
            isDuplicate: true,
            existingCard: result.existingCard,
          });
        } else {
          setDuplicateInfo(null);
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
        setDuplicateInfo(null);
      } finally {
        setCheckingDuplicate(false);
      }
    };

    checkForDuplicate();
  }, [currentCard?.id, formData?.name, formData?.email, formData?.phone, slug]);

  // Note: Sidebar auto-close removed - user can toggle sidebar manually as needed

  // Update form data when card changes
  const resetFormForCard = (card: ConnectCardForReview) => {
    setFormData({
      name: card.name || "",
      email: card.email || "",
      phone: card.phone || "",
      visitType: card.visitType || "First Visit",
      interests: card.interests || [],
      prayerRequest: card.prayerRequest || "",
    });
    setImageError(false); // Reset image error state for new card
  };

  // Handle save and move to next card
  async function handleSave() {
    if (!currentCard || !formData) return;

    startTransition(async () => {
      try {
        const result = await updateConnectCard(slug, {
          id: currentCard.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          visitType:
            (formData.visitType as
              | "First Visit"
              | "Second Visit"
              | "Regular attendee"
              | "Other") || null,
          interests: formData.interests,
          prayerRequest: formData.prayerRequest || null,
        });

        if (result.status === "success") {
          toast.success("Connect card reviewed and saved!");

          // Move to next card or refresh if this was the last one
          if (currentIndex < cards.length - 1) {
            const nextCard = cards[currentIndex + 1];
            setCurrentIndex(currentIndex + 1);
            resetFormForCard(nextCard);
          } else {
            // Last card - refresh the page to show updated queue
            router.refresh();
          }
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Save error:", error);
        toast.error("Failed to save connect card");
      }
    });
  }

  // Handle skip to next card without saving
  function handleSkip() {
    if (currentIndex < cards.length - 1) {
      const nextCard = cards[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      resetFormForCard(nextCard);
      toast.info("Skipped to next card");
    } else {
      toast.info("This is the last card in the queue");
    }
  }

  // Handle interest checkbox toggle
  function toggleInterest(interest: string) {
    if (!formData) return;
    setFormData({
      ...formData,
      interests: formData.interests.includes(interest)
        ? formData.interests.filter(i => i !== interest)
        : [...formData.interests, interest],
    });
  }

  // Handle batch approval of all cards
  async function handleApproveAll() {
    if (!confirm(`Approve all ${cards.length} cards without review?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await approveAllCards(slug);

        if (result.status === "success") {
          toast.success(result.message);
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Approve all error:", error);
        toast.error("Failed to approve cards");
      }
    });
  }

  // Handle marking card as duplicate
  async function handleMarkDuplicate() {
    if (!currentCard) return;

    startTransition(async () => {
      try {
        const result = await markDuplicate(slug, currentCard.id);

        if (result.status === "success") {
          toast.success(result.message);
          // Move to next card or refresh if this was the last one
          if (currentIndex < cards.length - 1) {
            const nextCard = cards[currentIndex + 1];
            setCurrentIndex(currentIndex + 1);
            resetFormForCard(nextCard);
          } else {
            router.refresh();
          }
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Mark duplicate error:", error);
        toast.error("Failed to mark as duplicate");
      }
    });
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <ClipboardCheck className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">All caught up!</h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            There are no connect cards awaiting review at this time. Upload new
            cards to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentCard || !formData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load connect card for review
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        {/* Accept All Button */}
        <Button onClick={handleApproveAll} disabled={isPending} size="lg">
          {isPending ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 w-5 h-5" />
              Accept All ({cards.length})
            </>
          )}
        </Button>
      </div>

      {/* Progress indicator */}
      <Alert className="py-2">
        <ClipboardCheck className="h-4 w-4" />
        <AlertDescription>
          Reviewing card {currentIndex + 1} of {cards.length}
        </AlertDescription>
      </Alert>

      {/* Duplicate Warning */}
      {duplicateInfo?.isDuplicate && duplicateInfo.existingCard && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold mb-1">
                  Possible Duplicate Detected
                </p>
                <p className="text-sm">
                  Similar card found:{" "}
                  <strong>{duplicateInfo.existingCard.name}</strong>
                  {duplicateInfo.existingCard.phone && (
                    <>
                      {" "}
                      • {formatPhoneNumber(duplicateInfo.existingCard.phone)}
                    </>
                  )}
                  {duplicateInfo.existingCard.email && (
                    <> • {duplicateInfo.existingCard.email}</>
                  )}
                </p>
                <p className="text-xs mt-1 opacity-90">
                  Last scanned{" "}
                  {new Date(
                    duplicateInfo.existingCard.scannedAt
                  ).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkDuplicate}
                disabled={isPending}
              >
                <X className="mr-1 h-3 w-3" />
                Mark as Duplicate
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Checking for duplicates indicator */}
      {checkingDuplicate && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Checking for duplicates...</AlertDescription>
        </Alert>
      )}

      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        style={{ height: "calc(100vh - 180px)" }}
      >
        {/* Left side - Image display */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Scanned Connect Card
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {currentCard.imageUrl &&
            currentCard.imageUrl.trim() !== "" &&
            !imageError ? (
              <>
                <Zoom>
                  <div className="relative w-full flex-1 bg-muted rounded-lg overflow-hidden border cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentCard.imageUrl || undefined}
                      alt="Connect card scan"
                      className="w-full h-full object-contain"
                      onError={() => setImageError(true)}
                    />
                  </div>
                </Zoom>
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground text-center">
                    Scanned{" "}
                    {new Date(currentCard.scannedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                    <ZoomIn className="w-4 h-4" />
                    <span>Click image to zoom</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                <div className="text-center text-muted-foreground p-6">
                  <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium mb-1">
                    Image not available
                  </p>
                  <p className="text-xs opacity-75">
                    {imageError ? "Failed to load image" : "No image uploaded"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right side - Correction form */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Review & Correct Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Full name"
                disabled={isPending}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
                disabled={isPending}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="(555) 123-4567"
                disabled={isPending}
              />
            </div>

            {/* Visit Status */}
            <div className="space-y-2">
              <Label htmlFor="visitType">Visit Status</Label>
              <Select
                value={formData.visitType}
                onValueChange={value =>
                  setFormData({ ...formData, visitType: value })
                }
                disabled={isPending}
              >
                <SelectTrigger id="visitType">
                  <SelectValue placeholder="Select visit status" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label>Interests</Label>
              <div className="space-y-2">
                {INTEREST_OPTIONS.map(interest => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest}
                      checked={formData.interests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                      disabled={isPending}
                    />
                    <Label
                      htmlFor={interest}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {interest}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Prayer Request */}
            <div className="space-y-2">
              <Label htmlFor="prayerRequest">Prayer Request</Label>
              <Textarea
                id="prayerRequest"
                value={formData.prayerRequest}
                onChange={e =>
                  setFormData({ ...formData, prayerRequest: e.target.value })
                }
                placeholder="Enter prayer request or notes..."
                rows={4}
                disabled={isPending}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isPending || currentIndex === cards.length - 1}
                className="flex-1"
              >
                <SkipForward className="mr-2 w-4 h-4" />
                Skip
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !formData.name}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 w-4 h-4" />
                    Save & Next
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
