/**
 * Строка для быстрого поиска по заявкам. SQLite не умеет регистронезависимый
 * поиск по кириллице, поэтому нормализуем данные заранее средствами JS.
 */
export function buildRequestSearchIndex(parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part) => part !== null && part !== undefined && String(part).trim() !== '')
    .join(' ')
    .toLowerCase();
}
