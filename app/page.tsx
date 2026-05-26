import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import LandingClient from "./LandingClient";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session?.accessToken) redirect("/discover");
  return <LandingClient />;
}
