import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookUser,
  Home,
  Library,
  LogOut,
  MoreHorizontal,
  Plus,
  Shield,
  UserRound,
  Users,
} from "lucide-react";

export const NAV_ICON_MAP: Record<string, LucideIcon> = {
  Início: Home,
  Estatisticas: BarChart3,
  Comunidade: Users,
  "Ver Estantes": Library,
  Autores: BookUser,
  Administração: Shield,
  "Adicionar Estante": Plus,
  Perfil: UserRound,
  Logout: LogOut,
  Mais: MoreHorizontal,
};
