import { Resource } from "../resource";

export const FluxGitRepo: Resource<any> = {
    path: "/apis/source.toolkit.fluxcd.io/v1/gitrepositories",
    jq: "[.items[]]",
  };