import Navbar from "@/components/Navbar";

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
    </>
  );
}
