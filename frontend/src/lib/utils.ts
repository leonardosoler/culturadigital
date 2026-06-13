import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatarData(data: string | null | undefined): string {
  if (!data) return "-"
  const partes = data.split("-")
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

export function formatarMoeda(valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "-"
  const numero = typeof valor === "string" ? parseFloat(valor) : valor
  if (Number.isNaN(numero)) return "-"
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
