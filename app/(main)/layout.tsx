import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { AuthUserProvider } from "@/components/auth-user-provider";
import Navbar from "@/components/Navbar";
import { Assistant } from "@/components/studysync/assistant";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return (
    <AuthUserProvider userId={userId} key={userId}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main className="demo-main" id="main-content">
        {children}
      </main>
      <Assistant />
    </AuthUserProvider>
  );
}
