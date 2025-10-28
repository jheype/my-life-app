"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSun, FaMoon } from "react-icons/fa6";
import { applyTheme, loadInitialTheme } from "@/lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(loadInitialTheme());
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button
    onClick={toggle}
    className="grid h-9 w-9 place-items-center rounded-full border transition-colors hover:opacity-90"
    style={{ backgroundColor: "var(--color-base-card)", borderColor: "var(--color-base-border)" }}
    aria-label="Toggle theme"
    title="Toggle theme"
    >
    <AnimatePresence mode="popLayout" initial={false}>
        {theme === "dark" ? (
        <motion.span
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <FaSun className="text-yellow-400" />
        </motion.span>
        ) : (
        <motion.span
            key="moon"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
        >
            <FaMoon className="text-zinc-700" />
        </motion.span>
        )}
    </AnimatePresence>
    </button>
  );
}
