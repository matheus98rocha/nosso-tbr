export type PasswordRuleKey = "minLength" | "hasLetter" | "hasNumber";

export function passwordMeetsMinLength(value: string): boolean {
  return value.length >= 8;
}

export function passwordHasLetter(value: string): boolean {
  return /\p{L}/u.test(value);
}

export function passwordHasNumber(value: string): boolean {
  return /\d/.test(value);
}

export function getPasswordRuleStatuses(
  password: string,
): Record<PasswordRuleKey, boolean> {
  return {
    minLength: passwordMeetsMinLength(password),
    hasLetter: passwordHasLetter(password),
    hasNumber: passwordHasNumber(password),
  };
}

export const PASSWORD_RULE_LABELS: Record<PasswordRuleKey, string> = {
  minLength: "Pelo menos 8 caracteres",
  hasLetter: "Pelo menos uma letra",
  hasNumber: "Pelo menos um número",
};
