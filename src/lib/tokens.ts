/**
 * Lê um token CSS (`--ork-*`) em tempo de execução a partir de `:root`.
 * Fonte única de valores de cor: os hexadecimais vivem apenas em `index.css`.
 * Usado para montar o tema do xterm sem duplicar valores à mão (§5).
 */
export function readToken(name: string): string {
  if (typeof document === "undefined") return "";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || "";
}
