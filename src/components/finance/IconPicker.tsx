"use client";
import { ICONS, ICON_KEYS } from "./icons";

type Props = {
  value: string;
  changeAction: (key: string) => void;
};

export default function IconPicker({ value, changeAction }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICON_KEYS.map((k) => {
        const Icon = ICONS[k];
        const active = k === value;
        return (
          <button
            key={k}
            type="button"
            aria-label={`Choose icon ${k}`}
            aria-pressed={active}
            onClick={() => changeAction(k)}
            className={`grid h-10 w-10 place-items-center rounded-lg border transition
              ${active ? "border-brand-500 ring-2 ring-brand-300" : "border-zinc-200 hover:border-zinc-300"}`}
            title={k}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
