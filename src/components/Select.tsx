import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { IconCheck, IconChevronDown } from './icons';

export interface SelectOption<T extends string | number> {
  value: T;
  label: string;
  /** Secondary text on the right of the option, e.g. an article count. */
  hint?: string;
}

interface SelectProps<T extends string | number> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Accessible name; pair with a visible <label htmlFor={id}>. */
  label: string;
  id?: string;
  className?: string;
}

const MENU_GAP = 4;
const MENU_MAX_H = 288;
const MENU_MIN_W = 192;

// Type-ahead compares without Vietnamese diacritics, so "nguon" finds "Nguồn".
const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();

/** Project-styled replacement for the native <select>: a button that opens a listbox.
 *  The list is position:fixed so it escapes scroll containers (filter popover, modals). */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  id,
  className = '',
}: SelectProps<T>) {
  const autoId = useId();
  const buttonId = id ?? `${autoId}-button`;
  const listId = `${autoId}-list`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', timer: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const selected = options[selectedIndex];

  const place = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - MENU_GAP - 8;
    const above = rect.top - MENU_GAP - 8;
    const openUp = below < 200 && above > below;
    const width = Math.max(rect.width, MENU_MIN_W);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    setMenuStyle({
      position: 'fixed',
      left: Math.max(8, left),
      width,
      maxHeight: Math.min(MENU_MAX_H, openUp ? above : below),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP }),
    });
  }, []);

  const openList = () => {
    setActive(selectedIndex);
    place();
    setOpen(true);
  };

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    close(true);
  };

  // Follow the trigger while open (page or popover scroll, resize); close on outside press.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!buttonRef.current?.contains(target) && !listRef.current?.contains(target)) close(false);
    };
    const onScroll = (e: Event) => {
      if (e.target !== listRef.current) place();
    };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  useLayoutEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const onTriggerKey = (e: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => Math.min(last, active + 1),
      ArrowUp: () => Math.max(0, active - 1),
      Home: () => 0,
      End: () => last,
      PageDown: () => Math.min(last, active + 8),
      PageUp: () => Math.max(0, active - 8),
    };
    if (moves[e.key]) {
      e.preventDefault();
      setActive(moves[e.key]());
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      // Keep the surrounding popover or modal open: only the list closes.
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = typeahead.current;
      window.clearTimeout(t.timer);
      t.text += fold(e.key);
      t.timer = window.setTimeout(() => (t.text = ''), 600);
      const match = options.findIndex((o) => fold(o.label).startsWith(t.text));
      if (match >= 0) setActive(match);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        className={`bg-surface text-ink hover:border-rule-strong flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg border px-3 text-left text-[14px] transition-colors ${
          open ? 'border-ink-2' : 'border-rule'
        } ${className}`}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label}</span>
        <IconChevronDown
          className={`text-muted h-4 w-4 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${autoId}-opt-${active}`}
          onKeyDown={onListKey}
          style={menuStyle}
          className="no-scrollbar border-rule bg-surface shadow-ink/10 z-50 overflow-y-auto overscroll-contain rounded-xl border py-1 text-[14px] shadow-lg focus:outline-none"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={String(o.value)}
                id={`${autoId}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onMouseMove={() => i !== active && setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 ${
                  i === active ? 'bg-wash' : ''
                } ${isSelected ? 'text-ink font-semibold' : 'text-ink-2'}`}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {o.hint && (
                  <span className="score-numeral text-faint shrink-0 text-[13px] font-normal">
                    {o.hint}
                  </span>
                )}
                <IconCheck
                  className={`text-accent-700 h-4 w-4 shrink-0 ${isSelected ? '' : 'invisible'}`}
                />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
