import { useEffect, useState } from "react";
import { Activity, Settings, Puzzle, BarChart3, MessageSquare, Stethoscope, Info, LucideIcon } from "lucide-react";

export type Page = "status" | "config" | "platforms" | "skills" | "usage" | "diagnosis" | "about";

const navItems: { id: Page; label: string; Icon: LucideIcon }[] = [
  { id: "status", label: "仪表盘", Icon: Activity },
  { id: "config", label: "模型配置", Icon: Settings },
  { id: "platforms", label: "消息渠道", Icon: MessageSquare },
  { id: "skills", label: "Skills", Icon: Puzzle },
  { id: "usage", label: "Token 统计", Icon: BarChart3 },
  { id: "diagnosis", label: "诊断修复", Icon: Stethoscope },
  { id: "about", label: "关于", Icon: Info },
];

interface SidebarProps {
  current: Page;
  onChange: (p: Page) => void;
}

const THEME_PRESETS = [
  { id: "github-dark", label: "深色" },
  { id: "frost", label: "浅色" },
];

function applyTheme(themeId: string) {
  document.documentElement.setAttribute("data-ui-theme", themeId);
}

export function Sidebar({ current, onChange }: SidebarProps) {
  const [themeIndex, setThemeIndex] = useState(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("clawb-theme");
    const nextIndex = THEME_PRESETS.findIndex((item) => item.id === saved);
    const resolvedIndex = nextIndex >= 0 ? nextIndex : 0;
    setThemeIndex(resolvedIndex);
    applyTheme(THEME_PRESETS[resolvedIndex].id);
  }, []);

  const cycleTheme = () => {
    const nextIndex = (themeIndex + 1) % THEME_PRESETS.length;
    const next = THEME_PRESETS[nextIndex];
    setThemeIndex(nextIndex);
    window.localStorage.setItem("clawb-theme", next.id);
    applyTheme(next.id);
  };

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      <div
        style={{
          padding: "20px 20px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="42 38 168 176"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 70 160 C 40 110, 90 40, 150 50 C 145 70, 130 100, 135 125 C 140 140, 180 100, 200 80 C 220 100, 160 180, 105 195"
            stroke="var(--accent-blue)"
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
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "0.01em",
          }}
        >
          ClawB
        </span>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "4px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {navItems.map(({ id, label, Icon }) => {
          const active = current === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                textAlign: "left",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                background: active ? "var(--accent-soft)" : "transparent",
                transition: "all 0.1s ease",
                cursor: "pointer",
                border: "none",
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
              {label}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          padding: "16px 12px",
          borderTop: "1px solid var(--sidebar-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>v0.1.0</span>
        <button
          onClick={cycleTheme}
          title={`切换主题: ${THEME_PRESETS[themeIndex]?.label}`}
          style={{
            padding: "5px 10px",
            borderRadius: "var(--radius-sm)",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
            background: "transparent",
            border: "1px solid var(--card-border)",
            cursor: "pointer",
            transition: "all 0.1s ease",
          }}
        >
          {THEME_PRESETS[themeIndex]?.label}
        </button>
      </div>
    </aside>
  );
}
