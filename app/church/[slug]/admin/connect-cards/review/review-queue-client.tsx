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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Image as ImageIcon,
  ClipboardCheck,
  ZoomIn,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { updateConnectCard } from "@/actions/connect-card/update-connect-card";
import { approveAllCards } from "@/actions/connect-card/approve-all-cards";
import { checkDuplicate } from "@/actions/connect-card/check-duplicate";
import { deleteConnectCard } from "@/actions/connect-card/delete-connect-card";
import type { ConnectCardForReview } from "@/lib/data/connect-card-review";
import {
  VISIT_STATUS_OPTIONS,
  INTEREST_OPTIONS,
  VOLUNTEER_CATEGORY_OPTIONS,
} from "@/lib/types/connect-card";

interface VolunteerLeader {
  id: string;
  name: string;
  volunteerCategories: string[];
}

interface ReviewQueueClientProps {
  cards: ConnectCardForReview[];
  slug: string;
  batchName: string;
  volunteerLeaders: VolunteerLeader[];
}

export function ReviewQueueClient({
  cards,
  slug,
  batchName,
  volunteerLeaders,
}: ReviewQueueClientProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Form state for current card
  const currentCard = cards[currentIndex];
  const [formData, setFormData] = useState(() => {
    if (!currentCard) return null;

    // Normalize visitType - handle legacy "First Time Visitor" value
    let normalizedVisitType = currentCard.visitType || "First Visit";
    if (normalizedVisitType === "First Time Visitor") {
      normalizedVisitType = "First Visit";
    }

    return {
      name: currentCard.name || "",
      email: currentCard.email || "",
      phone: currentCard.phone || "",
      visitType: normalizedVisitType,
      interests: currentCard.interests || [],
      volunteerCategory: "",
      prayerRequest: currentCard.prayerRequest || "",
      isExistingMember: false,
      assignedLeaderId: "",
      smsAutomationEnabled: false,
    };
  });

  // Duplicate detection state
  const [, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    existingCard?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      scannedAt: Date;
    };
  } | null>(null);
  const [, setCheckingDuplicate] = useState(false);

  // Image error state
  const [imageError, setImageError] = useState(false);

  // Validation error state
  const [validationErrors, setValidationErrors] = useState<{
    volunteerCategory?: boolean;
  }>({});

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
          // Auto-check the existing member checkbox
          setFormData(prev =>
            prev ? { ...prev, isExistingMember: true } : null
          );
        } else {
          setDuplicateInfo(null);
          setFormData(prev =>
            prev ? { ...prev, isExistingMember: false } : null
          );
        }
      } catch (error) {
        console.error("Duplicate check failed:", error);
        setDuplicateInfo(null);
        setFormData(prev =>
          prev ? { ...prev, isExistingMember: false } : null
        );
      } finally {
        setCheckingDuplicate(false);
      }
    };

    checkForDuplicate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard?.id, formData?.name, formData?.email, formData?.phone, slug]);

  // Note: Sidebar auto-close removed - user can toggle sidebar manually as needed

  // Update form data when card changes
  const resetFormForCard = (card: ConnectCardForReview) => {
    // Normalize visitType - handle legacy "First Time Visitor" value
    let normalizedVisitType = card.visitType || "First Visit";
    if (normalizedVisitType === "First Time Visitor") {
      normalizedVisitType = "First Visit";
    }

    setFormData({
      name: card.name || "",
      email: card.email || "",
      phone: card.phone || "",
      visitType: normalizedVisitType,
      interests: card.interests || [],
      volunteerCategory: "",
      prayerRequest: card.prayerRequest || "",
      isExistingMember: false,
      assignedLeaderId: "",
      smsAutomationEnabled: false,
    });
    setImageError(false); // Reset image error state for new card
    setValidationErrors({}); // Clear validation errors for new card
  };

  // Handle save and move to next card
  async function handleSave() {
    if (!currentCard || !formData) return;

    // Client-side validation
    const errors: { volunteerCategory?: boolean } = {};

    // Check if "Volunteering" is selected but no category chosen
    if (
      formData.interests.includes("Volunteering") &&
      !formData.volunteerCategory
    ) {
      errors.volunteerCategory = true;
    }

    // If there are validation errors, show them and don't submit
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please select a volunteer category");
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});

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
          volunteerCategory: formData.volunteerCategory || null,
          prayerRequest: formData.prayerRequest || null,
          assignedLeaderId: formData.assignedLeaderId || null,
          smsAutomationEnabled: formData.smsAutomationEnabled,
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

  // Handle interest checkbox toggle
  function toggleInterest(interest: string) {
    if (!formData) return;

    const isCurrentlyChecked = formData.interests.includes(interest);
    const newInterests = isCurrentlyChecked
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];

    setFormData({
      ...formData,
      interests: newInterests,
      // When checking "Volunteering", default to "general" category
      volunteerCategory:
        interest === "Volunteering" && !isCurrentlyChecked
          ? "general"
          : formData.volunteerCategory,
    });

    // Clear volunteer category validation error if unchecking "Volunteering"
    if (interest === "Volunteering" && isCurrentlyChecked) {
      setValidationErrors({
        ...validationErrors,
        volunteerCategory: false,
      });
    }
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

  // Handle discarding a card (delete from database)
  async function handleDiscard() {
    if (!currentCard) return;

    if (
      !confirm(
        "Are you sure you want to discard this card? This action cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteConnectCard(slug, currentCard.id);

        if (result.status === "success") {
          toast.success("Connect card discarded");

          // Move to next card or navigate back if this was the last one
          if (currentIndex < cards.length - 1) {
            const nextCard = cards[currentIndex + 1];
            setCurrentIndex(currentIndex + 1);
            resetFormForCard(nextCard);
          } else if (currentIndex > 0) {
            // If this was the last card but not the only one, go to previous
            const prevCard = cards[currentIndex - 1];
            setCurrentIndex(currentIndex - 1);
            resetFormForCard(prevCard);
          } else {
            // This was the only card - navigate back to batches
            router.push(`/church/${slug}/admin/connect-cards/batches`);
          }

          // Refresh to update the queue
          router.refresh();
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Discard error:", error);
        toast.error("Failed to discard connect card");
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

        {/* Back Button */}
        <Button
          onClick={() =>
            router.push(`/church/${slug}/admin/connect-cards/batches`)
          }
          variant="outline"
          size="lg"
          disabled={isPending}
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back
        </Button>
      </div>

      {/* Batch info */}
      <Alert className="py-2">
        <AlertDescription className="flex items-center justify-between">
          <span>Batch: {batchName}</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            <span>
              Reviewing card {currentIndex + 1} of {cards.length}
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Pagination */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={e => {
                e.preventDefault();
                if (currentIndex > 0) {
                  const prevCard = cards[currentIndex - 1];
                  setCurrentIndex(currentIndex - 1);
                  resetFormForCard(prevCard);
                }
              }}
              className={
                currentIndex === 0 || isPending
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>

          {/* Page numbers - Show 3 consecutive numbers */}
          {(() => {
            // Calculate which 3 pages to show
            let startPage = Math.max(0, currentIndex - 1);
            const endPage = Math.min(cards.length - 1, startPage + 2);

            // Adjust if we're near the end
            if (endPage - startPage < 2) {
              startPage = Math.max(0, endPage - 2);
            }

            const pages = [];

            // Show ellipsis before if not starting at page 1
            if (startPage > 0) {
              pages.push(
                <PaginationItem key="ellipsis-start">
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            // Show 3 consecutive pages
            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={e => {
                      e.preventDefault();
                      if (!isPending) {
                        setCurrentIndex(i);
                        resetFormForCard(cards[i]);
                      }
                    }}
                    isActive={currentIndex === i}
                    className={
                      isPending
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              );
            }

            // Show ellipsis after if not ending at last page
            if (endPage < cards.length - 1) {
              pages.push(
                <PaginationItem key="ellipsis-end">
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return pages;
          })()}

          <PaginationItem>
            <PaginationNext
              onClick={e => {
                e.preventDefault();
                if (currentIndex < cards.length - 1) {
                  const nextCard = cards[currentIndex + 1];
                  setCurrentIndex(currentIndex + 1);
                  resetFormForCard(nextCard);
                }
              }}
              className={
                currentIndex === cards.length - 1 || isPending
                  ? "pointer-events-none opacity-50"
                  : "cursor-pointer"
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

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
            {currentCard.imageUrl?.trim() && !imageError ? (
              <>
                <Zoom>
                  <div className="relative w-full flex-1 bg-muted rounded-lg overflow-hidden border cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentCard.imageUrl.trim() || undefined}
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
              Review
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isExistingMember"
                    checked={formData.isExistingMember}
                    onCheckedChange={checked =>
                      setFormData({
                        ...formData,
                        isExistingMember: checked === true,
                      })
                    }
                    disabled={isPending}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor="isExistingMember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Existing member
                  </Label>
                </div>
              </div>
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

            {/* Volunteer Category - Only show if "Volunteering" is checked */}
            {formData.interests.includes("Volunteering") && (
              <div className="space-y-2">
                <Label htmlFor="volunteerCategory">
                  Volunteer Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.volunteerCategory}
                  onValueChange={value => {
                    setFormData({ ...formData, volunteerCategory: value });
                    // Clear validation error when user selects a value
                    if (validationErrors.volunteerCategory) {
                      setValidationErrors({
                        ...validationErrors,
                        volunteerCategory: false,
                      });
                    }
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="volunteerCategory"
                    className={
                      validationErrors.volunteerCategory
                        ? "border-destructive focus:ring-destructive"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Select volunteer category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOLUNTEER_CATEGORY_OPTIONS.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {validationErrors.volunteerCategory && (
                  <p className="text-sm text-destructive">
                    Volunteer category is required
                  </p>
                )}
              </div>
            )}

            {/* Volunteer Assignment Workflow - Only show for non-General categories */}
            {formData.interests.includes("Volunteering") &&
              formData.volunteerCategory &&
              formData.volunteerCategory !== "General" && (
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">
                      Volunteer Assignment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Assign this volunteer to a category leader and optionally
                      enable SMS workflow
                    </p>
                  </div>

                  {/* Assigned Leader Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="assignedLeader">
                      Assigned Leader (Optional)
                    </Label>
                    <Select
                      value={formData.assignedLeaderId}
                      onValueChange={value =>
                        setFormData({ ...formData, assignedLeaderId: value })
                      }
                      disabled={isPending}
                    >
                      <SelectTrigger id="assignedLeader">
                        <SelectValue placeholder="Select a leader..." />
                      </SelectTrigger>
                      <SelectContent>
                        {volunteerLeaders
                          .filter(leader =>
                            leader.volunteerCategories.includes(
                              formData.volunteerCategory
                            )
                          )
                          .map(leader => (
                            <SelectItem key={leader.id} value={leader.id}>
                              {leader.name}
                            </SelectItem>
                          ))}
                        {volunteerLeaders.filter(leader =>
                          leader.volunteerCategories.includes(
                            formData.volunteerCategory
                          )
                        ).length === 0 && (
                          <SelectItem value="none" disabled>
                            No leaders assigned to this category
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Leaders with &quot;{formData.volunteerCategory}&quot;
                      category.{" "}
                      <a
                        href={`/church/${slug}/admin/team`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Add role to staff member →
                      </a>
                    </p>
                  </div>

                  {/* SMS Automation Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smsAutomation"
                      checked={formData.smsAutomationEnabled}
                      onCheckedChange={checked =>
                        setFormData({
                          ...formData,
                          smsAutomationEnabled: Boolean(checked),
                        })
                      }
                      disabled={isPending}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="smsAutomation"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Enable SMS Automation
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Send automated onboarding messages (initial info →
                        calendar invite → reminders)
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
            <div className="pt-4 space-y-3">
              <Button
                onClick={handleSave}
                disabled={isPending || !formData.name}
                className="w-full"
                size="lg"
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
              <Button
                onClick={handleDiscard}
                variant="destructive"
                className="w-full"
                size="lg"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Discarding...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 w-4 h-4" />
                    Discard
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
