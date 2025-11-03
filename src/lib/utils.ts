import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Evita problemas de fuso (new Date('YYYY-MM-DD') usa UTC)
// Constrói a data no horário local, preservando o dia informado.
export function parseLocalDate(dateStr: string): Date {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
