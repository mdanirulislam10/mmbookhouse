"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Field";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Password box with a show / hide button, so people can check what they typed. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(function PasswordInput({ className, ...props }, ref) {
  const { t } = useT();
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={shown ? "text" : "password"} className={cn("pr-11", className)} autoCapitalize="none" autoCorrect="off" spellCheck={false} {...props} />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? t("auth.hidePassword") : t("auth.showPassword")}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800"
      >
        {shown ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
});
