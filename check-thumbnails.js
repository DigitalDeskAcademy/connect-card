const { PrismaClient } = require("./lib/generated/prisma");
const prisma = new PrismaClient();

async function checkThumbnails() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        fileKey: true,
      },
    });

    console.log("Courses and their fileKeys:");
    courses.forEach(c => {
      console.log(`- ${c.title}: "${c.fileKey}"`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

checkThumbnails();
