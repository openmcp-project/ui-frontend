export type ProviderConfigsData = {
  provider: string;
  name: string;
  versions: [
    {
      name: string;
    },
  ];
};

export type ProviderConfigsDataForRequest = {
  provider: string;
  url: string;
  version: string;
};

export type ProviderConfigs = {
  provider: string;
  items: [
    {
      kind: string;
      metadata: {
        provider: string;
        name: string;
        usage: string;
        creationTimestamp: string;
      };
      status: {
        count: string;
      };
    },
  ];
};
