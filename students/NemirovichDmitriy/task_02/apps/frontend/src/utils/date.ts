export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toISODate(dateString: string): string {
  // input: YYYY-MM-DD, output: YYYY-MM-DDT00:00:00.000Z
  return new Date(dateString).toISOString();
}

export function toInputDate(isoString: string): string {
  // output: YYYY-MM-DD
  return isoString.slice(0, 10);
}
