import { NextResponse } from "next/server";
import { createCourseSchema } from "@/lib/validation";
import { apiRole, route } from "@/server/authz";
import { createCourse } from "@/server/services/courses";

export const POST = route(async (req) => {
  const v = await apiRole("educator");
  const course = await createCourse(v, createCourseSchema.parse(await req.json()));
  return NextResponse.json({ id: course.id }, { status: 201 });
});
