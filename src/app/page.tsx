import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  redirect(`/${today}`);
}
