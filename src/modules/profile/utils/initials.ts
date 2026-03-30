export function initialsFromEmail(email: string) {
  const local = email.split("@")[0] ?? email;
  const parts = local
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || "?";
}

export function initialsFromDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  }
  const compact = parts[0] ?? displayName;
  return compact.slice(0, 2).toUpperCase() || "?";
}
