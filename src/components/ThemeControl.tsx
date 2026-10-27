import { useEffect, useRef, useState } from 'react';
import { IconCheck, IconMonitor, IconMoon, IconSun } from './icons';
import { useTheme, type ThemePreference } from '../hooks/useTheme';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof IconSun }[] = [
  { value: 'system', label: 'Theo hệ thống', icon: IconMonitor },
  { value: 'light', label: 'Sáng', icon: IconSun },
  { value: 'dark', label: 'Tối', icon: IconMoon },
];

// A button + menu rather than a hidden <select>: Chrome treats a clicked <select> as
// :focus-visible, so it showed a focus ring after every mouse click.
export function ThemeControl() {
  const { preference, changeTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[0];
  const Icon = current.icon;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === 'Escape'
          : !rootRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Giao diện: ${current.label}`}
        title="Chọn giao diện sáng, tối hoặc theo hệ thống"
        className={`hover:bg-wash hover:text-ink flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors ${
          open ? 'bg-wash text-ink' : 'text-muted'
        }`}
      >
        <Icon className="h-[18px] w-[18px]" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Giao diện"
          className="border-rule bg-surface shadow-ink/10 absolute top-full right-0 z-40 mt-1 w-48 overflow-hidden rounded-xl border py-1 text-[14px] shadow-lg"
        >
          {OPTIONS.map((o) => {
            const OptionIcon = o.icon;
            const selected = o.value === preference;
            return (
              <button
                key={o.value}
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  changeTheme(o.value);
                  setOpen(false);
                }}
                className={`hover:bg-wash flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left ${
                  selected ? 'text-ink font-semibold' : 'text-ink-2'
                }`}
              >
                <OptionIcon className="text-muted h-4 w-4" />
                <span className="flex-1">{o.label}</span>
                {selected && <IconCheck className="text-accent-700 h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
