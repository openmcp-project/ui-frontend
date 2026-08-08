export const DISPLAY_NAME_ANNOTATION: string = 'openmcp.cloud/display-name';
export const CHARGING_TARGET_LABEL: string = 'openmcp.cloud.sap/charging-target';
export const CHARGING_TARGET_TYPE_LABEL: string = 'openmcp.cloud.sap/charging-target-type';
export const PROJECT_NAME_LABEL: string = 'openmcp.cloud/mcp-project';
export const WORKSPACE_LABEL: string = 'openmcp.cloud/mcp-workspace';
export const LAST_APPLIED_CONFIGURATION_ANNOTATION = 'kubectl.kubernetes.io/last-applied-configuration';

export const SUPPORT_SERVICE_IDS_ANNOTATION = 'meta.orchestrate.cloud.sap/service-ids';
export const SUPPORT_LANDSCAPE_ANNOTATION = 'meta.orchestrate.cloud.sap/landscape';
export const SUPPORT_SECURITY_CONTACTS_ANNOTATION = 'meta.orchestrate.cloud.sap/security-contacts';
export const SUPPORT_OPS_CONTACTS_ANNOTATION = 'meta.orchestrate.cloud.sap/ops-contacts';

export const SUPPORT_LANDSCAPE_VALUES = ['production', 'validation', 'testing'] as const;
export type SupportLandscape = (typeof SUPPORT_LANDSCAPE_VALUES)[number];
