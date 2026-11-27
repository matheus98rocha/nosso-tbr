import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookUser,
  Home,
  Library,
  LogOut,
  MessageSquareQuote,
  MoreHorizontal,
  Plus,
  Shield,
  Timer,
  UserRound,
  Users,
} from "lucide-react";

export const NAV_ICON_MAP: Record<string, LucideIcon> = {
  Início: Home,
  Foco: Timer,
  Estatisticas: BarChart3,
  Resenhas: MessageSquareQuote,
  Comunidade: Users,
  "Ver Estantes": Library,
  Autores: BookUser,
  Administração: Shield,
  "Adicionar Estante": Plus,
  Perfil: UserRound,
  Logout: LogOut,
  Mais: MoreHorizontal,
};
