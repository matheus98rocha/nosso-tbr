// src/utils/dateUtils.ts
export class DateUtils {
  /**
   * Converte Date object para ISO string (yyyy-mm-dd)
   * Este é o método que estava faltando!
   */
  static dateToISO(date: Date): string {
    if (!date || isNaN(date.getTime())) return "";

    // Usa toISOString e pega apenas a parte da data
    return date.toISOString().split("T")[0];
  }

  /**
   * Converte string pt-BR (dd/mm/yyyy) para ISO (yyyy-mm-dd)
   */
  static ptBRToISO(datePtBR: string): string {
    if (!datePtBR) return "";

    try {
      // Se já estiver no formato ISO, retorna diretamente
      if (datePtBR.includes("-") && datePtBR.length === 10) {
        return datePtBR;
      }

      // Converte de pt-BR (dd/mm/yyyy) para ISO (yyyy-mm-dd)
      const [day, month, year] = datePtBR.split("/");

      if (!day || !month || !year) {
        return datePtBR;
      }

      // Valida se os componentes são números válidos
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        return datePtBR;
      }

      // Formata para ISO (yyyy-mm-dd)
      return `${yearNum}-${monthNum.toString().padStart(2, "0")}-${dayNum
        .toString()
        .padStart(2, "0")}`;
    } catch {
      return datePtBR;
    }
  }

  /**
   * Converte ISO (yyyy-mm-dd) para pt-BR (dd/mm/yyyy)
   */
  static isoToPtBR(isoDate: string): string {
    if (!isoDate) return "";

    try {
      // Se já estiver no formato pt-BR, retorna diretamente
      if (isoDate.includes("/") && isoDate.length === 10) {
        return isoDate;
      }

      // Converte de ISO (yyyy-mm-dd) para pt-BR (dd/mm/yyyy)
      const [year, month, day] = isoDate.split("-");

      if (!day || !month || !year) {
        return isoDate;
      }

      // Valida se os componentes são números válidos
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);

      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        return isoDate;
      }

      // Formata para pt-BR (dd/mm/yyyy)
      return `${dayNum.toString().padStart(2, "0")}/${monthNum
        .toString()
        .padStart(2, "0")}/${yearNum}`;
    } catch {
      return isoDate;
    }
  }

  /**
   * Converte para Date object considerando fuso horário
   */
  static toDate(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;

    try {
      const dateObj = new Date(date);
      // Adiciona meio-dia para evitar problemas de fuso
      dateObj.setHours(12, 0, 0, 0);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    } catch {
      return null;
    }
  }

  /**
   * Converte para formato ISO string (yyyy-mm-dd)
   */
  static toISOString(date: Date | string | null | undefined): string {
    if (!date) return "";

    const dateObj = this.toDate(date);
    if (!dateObj) return "";

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Formata para exibição (dd/mm/yyyy)
   */
  static formatForDisplay(date: string | Date | null | undefined): string {
    if (!date) return "";

    try {
      const dateObj = this.toDate(date);
      if (!dateObj) return "";

      return dateObj.toLocaleDateString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "";
    }
  }

  /**
   * Verifica se é uma data válida
   */
  static isValid(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    try {
      const dateObj = this.toDate(date);
      return !!dateObj && !isNaN(dateObj.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Cria uma data local (evita problemas de fuso horário)
   */
  static createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
}
