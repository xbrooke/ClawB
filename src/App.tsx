import { useState, type ReactNode } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { StatusPage } from "./pages/StatusPage";
import { DiagnosisPage } from "./pages/DiagnosisPage";
import { ConfigPage } from "./pages/ConfigPage";
import { SkillsPage } from "./pages/SkillsPage";
import { TokenUsagePage } from "./pages/TokenUsagePage";
import { PlatformsPage } from "./pages/PlatformsPage";
import { AboutPage } from "./pages/AboutPage";
import { InstallPage } from "./pages/InstallPage";

export default function App() {
  const [page, setPage] = useState<Page>("status");
  const [visitedPages, setVisitedPages] = useState<Page[]>(["status"]);

  const handlePageChange = (nextPage: Page) => {
    setPage(nextPage);
    setVisitedPages((prev) => (prev.includes(nextPage) ? prev : [...prev, nextPage]));
  };

  const pageContent: Record<Page, ReactNode> = {
    status: <StatusPage onNavigate={handlePageChange} />,
    config: <ConfigPage />,
    platforms: <PlatformsPage />,
    skills: <SkillsPage />,
    usage: <TokenUsagePage />,
    about: <AboutPage />,
    diagnosis: <DiagnosisPage onNavigate={handlePageChange} />,
    install: <InstallPage />,
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        background: "var(--window-bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <Sidebar current={page} onChange={handlePageChange} />

        <main
          style={{
            flex: 1,
            height: "100%",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, position: "relative", padding: "var(--content-padding)", overflowY: "auto" }}>
            {visitedPages.map((entry) => (
              <div
                key={entry}
                style={{
                  position: "absolute",
                  inset: 0,
                  paddingRight: "var(--content-padding)",
                  display: page === entry ? "block" : "none",
                  animation: page === entry ? "fadeIn 0.2s ease-in-out" : "",
                  overflowY: "auto",
                }}
              >
                {pageContent[entry]}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}