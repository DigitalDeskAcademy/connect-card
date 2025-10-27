/**
 * N2N (New to Newlife) - Visitor Engagement Tracking
 *
 * Core connect card workflow for categorizing and following up with visitors:
 * - First visit → Second visit → Regular attendee → Member → Other
 * - Connect card scanning and OCR
 * - Visitor follow-up workflow
 * - Member type management (VISITOR, RETURNING, MEMBER, VOLUNTEER, STAFF)
 */

import { PageContainer } from "@/components/layout/page-container";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function N2NPage() {
  return (
    <PageContainer as="main">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">N2N - New to Newlife</CardTitle>
          <CardDescription>
            Visitor engagement tracking and connect card workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Connect card scanning and visitor categorization coming soon.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <p className="font-medium">Planned Features:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Scan physical connect cards with OCR</li>
              <li>
                Categorize visitors: First visit, Second visit, Regular, Member
              </li>
              <li>Follow-up task assignments</li>
              <li>Integration with GHL SMS automations</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
