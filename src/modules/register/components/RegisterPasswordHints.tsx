"use client";

import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { RegisterPasswordHintsProps } from "@/modules/register/types";
import {
  PASSWORD_RULE_LABELS,
  type PasswordRuleKey,
  getPasswordRuleStatuses,
} from "@/utils/passwordRules";

const PASSWORD_RULE_ORDER: PasswordRuleKey[] = [
  "minLength",
  "hasLetter",
  "hasNumber",
];

export default function RegisterPasswordHints({
  password,
}: RegisterPasswordHintsProps) {
  const ruleStatuses = getPasswordRuleStatuses(password);

  return (
    <ul
      id="register-password-hints"
      className="mt-2 space-y-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
      role="list"
      aria-label="Requisitos da senha"
    >
      {PASSWORD_RULE_ORDER.map((key) => {
        const ok = ruleStatuses[key];
        return (
          <li key={key} className="flex items-center gap-2" role="listitem">
            {ok ? (
              <Check className="size-4 shrink-0 text-chart-2" aria-hidden />
            ) : (
              <X className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            )}
            <span className={cn(ok && "font-medium text-foreground")}>
              {PASSWORD_RULE_LABELS[key]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
