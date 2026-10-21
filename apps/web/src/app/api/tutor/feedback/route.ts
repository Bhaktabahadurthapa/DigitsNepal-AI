import { NextResponse } from "next/server";
import { z } from "zod";
import { apiViewer, route } from "@/server/authz";
import { rateMessage } from "@/server/services/tutor";

const schema = z.object({ messageId: z.uuid(), rating: z.union([z.literal(1), z.literal(-1)]), comment: z.string().max(1000).optional() });

export const POST = route(async (req) => {
  const v = await apiViewer();
  const b = schema.parse(await req.json());
  await rateMessage(v, b.messageId, b.rating, b.comment);
  return NextResponse.json({ ok: true });
});
