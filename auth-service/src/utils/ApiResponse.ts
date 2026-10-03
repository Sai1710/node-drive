export class ApiResponse<T = any> {
  public statusCode: number;
  public data: T | null;
  public message: string;
  public success: boolean;

  constructor(
    statusCode: number,
    data: T | null = null,
    message: string = "Success",
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
