import { Page } from "@/types";

export function paginate<T>(items: T[], cursor?: string, pageSize = 10): Page<T> {
  const startIndexOfPage = cursor ? Number(cursor) : 0;
  const endIndexOfPage = startIndexOfPage + pageSize;

  return {
    items: items.slice(startIndexOfPage, endIndexOfPage),
    nextCursor: endIndexOfPage < items.length ? String(endIndexOfPage) : undefined,
  };
}
