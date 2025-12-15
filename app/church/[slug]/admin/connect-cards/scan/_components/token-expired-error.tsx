"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TokenExpiredErrorProps {
  slug: string;
  message?: string;
}

export function TokenExpiredError({ slug, message }: TokenExpiredErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {message || "This scan link has expired or is no longer valid."}
          </p>
          <div className="space-y-3 w-full">
            <p className="text-xs text-muted-foreground">
              Ask the person at the computer to generate a new QR code.
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href={`/church/${slug}/admin/connect-cards`}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Connect Cards
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
