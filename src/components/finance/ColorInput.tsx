"use client";
import { useId } from "react";

type Props = {
  value: string;             
  changeAction: (hex: string) => void;
  label?: string;
};

export default function ColorInput({ value, changeAction, label = "Color" }: Props) {
  const id = useId();

  function setHex(v: string) {
    if (!v) return changeAction("#10B981");
    let hex = v.trim();
    if (!hex.startsWith("#")) hex = `#${hex}`;
    if (/^#([0-9A-Fa-f]{6})$/.test(hex)) changeAction(hex);
  }

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="label">{label}</label>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md border border-zinc-300" style={{ backgroundColor: value }} />
          <span className="text-xs text-zinc-500">{value.toUpperCase()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          className="h-10 w-16 cursor-pointer rounded-md border border-zinc-300 bg-white"
          value={value}
          onChange={(e) => changeAction(e.target.value)}
          aria-label="Choose color"
        />
        <input
          className="input"
          placeholder="#10B981"
          value={value}
          onChange={(e) => setHex(e.target.value)}
        />
      </div>
    </div>
  );
}
