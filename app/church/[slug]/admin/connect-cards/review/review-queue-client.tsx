"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { leaderMatchesCategory } from "@/lib/volunteer-category-mapping";
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
import { Badge } from "@/components/ui/badge";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  ZoomOut,
  Trash2,
  ArrowLeft,
  ChevronDown,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { updateConnectCard } from "@/actions/connect-card/update-connect-card";
import { checkDuplicate } from "@/actions/connect-card/check-duplicate";
import { deleteConnectCard } from "@/actions/connect-card/delete-connect-card";
import type { ConnectCardForReview } from "@/lib/data/connect-card-review";
import {
  VISIT_STATUS_OPTIONS,
  INTEREST_OPTIONS,
  VOLUNTEER_CATEGORY_OPTIONS,
  formatVolunteerCategoryLabel,
} from "@/lib/types/connect-card";

interface VolunteerLeader {
  id: string;
  name: string;
  email: string | null;
  volunteerCategories: string[];
}

interface ReviewQueueClientProps {
  cards: ConnectCardForReview[];
  slug: string;
  batchName: string;
  volunteerLeaders: VolunteerLeader[];
}

export function ReviewQueueClient({
  cards: initialCards,
  slug,
  batchName,
  volunteerLeaders,
}: ReviewQueueClientProps) {
  const router = useRouter();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const previousSidebarState = useRef<boolean>(true);

  // Store setSidebarOpen in a ref to avoid effect re-runs when it changes
  const setSidebarOpenRef = useRef(setSidebarOpen);
  setSidebarOpenRef.current = setSidebarOpen;

  // Track cards in local state so we can remove them after processing
  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Form state for current card
  const currentCard = cards[currentIndex];
  const [formData, setFormData] = useState(() => {
    if (!currentCard) return null;

    // Normalize visitType - handle legacy "First Time Visitor" value
    // Don't default to "First Visit" - let staff select based on card
    let normalizedVisitType = currentCard.visitType || "";
    if (normalizedVisitType === "First Time Visitor") {
      normalizedVisitType = "First Visit";
    }

    // Determine volunteer category - use existing, or default to "GENERAL" if Volunteering is selected
    const interests = currentCard.interests || [];
    const hasVolunteering = interests.includes("Volunteering");
    let volunteerCategory = currentCard.volunteerCategory || "";
    if (hasVolunteering && !volunteerCategory) {
      volunteerCategory = "GENERAL";
    }

    return {
      name: currentCard.name || "",
      email: currentCard.email || "",
      phone: currentCard.phone || "",
      visitType: normalizedVisitType,
      interests: interests,
      volunteerCategory: volunteerCategory,
      prayerRequest: currentCard.prayerRequest || "",
      isExistingMember: false,
      assignedLeaderId: currentCard.assignedLeaderId || "",
      smsAutomationEnabled: currentCard.smsAutomationEnabled || false,
      sendMessageToLeader: false,
      sendBackgroundCheckInfo: false,
    };
  });

  // Duplicate detection state - stores match info for potential future UI display
  // Currently used to auto-check "existing member" checkbox; hasDiscrepancies
  // available for future use when we want to show reviewers significant differences
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    matchType?:
      | "member_email"
      | "card_email"
      | "member_name_phone"
      | "card_name_phone";
    confidence?: number;
    hasDiscrepancies?: boolean;
    existingMember?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      memberType: string;
    };
    existingCard?: {
      id: string;
      name: string | null;
      email: string | null;
      phone: string | null;
      scannedAt: Date;
    };
    similarity?: {
      name: number;
      phone: number;
    };
  } | null>(null);
  const [, setCheckingDuplicate] = useState(false);

  // Image state
  const [imageError, setImageError] = useState(false);
  const [showBackImage, setShowBackImage] = useState(false); // Toggle for two-sided cards

  // Validation error state
  const [validationErrors, setValidationErrors] = useState<{
    volunteerCategory?: boolean;
  }>({});

  // Volunteer assignment collapsible state
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);

  // Discard confirmation dialog state
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Review Mode state - 75/25 split with persistent zoom
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset zoom state when exiting Review Mode or changing cards
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  // Toggle Review Mode
  const toggleReviewMode = useCallback(() => {
    setIsReviewMode(prev => {
      if (!prev) {
        // Entering review mode - save current sidebar state
        previousSidebarState.current = sidebarOpen;
      }
      return !prev;
    });
    resetZoom();
  }, [resetZoom, sidebarOpen]);

  // Handle sidebar state based on Review Mode
  // Uses ref to avoid re-running when setSidebarOpen changes (it's not stable)
  useEffect(() => {
    if (isReviewMode) {
      setSidebarOpenRef.current(false);
    } else if (previousSidebarState.current !== undefined) {
      setSidebarOpenRef.current(previousSidebarState.current);
    }
  }, [isReviewMode]);

  // Keyboard handler for Escape to exit Review Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isReviewMode) {
        e.preventDefault();
        toggleReviewMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isReviewMode, toggleReviewMode]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Pan handlers for dragging the zoomed image
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - panPosition.x,
          y: e.clientY - panPosition.y,
        });
      }
    },
    [zoomLevel, panPosition]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && zoomLevel > 1) {
        setPanPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart, zoomLevel]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Auto-expand volunteer assignment section for non-GENERAL categories
  useEffect(() => {
    if (formData?.volunteerCategory) {
      // Auto-expand for any category except GENERAL
      setIsAssignmentOpen(formData.volunteerCategory !== "GENERAL");
    }
  }, [formData?.volunteerCategory]);

  // Clear assigned leader if they don't match the new category
  useEffect(() => {
    if (!formData?.volunteerCategory || !formData?.assignedLeaderId) return;

    const currentLeader = volunteerLeaders.find(
      l => l.id === formData.assignedLeaderId
    );
    if (
      currentLeader &&
      !leaderMatchesCategory(
        currentLeader.volunteerCategories,
        formData.volunteerCategory
      )
    ) {
      setFormData(prev => (prev ? { ...prev, assignedLeaderId: "" } : null));
    }
  }, [
    formData?.volunteerCategory,
    formData?.assignedLeaderId,
    volunteerLeaders,
  ]);

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
          // Store full duplicate info for potential UI display
          setDuplicateInfo({
            isDuplicate: true,
            matchType: result.matchType,
            confidence: result.confidence,
            hasDiscrepancies: result.hasDiscrepancies,
            existingMember: result.existingMember,
            existingCard: result.existingCard,
            similarity: result.similarity,
          });
          // Auto-check the existing member checkbox
          // This happens regardless of discrepancies - email match = same person
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
    // Don't default to "First Visit" - let staff select based on card
    let normalizedVisitType = card.visitType || "";
    if (normalizedVisitType === "First Time Visitor") {
      normalizedVisitType = "First Visit";
    }

    // Determine volunteer category - use existing, or default to "GENERAL" if Volunteering is selected
    const interests = card.interests || [];
    const hasVolunteering = interests.includes("Volunteering");
    let volunteerCategory = card.volunteerCategory || "";
    if (hasVolunteering && !volunteerCategory) {
      volunteerCategory = "GENERAL";
    }

    setFormData({
      name: card.name || "",
      email: card.email || "",
      phone: card.phone || "",
      visitType: normalizedVisitType,
      interests: interests,
      volunteerCategory: volunteerCategory,
      prayerRequest: card.prayerRequest || "",
      isExistingMember: false,
      assignedLeaderId: card.assignedLeaderId || "",
      smsAutomationEnabled: card.smsAutomationEnabled || false,
      sendMessageToLeader: false,
      sendBackgroundCheckInfo: false,
    });
    setImageError(false); // Reset image error state for new card
    setShowBackImage(false); // Reset to front image for new card
    setValidationErrors({}); // Clear validation errors for new card
    setDuplicateInfo(null); // Reset duplicate info - will be rechecked by useEffect
    resetZoom(); // Reset zoom state for new card
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
          sendMessageToLeader: formData.sendMessageToLeader,
          sendBackgroundCheckInfo: formData.sendBackgroundCheckInfo,
        });

        if (result.status === "success") {
          // Remove the processed card from local state
          const remainingCards = cards.filter((_, idx) => idx !== currentIndex);
          setCards(remainingCards);

          if (remainingCards.length === 0) {
            // All cards processed - single toast, navigate back to batches
            toast.success("All cards reviewed! Batch complete.");
            router.push(`/church/${slug}/admin/connect-cards?tab=batches`);
            router.refresh();
          } else {
            // Card saved, move to next
            toast.success("Saved");
            const newIndex = Math.min(currentIndex, remainingCards.length - 1);
            setCurrentIndex(newIndex);
            resetFormForCard(remainingCards[newIndex]);
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
      // When checking "Volunteering", default to "GENERAL" category
      volunteerCategory:
        interest === "Volunteering" && !isCurrentlyChecked
          ? "GENERAL"
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

  // Open discard confirmation dialog
  function handleDiscard() {
    if (!currentCard) return;
    setShowDiscardDialog(true);
  }

  // Actually discard the card after confirmation
  async function confirmDiscard() {
    if (!currentCard) return;
    setShowDiscardDialog(false);

    startTransition(async () => {
      try {
        const result = await deleteConnectCard(slug, currentCard.id);

        if (result.status === "success") {
          toast.success("Connect card discarded");

          // Remove the discarded card from local state
          const remainingCards = cards.filter((_, idx) => idx !== currentIndex);
          setCards(remainingCards);

          if (remainingCards.length === 0) {
            // All cards gone - navigate back to batches
            toast.success("All cards in this batch have been processed!");
            router.push(`/church/${slug}/admin/connect-cards?tab=batches`);
            router.refresh();
          } else {
            // Move to next card (or stay at same index if we removed the current one)
            const newIndex = Math.min(currentIndex, remainingCards.length - 1);
            setCurrentIndex(newIndex);
            resetFormForCard(remainingCards[newIndex]);
          }
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

      {/* Pagination with Back button */}
      <div className="flex items-center">
        {/* Spacer to balance back button */}
        <div className="w-[72px]" />
        <Pagination className="flex-1">
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

        {/* Back to batches */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push(`/church/${slug}/admin/connect-cards?tab=batches`)
          }
          disabled={isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div
        className="grid gap-4 grid-cols-1 lg:grid-cols-2"
        style={{ height: "calc(100vh - 180px)" }}
      >
        {/* Left side - Image display */}
        <Card className="flex flex-col h-full">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg truncate">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <span className="truncate">
                  {isReviewMode ? "Review Mode" : "Card Preview"}
                </span>
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                {/* Front/Back toggle for two-sided cards */}
                {currentCard.backImageUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBackImage(!showBackImage)}
                    className="gap-1 md:gap-2 px-2 md:px-3"
                    title={showBackImage ? "Show Front" : "Show Back"}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {showBackImage ? "Front" : "Back"}
                    </span>
                  </Button>
                )}
                {/* Review Mode toggle */}
                <Button
                  variant={isReviewMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={toggleReviewMode}
                  className="gap-1 md:gap-2 px-2 md:px-3 !border-2 !border-primary"
                  title={
                    isReviewMode
                      ? "Exit Review Mode (Esc)"
                      : "Enter Review Mode"
                  }
                >
                  {isReviewMode ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Exit</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Review</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {(() => {
              const displayUrl = showBackImage
                ? currentCard.backImageUrl
                : currentCard.imageUrl;
              const displayLabel = showBackImage ? "Back" : "Front";

              return displayUrl?.trim() && !imageError ? (
                <div className="flex flex-col">
                  {/* Custom zoom container */}
                  <div
                    className={`relative w-full bg-muted rounded-lg overflow-hidden border ${
                      isReviewMode
                        ? zoomLevel > 1
                          ? "cursor-grab active:cursor-grabbing"
                          : "cursor-zoom-in"
                        : "cursor-pointer"
                    }`}
                    onMouseDown={isReviewMode ? handleMouseDown : undefined}
                    onMouseMove={isReviewMode ? handleMouseMove : undefined}
                    onMouseUp={isReviewMode ? handleMouseUp : undefined}
                    onMouseLeave={isReviewMode ? handleMouseUp : undefined}
                    onClick={() => {
                      if (!isReviewMode) {
                        // In normal mode, clicking enters review mode
                        toggleReviewMode();
                      } else if (zoomLevel === 1) {
                        // In review mode at 1x, click to zoom in
                        handleZoomIn();
                      }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayUrl.trim() || undefined}
                      alt={`Connect card ${displayLabel.toLowerCase()}`}
                      className="w-full max-h-[calc(100vh-320px)] object-contain select-none"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      onError={() => setImageError(true)}
                      style={
                        isReviewMode
                          ? {
                              transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                              transition: isDragging
                                ? "none"
                                : "transform 0.2s ease-out",
                            }
                          : undefined
                      }
                    />
                    {/* Side indicator for two-sided cards */}
                    {currentCard.backImageUrl && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                        {displayLabel}
                      </div>
                    )}
                    {/* Zoom controls overlay in Review Mode */}
                    {isReviewMode && (
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/60 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleZoomOut();
                          }}
                          disabled={zoomLevel <= 1}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-white text-xs font-medium min-w-[3ch] text-center">
                          {zoomLevel.toFixed(1)}x
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            handleZoomIn();
                          }}
                          disabled={zoomLevel >= 4}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            resetZoom();
                          }}
                          disabled={zoomLevel === 1}
                          className="h-8 w-8 p-0 text-white hover:bg-white/20 disabled:opacity-40"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-muted-foreground text-center">
                      Scanned{" "}
                      {new Date(currentCard.scannedAt).toLocaleDateString()}
                      {currentCard.backImageUrl && " (2-sided card)"}
                    </p>
                    {!isReviewMode && (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                        <ZoomIn className="w-4 h-4" />
                        <span>Click image to zoom</span>
                      </div>
                    )}
                    {isReviewMode && (
                      <p className="text-xs text-muted-foreground text-center">
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted-foreground/20 rounded text-[10px]">
                          Esc
                        </kbd>{" "}
                        to exit • Drag to pan when zoomed
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative w-full aspect-[3/4] bg-muted rounded-lg overflow-hidden border flex items-center justify-center">
                  <div className="text-center text-muted-foreground p-6">
                    <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium mb-1">
                      Image not available
                    </p>
                    <p className="text-xs opacity-75">
                      {imageError
                        ? "Failed to load image"
                        : "No image uploaded"}
                    </p>
                  </div>
                </div>
              );
            })()}
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

            {/* Volunteer Onboarding Card - Show when Volunteering is selected */}
            {formData.interests.includes("Volunteering") && (
              <Card className="bg-muted/50 py-0">
                <CardContent className="p-4 space-y-4">
                  {/* Card Header */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">
                      Volunteer Onboarding
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Categorize this volunteer and optionally assign to a team
                      leader
                    </p>
                  </div>

                  {/* Volunteer Category */}
                  <div className="space-y-2">
                    <Label htmlFor="volunteerCategory">
                      Volunteer Category{" "}
                      <span className="text-destructive">*</span>
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
                            {formatVolunteerCategoryLabel(category)}
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

                  {/* Volunteer Assignment - Collapsible */}
                  {formData.volunteerCategory &&
                    formData.volunteerCategory !== "GENERAL" && (
                      <Collapsible
                        open={isAssignmentOpen}
                        onOpenChange={setIsAssignmentOpen}
                        className="border-t pt-4"
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full p-0 h-auto hover:bg-transparent"
                          >
                            <div className="w-full text-left">
                              <div className="flex justify-between items-center">
                                <h4 className="text-sm font-semibold">
                                  Volunteer Assignment
                                </h4>
                                <ChevronDown
                                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                    isAssignmentOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Assign leader and configure notifications
                              </p>
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4 space-y-4">
                          {/* Assigned Leader Dropdown */}
                          <div className="space-y-2 w-full">
                            <Label htmlFor="assignedLeader">
                              Assigned Leader (Optional)
                            </Label>
                            <Select
                              value={formData.assignedLeaderId}
                              onValueChange={value =>
                                setFormData({
                                  ...formData,
                                  assignedLeaderId: value,
                                  // Auto-check "Send message to leader" when a leader is selected
                                  sendMessageToLeader: value
                                    ? true
                                    : formData.sendMessageToLeader,
                                })
                              }
                              disabled={isPending}
                            >
                              <SelectTrigger
                                id="assignedLeader"
                                className="w-full"
                              >
                                <span className="truncate">
                                  {formData.assignedLeaderId
                                    ? volunteerLeaders.find(
                                        l => l.id === formData.assignedLeaderId
                                      )?.name
                                    : "Select a leader..."}
                                </span>
                              </SelectTrigger>
                              <SelectContent className="max-w-[300px]">
                                {volunteerLeaders
                                  .filter(leader =>
                                    leaderMatchesCategory(
                                      leader.volunteerCategories,
                                      formData.volunteerCategory
                                    )
                                  )
                                  .map(leader => (
                                    <SelectItem
                                      key={leader.id}
                                      value={leader.id}
                                    >
                                      <span className="truncate block max-w-[250px]">
                                        {leader.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                {volunteerLeaders.filter(leader =>
                                  leaderMatchesCategory(
                                    leader.volunteerCategories,
                                    formData.volunteerCategory
                                  )
                                ).length === 0 && (
                                  <SelectItem value="none" disabled>
                                    No leaders assigned to this category
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <p>
                                Leaders with &quot;
                                {formatVolunteerCategoryLabel(
                                  formData.volunteerCategory
                                )}
                                &quot; category.
                              </p>
                              <a
                                href={`/church/${slug}/admin/team?highlight=${encodeURIComponent(
                                  formatVolunteerCategoryLabel(
                                    formData.volunteerCategory
                                  )
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-block"
                              >
                                Add leader for this ministry →
                              </a>
                            </div>
                          </div>

                          {/* Send Message to Leader Checkbox */}
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="sendMessageToLeader"
                              checked={formData.sendMessageToLeader}
                              onCheckedChange={checked =>
                                setFormData({
                                  ...formData,
                                  sendMessageToLeader: Boolean(checked),
                                })
                              }
                              disabled={isPending}
                            />
                            <div className="grid gap-1 leading-none">
                              <label
                                htmlFor="sendMessageToLeader"
                                className="text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                Send message to Leader
                              </label>
                              <p className="text-xs text-muted-foreground leading-tight">
                                Notify the assigned leader about this new
                                volunteer
                              </p>
                            </div>
                          </div>

                          {/* Send Onboarding Documents Checkbox */}
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="sendBackgroundCheckInfo"
                              checked={formData.sendBackgroundCheckInfo}
                              onCheckedChange={checked =>
                                setFormData({
                                  ...formData,
                                  sendBackgroundCheckInfo: Boolean(checked),
                                })
                              }
                              disabled={isPending || !formData.email}
                            />
                            <div className="grid gap-1 leading-none">
                              <label
                                htmlFor="sendBackgroundCheckInfo"
                                className={`text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                  formData.email
                                    ? "cursor-pointer"
                                    : "opacity-50"
                                }`}
                              >
                                Send onboarding documents
                              </label>
                              <p className="text-xs text-muted-foreground leading-tight">
                                {!formData.email ? (
                                  <span className="text-destructive">
                                    No email address — cannot send documents
                                  </span>
                                ) : (
                                  "Welcome email with ministry docs, training, and background check link (if required)"
                                )}
                              </p>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                </CardContent>
              </Card>
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
                rows={3}
                className="max-h-28 overflow-y-auto"
                disabled={isPending}
              />
            </div>

            {/* Detected Keywords (read-only) */}
            {currentCard.detectedKeywords &&
              currentCard.detectedKeywords.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Detected Keywords
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {currentCard.detectedKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Campaign keywords detected by AI. These will be cleared
                    after 30 days.
                  </p>
                </div>
              )}

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

      {/* Discard Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Connect Card?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to discard this card? This action cannot be
              undone and the card will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
