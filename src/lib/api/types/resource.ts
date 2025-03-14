// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Resource<_T> {
    path: string | null;
    jq?: string;
    method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
    body?: string;
  }
  