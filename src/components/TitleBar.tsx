import { useEffect, useState } from "react";
import { Minus, Square, X, MinusSquare } from "lucide-react";

declare global {
  interface Window {
    __TAURI__?: object;
  }
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

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
        background: "var(--window-bg)",
        borderBottom: "1px solid var(--sidebar-border)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "var(--text-secondary)",
        }}
      >
        ClawB
      </span>

      <div style={{ display: "flex", gap: 2 }}>
        <button
          onClick={handleMinimize}
          style={{
            width: 36,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-xs)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "background 0.1s ease, color 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--card-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Minus size={14} />
        </button>
        <button
          onClick={handleMaximize}
          style={{
            width: 36,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-xs)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "background 0.1s ease, color 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--card-bg-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {isMaximized ? <MinusSquare size={14} /> : <Square size={12} />}
        </button>
        <button
          onClick={handleClose}
          style={{
            width: 36,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-xs)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "var(--text-secondary)",
            transition: "background 0.1s ease, color 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-red)";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
