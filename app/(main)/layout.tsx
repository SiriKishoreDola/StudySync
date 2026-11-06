import Navbar from "@/components/Navbar";
import { Assistant } from "@/components/studysync/assistant";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main className="demo-main" id="main-content">
        {children}
      </main>
      <Assistant />
    </>
  );
}
