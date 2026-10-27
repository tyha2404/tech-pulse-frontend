import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeControl() {
  const { preference, changeTheme } = useTheme();
  const Icon = preference === 'system' ? Monitor : preference === 'dark' ? Moon : Sun;

  return (
    <label className="theme-control text-muted hover:bg-wash hover:text-ink relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full">
      <Icon className="pointer-events-none h-[18px] w-[18px]" aria-hidden="true" />
      <select
        aria-label="Giao diện"
        title="Chọn giao diện sáng, tối hoặc theo hệ thống"
        value={preference}
        onChange={(event) => changeTheme(event.target.value as typeof preference)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        <option value="system">Theo hệ thống</option>
        <option value="light">Sáng</option>
        <option value="dark">Tối</option>
      </select>
    </label>
  );
}
