import { useEffect, useState } from "react";
import { Minus, Square, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

declare global {
  interface Window {
    __TAURI__?: object;
  }
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const checkMaximized = async () => {
      if (window.__TAURI__) {
        try {
          const win = await import("@tauri-apps/api/window");
          const maximized = await win.getCurrentWindow().isMaximized();
          setIsMaximized(maximized);
        } catch {}
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    if (window.__TAURI__) {
      const win = await import("@tauri-apps/api/window");
      await win.getCurrentWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (window.__TAURI__) {
      const win = await import("@tauri-apps/api/window");
      const win_ = win.getCurrentWindow();
      if (isMaximized) {
        await win_.unmaximize();
      } else {
        await win_.maximize();
      }
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = async () => {
    if (window.__TAURI__) {
      const win = await import("@tauri-apps/api/window");
      await win.getCurrentWindow().close();
    }
  };

  const isDark = theme === "github-dark";

  return (
    <div
      data-tauri-drag-region
      style={{
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 12,
        paddingRight: 4,
        background: isDark ? "#0D1117" : "#FFFFFF",
        borderBottom: `1px solid ${isDark ? "#21262D" : "#E5E7EB"}`,
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: isDark ? "#8B949E" : "#6B7280",
        }}
      >
        ClawB
      </span>

      <div style={{ display: "flex", gap: 2 }}>
        <button
          onClick={handleMinimize}
          style={{
            width: 36,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            color: isDark ? "#8B949E" : "#6B7280",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#21262D" : "#F3F4F6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          style={{
            width: 36,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            color: isDark ? "#8B949E" : "#6B7280",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? "#21262D" : "#F3F4F6")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {isMaximized ? <Square size={12} /> : <Square size={12} />}
        </button>
        <button
          onClick={handleClose}
          style={{
            width: 36,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            color: isDark ? "#8B949E" : "#6B7280",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F85149")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}