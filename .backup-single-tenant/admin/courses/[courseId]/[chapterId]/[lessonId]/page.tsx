import { adminGetLesson } from "@/app/data/admin/admin-get-lesson";
import { LessonForm } from "./_components/LessonForm";

interface Props {
  params: Promise<{
    courseId: string;
    chapterId: string;
    lessonId: string;
  }>;
}

export default async function LessonIdPage({ params }: Props) {
  const { courseId, chapterId, lessonId } = await params;

  const lesson = await adminGetLesson(lessonId);

  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
}
