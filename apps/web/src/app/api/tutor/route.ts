import { NextResponse } from "next/server";
import { tutorAskSchema } from "@/lib/validation";
import { apiViewer, route } from "@/server/authz";
import { askTutor } from "@/server/services/tutor";

export const POST = route(async (req) => {
  const v = await apiViewer();
  const input = tutorAskSchema.parse(await req.json());
  return NextResponse.json(await askTutor(v, input));
});
