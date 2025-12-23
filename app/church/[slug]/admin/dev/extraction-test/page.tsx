import { PageContainer } from "@/components/layout/page-container";
import { ExtractionTestClient } from "./extraction-test-client";

export default async function ExtractionTestPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PageContainer as="main">
      <ExtractionTestClient slug={slug} />
    </PageContainer>
  );
}
