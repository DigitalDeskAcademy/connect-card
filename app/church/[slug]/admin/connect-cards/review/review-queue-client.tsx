"use client";

import { useState, useTransition } from "react";
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
import { PageContainer } from "@/components/layout/page-container";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  SkipForward,
  Save,
  Image as ImageIcon,
  ClipboardCheck,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { updateConnectCard } from "@/actions/connect-card/update-connect-card";
import type { ConnectCardForReview } from "@/lib/data/connect-card-review";
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

  // Empty state
  if (cards.length === 0) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardCheck className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">All caught up!</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              There are no connect cards awaiting review at this time. Upload
              new cards to get started.
            </p>
            <Button
              onClick={() =>
                router.push(`/church/${slug}/admin/connect-cards/upload`)
              }
            >
              Upload Connect Cards
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (!currentCard || !formData) {
    return (
      <PageContainer>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load connect card for review
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/church/${slug}/admin`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Progress indicator */}
      <Alert className="mb-6">
        <ClipboardCheck className="h-4 w-4" />
        <AlertDescription>
          Reviewing card {currentIndex + 1} of {cards.length}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Image display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Scanned Connect Card
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentCard.imageUrl ? (
              <>
                <Zoom>
                  <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden border cursor-zoom-in">
                    <img
                      src={currentCard.imageUrl}
                      alt="Connect card scan"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </Zoom>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Scanned {new Date(currentCard.scannedAt).toLocaleDateString()}{" "}
                  • Click image to zoom
                </p>
              </>
            ) : (
              <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Image not available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right side - Correction form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Review & Correct Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
    </PageContainer>
  );
}
