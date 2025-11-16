"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddSkillDialog } from "./add-skill-dialog";
import {
  IconPlus,
  IconTrash,
  IconCertificate,
  IconCalendar,
} from "@tabler/icons-react";
import { format } from "date-fns";
import { deleteVolunteerSkill } from "@/actions/volunteers/skills";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { VolunteerSkill } from "@/lib/generated/prisma";

/**
 * Skills Tab Component
 *
 * Displays volunteer skills and certifications with management capabilities.
 *
 * Features:
 * - Card layout for each skill with proficiency and verification status
 * - Add new skills via dialog
 * - Remove skills with confirmation
 * - Shows verification dates and expiry dates
 * - Empty state when no skills exist
 */

interface SkillsTabProps {
  volunteer: {
    id: string;
    skills: VolunteerSkill[];
  };
  slug: string;
}

export function SkillsTab({ volunteer, slug }: SkillsTabProps) {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  // Handle skill deletion
  async function handleDeleteSkill(skillId: string) {
    if (!confirm("Are you sure you want to remove this skill?")) {
      return;
    }

    setDeletingSkillId(skillId);

    try {
      const result = await deleteVolunteerSkill(slug, skillId);

      if (result.status === "success") {
        toast.success(result.message);
        router.refresh(); // Refresh to show updated skills list
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to remove skill. Please try again.");
    } finally {
      setDeletingSkillId(null);
    }
  }

  // Handle successful skill addition
  function handleSkillAdded() {
    setIsAddDialogOpen(false);
    router.refresh(); // Refresh to show new skill
  }

  // Get proficiency badge variant
  function getProficiencyVariant(proficiency: string | null) {
    if (!proficiency) return "secondary";

    const level = proficiency.toLowerCase();
    if (level.includes("expert") || level.includes("advanced"))
      return "default";
    if (level.includes("intermediate")) return "secondary";
    return "outline";
  }

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Skills & Certifications</h2>
          <p className="text-sm text-muted-foreground">
            Manage volunteer skills, qualifications, and certifications
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Skill
        </Button>
      </div>

      {/* Skills List */}
      {volunteer.skills.length === 0 ? (
        // Empty state
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconCertificate className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No skills added yet</p>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Add skills and certifications to help match this volunteer with
              appropriate serving opportunities.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Add First Skill
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Skills grid
        <div className="grid gap-4 md:grid-cols-2">
          {volunteer.skills.map(skill => (
            <Card key={skill.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {skill.skillName}
                    {skill.isVerified && (
                      <Badge variant="default" className="text-xs">
                        Verified
                      </Badge>
                    )}
                  </CardTitle>
                  {skill.proficiency && (
                    <CardDescription>
                      <Badge variant={getProficiencyVariant(skill.proficiency)}>
                        {skill.proficiency}
                      </Badge>
                    </CardDescription>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSkill(skill.id)}
                  disabled={deletingSkillId === skill.id}
                >
                  <IconTrash className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Verification Date */}
                {skill.verifiedDate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <IconCalendar className="mr-2 h-4 w-4" />
                    <span>
                      Verified:{" "}
                      {format(new Date(skill.verifiedDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {/* Expiry Date */}
                {skill.expiryDate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <IconCalendar className="mr-2 h-4 w-4" />
                    <span>
                      Expires:{" "}
                      {format(new Date(skill.expiryDate), "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {skill.notes && (
                  <p className="text-sm text-muted-foreground border-t pt-2 mt-2">
                    {skill.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Skill Dialog */}
      <AddSkillDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        volunteerId={volunteer.id}
        slug={slug}
        onSuccess={handleSkillAdded}
      />
    </div>
  );
}
