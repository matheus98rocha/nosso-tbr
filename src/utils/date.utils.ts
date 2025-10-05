// src/utils/dateUtils.ts
export class DateUtils {
  static dateToISO(date: Date): string {
    if (!date || isNaN(date.getTime())) return "";

    return date.toISOString().split("T")[0];
  }

  static ptBRToISO(datePtBR: string): string {
    if (!datePtBR) return "";

    // Se já estiver no formato ISO, retorna diretamente
    if (datePtBR.includes("-") && datePtBR.length === 10) {
      return datePtBR;
    }

    const [day, month, year] = datePtBR.split("/");

    if (!day || !month || !year) {
      return datePtBR;
    }

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      return datePtBR;
    }

    return `${yearNum}-${monthNum.toString().padStart(2, "0")}-${dayNum
      .toString()
      .padStart(2, "0")}`;
  }

  static isoToPtBR(isoDate: string): string {
    if (!isoDate) return "";

    if (isoDate.includes("/") && isoDate.length === 10) {
      return isoDate;
    }

    const [year, month, day] = isoDate.split("-");

    if (!day || !month || !year) {
      return isoDate;
    }

    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
      return isoDate;
    }

    return `${dayNum.toString().padStart(2, "0")}/${monthNum
      .toString()
      .padStart(2, "0")}/${yearNum}`;
  }

  static toDate(date: string | Date | null | undefined): Date | null {
    if (!date) return null;
    if (date instanceof Date) return date;

    let dateObj: Date;

    // 🚨 NOVO: Se a string é ISO (YYYY-MM-DD), force a criação como data LOCAL
    if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Usa YYYY, MM e DD para criar a data no fuso horário local (sem desvio)
      const [year, month, day] = date.split("-").map(Number);
      dateObj = new Date(year, month - 1, day); // month - 1 porque o Date usa 0-11
    } else {
      dateObj = new Date(date);
    } // Mantém o ajuste para meio-dia para neutralizar qualquer desvio de fuso

    dateObj.setHours(12, 0, 0, 0);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  }
  static toISOString(date: Date | string | null | undefined): string {
    if (!date) return "";

    const dateObj = this.toDate(date);
    if (!dateObj) return "";

    return dateObj.toISOString().split("T")[0];
  }

  static formatForDisplay(date: string | Date | null | undefined): string {
    if (!date) return "";

    const dateObj = this.toDate(date);
    if (!dateObj) return "";

    return dateObj.toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  static isValid(date: string | Date | null | undefined): boolean {
    if (!date) return false;

    const dateObj = this.toDate(date);
    return !!dateObj && !isNaN(dateObj.getTime());
  }

  static createLocalDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
}
