export type ManagedControlPlaneTemplateList = {
  apiVersion: string;
  items: ManagedControlPlaneTemplate[];
};

export type ManagedControlPlaneTemplate = {
  apiVersion: string;
  kind: string;
  metadata: {
    annotations?: Record<string, string>;
    creationTimestamp?: string;
    finalizers?: string[];
    generation?: number;
    labels?: Record<string, string>;
    name: string;
    namespace: string;
    resourceVersion?: string;
    uid?: string;
    descriptionText?: string;
  };
  spec: {
    meta: {
      chargingTarget: {
        type: string;
        value: string;
      };
      displayName: {
        prefix?: string;
        sufix?: string;
      };
      name: {
        prefix?: string;
        sufix?: string;
      };
    };
    spec: {
      authentication: {
        allowAdd?: boolean;
        system: {
          changeable: boolean;
          enabled: boolean;
        };
      };
      authorization: {
        allowAddMembers?: boolean;
        defaultMembers: {
          name: string;
          removable: boolean;
          kind?: string;
          role?: string;
          namespace?: string;
        }[];
      };
      components: {
        defaultComponents: {
          name: string;
          removable?: boolean;
          version: string;
          versionChangeable?: boolean;
        }[];
      };
    };
  };
  status?: {
    conditions?: {
      lastTransitionTime: string;
      message: string;
      observedGeneration: number;
      reason: string;
      status: string;
      type: string;
    }[];
    state?: string;
  };
};

export type TemplateDropdownOption = {
  value: string;
  label: string;
};

export const noTemplateValue = 'no-template';

export function toTemplateDropdownOptions(
  templates: ManagedControlPlaneTemplate[],
  noTemplateLabel: string,
): TemplateDropdownOption[] {
  return [
    { value: noTemplateValue, label: noTemplateLabel },
    ...templates.map((t) => ({
      value: t.metadata.name,
      label: t.metadata.name,
    })),
  ];
}
