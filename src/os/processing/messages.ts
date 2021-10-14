import { StatusCode } from "../types";

export type ProcessMessage<U> =
  | Readonly<{
      type: "process-end";
      statusCode: StatusCode.OK;
      resultValue: U;
    }>
  | Readonly<{
      type: "process-end";
      statusCode: StatusCode.ERROR;
    }>
  | Readonly<{
      type: "process-skip-tick";
    }>;
