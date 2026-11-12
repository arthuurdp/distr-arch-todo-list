export type ErrorDetails = Record<string, string>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
  }
}
