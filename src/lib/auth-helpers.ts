import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getAuthSessionUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.userId;
  return typeof userId === "string" ? userId : null;
}
