"use client";

interface ShortcutItem {
  key: string;
  ctrl?: boolean;
  description: string;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutItem[];
  className?: string;
}

export function KeyboardShortcuts({ shortcuts, className = "" }: KeyboardShortcutsProps) {
  return (
    <div
      className={`text-xs text-zinc-500 ${className}`}
      role="list"
      aria-label="Keyboard shortcuts"
    >
      {shortcuts.map((shortcut) => (
        <div key={shortcut.key} className="flex items-center gap-2" role="listitem">
          <kbd className="rounded border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px]">
            {shortcut.ctrl && <span className="mr-1">Ctrl/Cmd +</span>}
            {shortcut.key}
          </kbd>
          <span>{shortcut.description}</span>
        </div>
      ))}
    </div>
  );
}
