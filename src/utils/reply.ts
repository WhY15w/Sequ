export type ReplyPayload<T = unknown> = {
  success: boolean;
  message: string;
  code: number;
  data?: T;
  status?: number;
  [key: string]: unknown;
};

const reply = <T = unknown>(payload: ReplyPayload<T>): ReplyPayload<T> => {
  return payload;
};

export const success = <T = unknown>(
  data?: T,
  message = "数据返回成功",
  code = 200,
  extra: Record<string, unknown> = {},
) =>
  reply({
    success: true,
    message,
    code,
    ...(data === undefined ? {} : { data }),
    ...extra,
  });

export const fail = <T = unknown>(
  message = "数据返回失败",
  data?: T,
  code = 500,
  extra: Record<string, unknown> = {},
) =>
  reply({
    success: false,
    message,
    code,
    ...(data === undefined ? {} : { data }),
    ...extra,
  });

export const badRequest = <T = unknown>(
  message = "请求参数错误",
  data?: T,
  extra: Record<string, unknown> = {},
) => fail(message, data, 400, extra);

export const unauthorized = <T = unknown>(
  message = "未授权",
  data?: T,
  extra: Record<string, unknown> = {},
) => fail(message, data, 401, extra);

export const forbidden = <T = unknown>(
  message = "禁止访问",
  data?: T,
  extra: Record<string, unknown> = {},
) => fail(message, data, 403, extra);

export const notFound = <T = unknown>(
  message = "资源未找到",
  data?: T,
  extra: Record<string, unknown> = {},
) => fail(message, data, 404, extra);

export const internalServerError = <T = unknown>(
  message = "服务器内部错误",
  data?: T,
  extra: Record<string, unknown> = {},
) => fail(message, data, 500, extra);

export { reply };
