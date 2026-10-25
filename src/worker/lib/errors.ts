export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", message, details);

export const unauthorized = (message = "Bạn cần đăng nhập") =>
  new AppError(401, "UNAUTHORIZED", message);

export const forbidden = (message = "Bạn không có quyền thực hiện thao tác này") =>
  new AppError(403, "FORBIDDEN", message);

export const notFound = (message = "Không tìm thấy dữ liệu") =>
  new AppError(404, "NOT_FOUND", message);

export const conflict = (code: string, message: string, details?: unknown) =>
  new AppError(409, code, message, details);

export const tooManyRequests = (message = "Bạn thao tác quá nhanh, vui lòng thử lại sau") =>
  new AppError(429, "RATE_LIMITED", message);

export const serverError = (message = "Đã có lỗi xảy ra, vui lòng thử lại") =>
  new AppError(500, "INTERNAL_ERROR", message);
