import { useEffect, useState } from "react";
import { Activity, Settings, Puzzle, BarChart3, MessageSquare, Stethoscope, Sparkles, Info, LucideIcon } from "lucide-react";

export type Page = "status" | "config" | "platforms" | "skills" | "usage" | "diagnosis" | "about";

const navItems: { id: Page; label: string; Icon: LucideIcon }[] = [
  { id: "status", label: "运行状态", Icon: Activity },
  { id: "config", label: "模型接入", Icon: Settings },
  { id: "platforms", label: "平台", Icon: MessageSquare },
  { id: "skills", label: "Skills", Icon: Puzzle },
  { id: "usage", label: "Token", Icon: BarChart3 },
  { id: "diagnosis", label: "治疗龙虾", Icon: Stethoscope },
  { id: "about", label: "关于", Icon: Info },
];

interface SidebarProps {
  current: Page;
  onChange: (p: Page) => void;
}

const THEME_PRESETS = [
  { id: "github-dark", label: "GitHub Dark" },
  { id: "frost", label: "Frost" },
];

function applyTheme(themeId: string) {
  document.documentElement.setAttribute("data-ui-theme", themeId);
}

export function Sidebar({ current, onChange }: SidebarProps) {
  const [themeIndex, setThemeIndex] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("yy-longxia-theme");
    const nextIndex = THEME_PRESETS.findIndex((item) => item.id === saved);
    const resolvedIndex = nextIndex >= 0 ? nextIndex : 0;
    setThemeIndex(resolvedIndex);
    applyTheme(THEME_PRESETS[resolvedIndex].id);
  }, []);

  const cycleTheme = () => {
    const nextIndex = (themeIndex + 1) % THEME_PRESETS.length;
    const next = THEME_PRESETS[nextIndex];
    setThemeIndex(nextIndex);
    window.localStorage.setItem("yy-longxia-theme", next.id);
    applyTheme(next.id);
  };

  return (
    <aside
      style={{
        width: 212,
        paddingTop: 20,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        background: "var(--sidebar-bg)",
      }}
    >
      {/* App Logo */}
      <div
        style={{
          padding: "0 22px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="42 38 168 176"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M 70 160 C 40 110, 90 40, 150 50 C 145 70, 130 100, 135 125 C 140 140, 180 100, 200 80 C 220 100, 160 180, 105 195"
            stroke="var(--text-primary)"
            strokeWidth="12"
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          <path
            d="M 56 164 L 71 179 L 56 194"
            stroke="var(--accent-blue)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="76"
            y1="194"
            x2="96"
            y2="194"
            stroke="var(--accent-blue)"
            strokeWidth="10"
            strokeLinecap="butt"
          />
        </svg>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: "var(--text-tertiary)",
          }}
        >
          ClawB
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: active ? 600 : 450,
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                background: active ? "var(--accent-soft)" : "transparent",
                transition: "all 0.15s ease",
                cursor: "default",
                border: "none",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "var(--card-bg-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon size={17} style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 18px 16px" }}>
        <button
          onClick={cycleTheme}
          title={`切换主题 · ${THEME_PRESETS[themeIndex]?.label ?? "Frost"}`}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-blue)",
            background: "transparent",
            border: "none",
            cursor: "default",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--card-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Sparkles size={15} />
        </button>
      </div>
    </aside>
  );
}
