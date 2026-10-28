import type { RegistrationMode } from "@/lib/auth/registrationMode";

export type RegistrationModeSectionProps = {
  mode: RegistrationMode | null;
  isLoading: boolean;
  isError: boolean;
  pending: boolean;
  description: string;
  openRegistrationUrl: string;
  copied: boolean;
  onModeChange: (mode: RegistrationMode) => void;
  onCopyLink: () => void;
};
