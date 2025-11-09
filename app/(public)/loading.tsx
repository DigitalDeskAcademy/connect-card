/**
 * Public Homepage Loading State
 *
 * Skeleton UI displayed while homepage content is loading.
 * Matches page layout to prevent layout shift when content loads.
 *
 * @component Loading
 * @returns {JSX.Element} Skeleton loading state
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-20 space-y-40">
      {/* Hero section skeleton */}
      <div className="relative">
        <div className="flex flex-col items-center text-center space-y-8">
          <Skeleton className="h-7 w-80 mx-auto" />
          <Skeleton className="h-32 w-full max-w-4xl mx-auto" />
          <Skeleton className="h-24 w-full max-w-[700px] mx-auto" />
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Skeleton className="h-12 w-52" />
            <Skeleton className="h-12 w-52" />
          </div>
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
      </div>

      {/* Problem validation section skeleton */}
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-96 mx-auto mb-8" />
        </div>
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="text-center">
            <Skeleton className="h-7 w-96 mx-auto" />
          </div>
        </div>
      </div>

      {/* Story section skeleton */}
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
        </div>
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Workflow section skeleton */}
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-16 w-16 mb-4" />
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-20 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-40 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits section skeleton */}
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-80 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-16 w-16 mb-3" />
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pricing section skeleton */}
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-6 w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="text-center">
                <Skeleton className="h-6 w-32 mx-auto mb-4" />
                <Skeleton className="h-20 w-40 mx-auto mb-2" />
                <Skeleton className="h-5 w-24 mx-auto" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ section skeleton */}
      <div>
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-80 mx-auto mb-4" />
        </div>
        <div className="max-w-3xl mx-auto space-y-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA section skeleton */}
      <div>
        <div className="text-center">
          <Skeleton className="h-10 w-96 mx-auto mb-4" />
          <Skeleton className="h-20 w-full max-w-2xl mx-auto mb-8" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Skeleton className="h-12 w-52" />
            <Skeleton className="h-12 w-52" />
          </div>
          <Skeleton className="h-5 w-96 mx-auto" />
        </div>
      </div>
    </div>
  );
}
