export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function toPageResponse<T>(
  content: T[],
  page: number,
  size: number,
  totalElements: number,
): PageResponse<T> {
  return {
    content,
    page,
    size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
  };
}
