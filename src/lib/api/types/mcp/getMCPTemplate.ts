import { Resource } from '../resource';

export const GetMCPTemplate = (
  secretKey: string,
  secretName: string,
  secretNamespace: string,
): Resource<string> => {
  return {
    path: `/api/v1/namespaces/${secretNamespace}/secrets/${secretName}`,
    jq: `.data.${secretKey} | @base64d `,
  };
};
