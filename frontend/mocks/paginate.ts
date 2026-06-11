import { Page } from "@/types";

export function paginate<T>(items: T[], cursor?: string, pageSize = 10): Page<T> {
  const start = cursor ? Number(cursor) : 0;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    nextCursor: end < items.length ? String(end) : undefined,
  };
}
