/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AuthorizationK8sIoV1SelfSubjectRulesReview_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard list metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** Spec holds information about the request being evaluated. */
  spec?: Io_K8s_Api_Authorization_V1_SelfSubjectRulesReviewSpecSpec_Input | null | undefined;
  /** Status is filled in by the server and indicates the set of actions a user can perform. */
  status?: Io_K8s_Api_Authorization_V1_SubjectRulesReviewStatusStatus_Input | null | undefined;
};

/** RoleRef defines a reference to a (cluster) role that should be bound to the subjects. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProviderRoleBindingsRoleRefs_Input = {
  /**
   * Kind is the kind of the role to bind to the subjects.
   * It must be 'Role' or 'ClusterRole'.
   */
  kind?: string | null | undefined;
  /** Name is the name of the role or cluster role to bind to the subjects. */
  name?: string | null | undefined;
  /**
   * Namespace is the namespace of the role to bind to the subjects.
   * It must be set if the kind is 'Role' and may not be set if the kind is 'ClusterRole'.
   */
  namespace?: string | null | undefined;
};

/**
 * Subject contains a reference to the object or user identities a role binding applies to.  This can either hold a direct API object reference,
 * or a value for non-objects such as user and group names.
 */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProviderRoleBindingsSubjects_Input = {
  /**
   * APIGroup holds the API group of the referenced subject.
   * Defaults to "" for ServiceAccount subjects.
   * Defaults to "rbac.authorization.k8s.io" for User and Group subjects.
   */
  apiGroup?: string | null | undefined;
  /**
   * Kind of object being referenced. Values defined by this API group are "User", "Group", and "ServiceAccount".
   * If the Authorizer does not recognized the kind value, the Authorizer should report an error.
   */
  kind?: string | null | undefined;
  /** Name of the object being referenced. */
  name?: string | null | undefined;
  /**
   * Namespace of the referenced object.  If the object kind is non-namespace, such as "User" or "Group", and this value is not empty
   * the Authorizer should report an error.
   */
  namespace?: string | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProviderRoleBindings_Input = {
  /**
   * RoleRefs is a list of (cluster) role references that the subjects should be bound to.
   * Note that existence of the roles is not checked and missing (cluster) roles will result in ineffective (cluster) role bindings.
   */
  roleRefs?:
    | Array<
        | CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProviderRoleBindingsRoleRefs_Input
        | null
        | undefined
      >
    | null
    | undefined;
  /**
   * Subjects is a list of subjects that should be bound to the specified roles.
   * The subjects' names will be prefixed with the username prefix of the OIDC provider.
   */
  subjects?:
    | Array<
        | CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProviderRoleBindingsSubjects_Input
        | null
        | undefined
      >
    | null
    | undefined;
};

/** DefaultProvider is the standard OIDC provider that is enabled for all ControlPlane resources. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProvider_Input = {
  /**
   * RoleBindings is a list of subjects with (cluster) role bindings that should be created for them.
   * These bindings refer to the standard OIDC provider. If empty, the standard OIDC provider is disabled.
   * Note that the username prefix is added automatically to the subjects' names, it must not be explicitly specified here.
   */
  roleBindings?:
    | Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProviderRoleBindings_Input | null | undefined>
    | null
    | undefined;
};

/** RoleRef defines a reference to a (cluster) role that should be bound to the subjects. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProvidersRoleBindingsRoleRefs_Input = {
  /**
   * Kind is the kind of the role to bind to the subjects.
   * It must be 'Role' or 'ClusterRole'.
   */
  kind?: string | null | undefined;
  /** Name is the name of the role or cluster role to bind to the subjects. */
  name?: string | null | undefined;
  /**
   * Namespace is the namespace of the role to bind to the subjects.
   * It must be set if the kind is 'Role' and may not be set if the kind is 'ClusterRole'.
   */
  namespace?: string | null | undefined;
};

/**
 * Subject contains a reference to the object or user identities a role binding applies to.  This can either hold a direct API object reference,
 * or a value for non-objects such as user and group names.
 */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProvidersRoleBindingsSubjects_Input = {
  /**
   * APIGroup holds the API group of the referenced subject.
   * Defaults to "" for ServiceAccount subjects.
   * Defaults to "rbac.authorization.k8s.io" for User and Group subjects.
   */
  apiGroup?: string | null | undefined;
  /**
   * Kind of object being referenced. Values defined by this API group are "User", "Group", and "ServiceAccount".
   * If the Authorizer does not recognized the kind value, the Authorizer should report an error.
   */
  kind?: string | null | undefined;
  /** Name of the object being referenced. */
  name?: string | null | undefined;
  /**
   * Namespace of the referenced object.  If the object kind is non-namespace, such as "User" or "Group", and this value is not empty
   * the Authorizer should report an error.
   */
  namespace?: string | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProvidersRoleBindings_Input = {
  /**
   * RoleRefs is a list of (cluster) role references that the subjects should be bound to.
   * Note that existence of the roles is not checked and missing (cluster) roles will result in ineffective (cluster) role bindings.
   */
  roleRefs?:
    | Array<
        CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProvidersRoleBindingsRoleRefs_Input | null | undefined
      >
    | null
    | undefined;
  /**
   * Subjects is a list of subjects that should be bound to the specified roles.
   * The subjects' names will be prefixed with the username prefix of the OIDC provider.
   */
  subjects?:
    | Array<
        CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProvidersRoleBindingsSubjects_Input | null | undefined
      >
    | null
    | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProviders_Input = {
  /** ClientID is the client ID to use for the OIDC provider. */
  clientID?: string | null | undefined;
  /** ExtraScopes is a list of extra scopes that should be requested from the OIDC provider. */
  extraScopes?: Array<string | null | undefined> | null | undefined;
  /**
   * GroupsClaim is the claim in the OIDC token that contains the groups.
   * If empty, the default claim "groups" will be used.
   */
  groupsClaim?: string | null | undefined;
  /**
   * GroupsPrefix is the prefix for groups for this OIDC provider.
   * If not specified, it defaults to '<name>:'.
   * To disable the prefix completely, set it to an empty string.
   */
  groupsPrefix?: string | null | undefined;
  /**
   * Issuer is the issuer URL of the OIDC provider.
   * Must be a valid URL.
   */
  issuer?: string | null | undefined;
  /**
   * Name is the name of the OIDC provider.
   * May be used in k8s resources, therefore has to be a valid k8s name.
   * It is also used (with a ':' suffix) as prefix in k8s resources referencing users or groups from this OIDC provider.
   * E.g. if the name is 'example', the username 'alice' from this provider will be referenced as 'example:alice' in k8s resources.
   * Must be unique among all OIDC providers configured in the same environment.
   */
  name?: string | null | undefined;
  /**
   * RoleBindings is a list of subjects with (cluster) role bindings that should be created for them.
   * Note that the username prefix is added automatically to the subjects' names, it must not be explicitly specified here.
   */
  roleBindings?:
    | Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProvidersRoleBindings_Input | null | undefined>
    | null
    | undefined;
  /**
   * UsernameClaim is the claim in the OIDC token that contains the username.
   * If empty, the default claim "sub" will be used.
   */
  usernameClaim?: string | null | undefined;
  /**
   * UsernamePrefix is the prefix for usernames for this OIDC provider.
   * If not specified, it defaults to '<name>:'.
   * To disable the prefix completely, set it to an empty string.
   */
  usernamePrefix?: string | null | undefined;
};

/** OIDC is the OIDC-based access configuration. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidc_Input = {
  /** DefaultProvider is the standard OIDC provider that is enabled for all ControlPlane resources. */
  defaultProvider?: CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcDefaultProvider_Input | null | undefined;
  /**
   * ExtraProviders is a list of OIDC providers that should be configured for the ControlPlane.
   * They are independent of the standard OIDC provider and in addition to it, unless it has been disabled by not specifying any role bindings.
   */
  extraProviders?:
    | Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidcExtraProviders_Input | null | undefined>
    | null
    | undefined;
};

/**
 * PolicyRule holds information that describes a policy rule, but does not contain information
 * about who the rule applies to or which namespace the rule applies to.
 */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokensPermissionsRules_Input = {
  /**
   * APIGroups is the name of the APIGroup that contains the resources.  If multiple API groups are specified, any action requested against one of
   * the enumerated resources in any API group will be allowed. "" represents the core API group and "*" represents all API groups.
   */
  apiGroups?: Array<string | null | undefined> | null | undefined;
  /**
   * NonResourceURLs is a set of partial urls that a user should have access to.  *s are allowed, but only as the full, final step in the path
   * Since non-resource URLs are not namespaced, this field is only applicable for ClusterRoles referenced from a ClusterRoleBinding.
   * Rules can either apply to API resources (such as "pods" or "secrets") or non-resource URL paths (such as "/api"),  but not both.
   */
  nonResourceURLs?: Array<string | null | undefined> | null | undefined;
  /** ResourceNames is an optional white list of names that the rule applies to.  An empty set means that everything is allowed. */
  resourceNames?: Array<string | null | undefined> | null | undefined;
  /** Resources is a list of resources this rule applies to. '*' represents all resources. */
  resources?: Array<string | null | undefined> | null | undefined;
  /** Verbs is a list of Verbs that apply to ALL the ResourceKinds contained in this rule. '*' represents all verbs. */
  verbs?: Array<string | null | undefined> | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokensPermissions_Input = {
  /**
   * DisableAutomaticNamespaceCreation controls whether the target namespace is auto-created when Namespace is set and does not exist.
   * Defaults to false.
   */
  disableAutomaticNamespaceCreation?: boolean | null | undefined;
  /**
   * Name is an optional name for the (Cluster)Role that will be created for the requested permissions.
   * If not set, a randomized name that is unique in the cluster will be generated.
   * Note that the AccessRequest will not be granted if the to-be-created (Cluster)Role already exists, but is not managed by the AccessRequest, so choose this name carefully.
   */
  name?: string | null | undefined;
  /**
   * Namespace is the namespace for which the permissions are requested.
   * If empty, this will result in a ClusterRole, otherwise in a Role in the respective namespace.
   * By default, the namespace will be created automatically if it does not exist unless DisableAutomaticNamespaceCreation is set to true.
   */
  namespace?: string | null | undefined;
  /** Rules are the requested RBAC rules. */
  rules?:
    | Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokensPermissionsRules_Input | null | undefined>
    | null
    | undefined;
};

/** RoleRef defines a reference to a (cluster) role that should be bound to the subjects. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokensRoleRefs_Input = {
  /**
   * Kind is the kind of the role to bind to the subjects.
   * It must be 'Role' or 'ClusterRole'.
   */
  kind?: string | null | undefined;
  /** Name is the name of the role or cluster role to bind to the subjects. */
  name?: string | null | undefined;
  /**
   * Namespace is the namespace of the role to bind to the subjects.
   * It must be set if the kind is 'Role' and may not be set if the kind is 'ClusterRole'.
   */
  namespace?: string | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokens_Input = {
  /**
   * Name is the name of this token configuration.
   * It is used to generate a secret name and must be unique among all token configurations in the same ControlPlane.
   */
  name?: string | null | undefined;
  /**
   * Permissions are the requested permissions.
   * If not empty, corresponding Roles and ClusterRoles will be created in the target cluster.
   * The created serviceaccount will be bound to the created Roles and ClusterRoles.
   */
  permissions?:
    | Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokensPermissions_Input | null | undefined>
    | null
    | undefined;
  /** RoleRefs are references to existing (Cluster)Roles that should be bound to the created serviceaccount. */
  roleRefs?:
    Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokensRoleRefs_Input | null | undefined> | null | undefined;
};

/** IAM contains the access management configuration for the ControlPlane. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIam_Input = {
  /** OIDC is the OIDC-based access configuration. */
  oidc?: CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamOidc_Input | null | undefined;
  /** Tokens is a list of token-based access configurations. */
  tokens?: Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIamTokens_Input | null | undefined> | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneSpec_Input = {
  /** IAM contains the access management configuration for the ControlPlane. */
  iam?: CoreOpenControlPlaneIoV2alpha1ControlPlaneSpecIam_Input | null | undefined;
};

/** Condition contains details for one aspect of the current state of this API Resource. */
export type CoreOpenControlPlaneIoV2alpha1ControlPlaneStatusConditions_Input = {
  /**
   * lastTransitionTime is the last time the condition transitioned from one status to another.
   * This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
   */
  lastTransitionTime?: string | null | undefined;
  /**
   * message is a human readable message indicating details about the transition.
   * This may be an empty string.
   */
  message?: string | null | undefined;
  /**
   * observedGeneration represents the .metadata.generation that the condition was set based upon.
   * For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date
   * with respect to the current state of the instance.
   */
  observedGeneration?: number | null | undefined;
  /**
   * reason contains a programmatic identifier indicating the reason for the condition's last transition.
   * Producers of specific condition types may define expected values and meanings for this field,
   * and whether the values are considered a guaranteed API.
   * The value should be a CamelCase string.
   * This field may not be empty.
   */
  reason?: string | null | undefined;
  /** status of the condition, one of True, False, Unknown. */
  status?: string | null | undefined;
  /** type of condition in CamelCase or in foo.example.com/CamelCase. */
  type?: string | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneStatusEndpoints_Input = {
  /** Name is the identifier of the endpoint. */
  name?: string | null | undefined;
  /** URL is the endpoint URL. */
  url?: string | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlaneStatus_Input = {
  /**
   * Access is a mapping from OIDC provider names to secret references.
   * Each referenced secret is expected to contain a 'kubeconfig' key with the kubeconfig that was generated for the respective OIDC provider for the ControlPlane.
   * The default OIDC provider, if configured, uses the name "default" in this mapping.
   * The "default" key is also used if the ClusterProvider does not support OIDC-based access and created a serviceaccount with a token instead.
   */
  access?: unknown;
  /** Conditions contains the conditions. */
  conditions?:
    Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneStatusConditions_Input | null | undefined> | null | undefined;
  /** Endpoints is a list of exposed Cluster endpoints. */
  endpoints?:
    Array<CoreOpenControlPlaneIoV2alpha1ControlPlaneStatusEndpoints_Input | null | undefined> | null | undefined;
  /** ObservedGeneration is the generation of this resource that was last reconciled by the controller. */
  observedGeneration?: number | null | undefined;
  /** Phase is the current phase of the resource. */
  phase?: string | null | undefined;
};

export type CoreOpenControlPlaneIoV2alpha1ControlPlane_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  spec?: CoreOpenControlPlaneIoV2alpha1ControlPlaneSpec_Input | null | undefined;
  status?: CoreOpenControlPlaneIoV2alpha1ControlPlaneStatus_Input | null | undefined;
};

export type CoreOpenmcpCloudV1alpha1ProjectSpecMembers_Input = {
  /** Kind of object being referenced. Can be "User", "Group", or "ServiceAccount". */
  kind?: string | null | undefined;
  /** Name of the object being referenced. */
  name?: string | null | undefined;
  /** Namespace of the referenced object. Required if Kind is "ServiceAccount". Must not be specified if Kind is "User" or "Group". */
  namespace?: string | null | undefined;
  /** Roles defines a list of roles that this project member should have. */
  roles?: Array<string | null | undefined> | null | undefined;
};

/** ProjectSpec defines the desired state of Project */
export type CoreOpenmcpCloudV1alpha1ProjectSpec_Input = {
  /** Members is a list of project members. */
  members?: Array<CoreOpenmcpCloudV1alpha1ProjectSpecMembers_Input | null | undefined> | null | undefined;
};

/** Condition is part of all conditions that a project/ workspace can have. */
export type CoreOpenmcpCloudV1alpha1ProjectStatusConditions_Input = {
  /**
   * Details is an object that can contain additional information about the condition.
   * The content is specific to the condition type.
   */
  details?: unknown;
  /** LastTransitionTime is the time when the condition last transitioned from one status to another. */
  lastTransitionTime?: string | null | undefined;
  /** Message is a human-readable message indicating details about the condition. */
  message?: string | null | undefined;
  /** Reason is the reason for the condition. */
  reason?: string | null | undefined;
  /** Status is the status of the condition. */
  status?: string | null | undefined;
  /** Type is the type of the condition. */
  type?: string | null | undefined;
};

/** ProjectStatus defines the observed state of Project */
export type CoreOpenmcpCloudV1alpha1ProjectStatus_Input = {
  conditions?: Array<CoreOpenmcpCloudV1alpha1ProjectStatusConditions_Input | null | undefined> | null | undefined;
  namespace?: string | null | undefined;
};

export type CoreOpenmcpCloudV1alpha1Project_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** ProjectSpec defines the desired state of Project */
  spec?: CoreOpenmcpCloudV1alpha1ProjectSpec_Input | null | undefined;
  /** ProjectStatus defines the observed state of Project */
  status?: CoreOpenmcpCloudV1alpha1ProjectStatus_Input | null | undefined;
};

export type CoreOpenmcpCloudV1alpha1WorkspaceSpecMembers_Input = {
  /** Kind of object being referenced. Can be "User", "Group", or "ServiceAccount". */
  kind?: string | null | undefined;
  /** Name of the object being referenced. */
  name?: string | null | undefined;
  /** Namespace of the referenced object. Required if Kind is "ServiceAccount". Must not be specified if Kind is "User" or "Group". */
  namespace?: string | null | undefined;
  /** Roles defines a list of roles that this workspace member should have. */
  roles?: Array<string | null | undefined> | null | undefined;
};

/** WorkspaceSpec defines the desired state of Workspace */
export type CoreOpenmcpCloudV1alpha1WorkspaceSpec_Input = {
  /** Members is a list of workspace members. */
  members?: Array<CoreOpenmcpCloudV1alpha1WorkspaceSpecMembers_Input | null | undefined> | null | undefined;
};

/** Condition is part of all conditions that a project/ workspace can have. */
export type CoreOpenmcpCloudV1alpha1WorkspaceStatusConditions_Input = {
  /**
   * Details is an object that can contain additional information about the condition.
   * The content is specific to the condition type.
   */
  details?: unknown;
  /** LastTransitionTime is the time when the condition last transitioned from one status to another. */
  lastTransitionTime?: string | null | undefined;
  /** Message is a human-readable message indicating details about the condition. */
  message?: string | null | undefined;
  /** Reason is the reason for the condition. */
  reason?: string | null | undefined;
  /** Status is the status of the condition. */
  status?: string | null | undefined;
  /** Type is the type of the condition. */
  type?: string | null | undefined;
};

/** WorkspaceStatus defines the observed state of Workspace */
export type CoreOpenmcpCloudV1alpha1WorkspaceStatus_Input = {
  conditions?: Array<CoreOpenmcpCloudV1alpha1WorkspaceStatusConditions_Input | null | undefined> | null | undefined;
  namespace?: string | null | undefined;
};

export type CoreOpenmcpCloudV1alpha1Workspace_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** WorkspaceSpec defines the desired state of Workspace */
  spec?: CoreOpenmcpCloudV1alpha1WorkspaceSpec_Input | null | undefined;
  /** WorkspaceStatus defines the observed state of Workspace */
  status?: CoreOpenmcpCloudV1alpha1WorkspaceStatus_Input | null | undefined;
};

/** CrossplaneProviderConfig represents configuration for Crossplane providers in a Crossplane instance. */
export type CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneSpecProviders_Input = {
  /** Name of the provider. */
  name?: string | null | undefined;
  /** Version of the provider to install. */
  version?: string | null | undefined;
};

/** spec defines the desired state of Crossplane */
export type CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneSpec_Input = {
  /** List of Crossplane providers to be installed. */
  providers?:
    | Array<CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneSpecProviders_Input | null | undefined>
    | null
    | undefined;
  /** The Version of Crossplane to install. */
  version?: string | null | undefined;
};

/** Condition contains details for one aspect of the current state of this API Resource. */
export type CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneStatusConditions_Input = {
  /**
   * lastTransitionTime is the last time the condition transitioned from one status to another.
   * This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
   */
  lastTransitionTime?: string | null | undefined;
  /**
   * message is a human readable message indicating details about the transition.
   * This may be an empty string.
   */
  message?: string | null | undefined;
  /**
   * observedGeneration represents the .metadata.generation that the condition was set based upon.
   * For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date
   * with respect to the current state of the instance.
   */
  observedGeneration?: number | null | undefined;
  /**
   * reason contains a programmatic identifier indicating the reason for the condition's last transition.
   * Producers of specific condition types may define expected values and meanings for this field,
   * and whether the values are considered a guaranteed API.
   * The value should be a CamelCase string.
   * This field may not be empty.
   */
  reason?: string | null | undefined;
  /** status of the condition, one of True, False, Unknown. */
  status?: string | null | undefined;
  /** type of condition in CamelCase or in foo.example.com/CamelCase. */
  type?: string | null | undefined;
};

/** status defines the observed state of Crossplane */
export type CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneStatus_Input = {
  /** Conditions contains the conditions. */
  conditions?:
    | Array<CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneStatusConditions_Input | null | undefined>
    | null
    | undefined;
  /** ObservedGeneration is the generation of this resource that was last reconciled by the controller. */
  observedGeneration?: number | null | undefined;
  /** Phase is the current phase of the resource. */
  phase?: string | null | undefined;
};

export type CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** spec defines the desired state of Crossplane */
  spec?: CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneSpec_Input | null | undefined;
  /** status defines the observed state of Crossplane */
  status?: CrossplaneServicesOpenControlPlaneIoV1alpha1CrossplaneStatus_Input | null | undefined;
};

/** spec defines the desired state of ExternalSecretsOperator */
export type ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorSpec_Input = {
  /** Version is the external-secrets Helm chart version to install. */
  version?: string | null | undefined;
};

/** Condition contains details for one aspect of the current state of this API Resource. */
export type ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorStatusConditions_Input = {
  /**
   * lastTransitionTime is the last time the condition transitioned from one status to another.
   * This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
   */
  lastTransitionTime?: string | null | undefined;
  /**
   * message is a human readable message indicating details about the transition.
   * This may be an empty string.
   */
  message?: string | null | undefined;
  /**
   * observedGeneration represents the .metadata.generation that the condition was set based upon.
   * For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date
   * with respect to the current state of the instance.
   */
  observedGeneration?: number | null | undefined;
  /**
   * reason contains a programmatic identifier indicating the reason for the condition's last transition.
   * Producers of specific condition types may define expected values and meanings for this field,
   * and whether the values are considered a guaranteed API.
   * The value should be a CamelCase string.
   * This field may not be empty.
   */
  reason?: string | null | undefined;
  /** status of the condition, one of True, False, Unknown. */
  status?: string | null | undefined;
  /** type of condition in CamelCase or in foo.example.com/CamelCase. */
  type?: string | null | undefined;
};

/** ManagedResource defines a kubernetes object with its lifecycle phase */
export type ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorStatusResources_Input = {
  /**
   * APIGroup is the group for the resource being referenced.
   * If APIGroup is not specified, the specified Kind must be in the core API group.
   * For any other third-party types, APIGroup is required.
   */
  apiGroup?: string | null | undefined;
  /** Kind is the type of resource being referenced */
  kind?: string | null | undefined;
  /** ResourceLocation is a custom type representing the location of a resource. */
  location?: string | null | undefined;
  message?: string | null | undefined;
  /** Name is the name of resource being referenced */
  name?: string | null | undefined;
  /**
   * Namespace is the namespace of resource being referenced
   * Note that when a namespace is specified, a gateway.networking.k8s.io/ReferenceGrant object is required in the referent namespace to allow that namespace's owner to accept the reference. See the ReferenceGrant documentation for details.
   * (Alpha) This field requires the CrossNamespaceVolumeDataSource feature gate to be enabled.
   */
  namespace?: string | null | undefined;
  /** InstancePhase is a custom type representing the phase of a service instance. */
  phase?: string | null | undefined;
};

/** status defines the observed state of ExternalSecretsOperator */
export type ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorStatus_Input = {
  /** Conditions contains the conditions. */
  conditions?:
    | Array<
        | ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorStatusConditions_Input
        | null
        | undefined
      >
    | null
    | undefined;
  /** ObservedGeneration is the generation of this resource that was last reconciled by the controller. */
  observedGeneration?: number | null | undefined;
  /** Phase is the current phase of the resource. */
  phase?: string | null | undefined;
  /** Resources managed by this External Secrets Operator instance */
  resources?:
    | Array<
        ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorStatusResources_Input | null | undefined
      >
    | null
    | undefined;
};

export type ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** spec defines the desired state of ExternalSecretsOperator */
  spec?: ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorSpec_Input | null | undefined;
  /** status defines the observed state of ExternalSecretsOperator */
  status?: ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperatorStatus_Input | null | undefined;
};

/** spec defines the desired state of Flux */
export type FluxServicesOpenControlPlaneIoV1alpha1FluxSpec_Input = {
  /** Version is the Flux version to install. */
  version?: string | null | undefined;
};

/** Condition contains details for one aspect of the current state of this API Resource. */
export type FluxServicesOpenControlPlaneIoV1alpha1FluxStatusConditions_Input = {
  /**
   * lastTransitionTime is the last time the condition transitioned from one status to another.
   * This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
   */
  lastTransitionTime?: string | null | undefined;
  /**
   * message is a human readable message indicating details about the transition.
   * This may be an empty string.
   */
  message?: string | null | undefined;
  /**
   * observedGeneration represents the .metadata.generation that the condition was set based upon.
   * For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date
   * with respect to the current state of the instance.
   */
  observedGeneration?: number | null | undefined;
  /**
   * reason contains a programmatic identifier indicating the reason for the condition's last transition.
   * Producers of specific condition types may define expected values and meanings for this field,
   * and whether the values are considered a guaranteed API.
   * The value should be a CamelCase string.
   * This field may not be empty.
   */
  reason?: string | null | undefined;
  /** status of the condition, one of True, False, Unknown. */
  status?: string | null | undefined;
  /** type of condition in CamelCase or in foo.example.com/CamelCase. */
  type?: string | null | undefined;
};

/** ManagedResource defines a kubernetes object with its lifecycle phase */
export type FluxServicesOpenControlPlaneIoV1alpha1FluxStatusResources_Input = {
  /**
   * APIGroup is the group for the resource being referenced.
   * If APIGroup is not specified, the specified Kind must be in the core API group.
   * For any other third-party types, APIGroup is required.
   */
  apiGroup?: string | null | undefined;
  /** Kind is the type of resource being referenced */
  kind?: string | null | undefined;
  /** ResourceLocation is a custom type representing the location of a resource. */
  location?: string | null | undefined;
  message?: string | null | undefined;
  /** Name is the name of resource being referenced */
  name?: string | null | undefined;
  /**
   * Namespace is the namespace of resource being referenced
   * Note that when a namespace is specified, a gateway.networking.k8s.io/ReferenceGrant object is required in the referent namespace to allow that namespace's owner to accept the reference. See the ReferenceGrant documentation for details.
   * (Alpha) This field requires the CrossNamespaceVolumeDataSource feature gate to be enabled.
   */
  namespace?: string | null | undefined;
  /** InstancePhase is a custom type representing the phase of a service instance. */
  phase?: string | null | undefined;
};

/** status defines the observed state of Flux */
export type FluxServicesOpenControlPlaneIoV1alpha1FluxStatus_Input = {
  /** Conditions contains the conditions. */
  conditions?:
    Array<FluxServicesOpenControlPlaneIoV1alpha1FluxStatusConditions_Input | null | undefined> | null | undefined;
  /** ObservedGeneration is the generation of this resource that was last reconciled by the controller. */
  observedGeneration?: number | null | undefined;
  /** Phase is the current phase of the resource. */
  phase?: string | null | undefined;
  /** Resources managed by this Flux instance */
  resources?:
    Array<FluxServicesOpenControlPlaneIoV1alpha1FluxStatusResources_Input | null | undefined> | null | undefined;
};

export type FluxServicesOpenControlPlaneIoV1alpha1Flux_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** spec defines the desired state of Flux */
  spec?: FluxServicesOpenControlPlaneIoV1alpha1FluxSpec_Input | null | undefined;
  /** status defines the observed state of Flux */
  status?: FluxServicesOpenControlPlaneIoV1alpha1FluxStatus_Input | null | undefined;
};

/**
 * ProviderConfigRef is a reference to the ProviderConfig that this Landscaper instance should use.
 * If not specified, the controller will use the default ProviderConfig in the cluster.
 */
export type LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperSpecProviderConfigRef_Input = {
  /**
   * Name of the referent.
   * This field is effectively required, but due to backwards compatibility is
   * allowed to be empty. Instances of this type with an empty value here are
   * almost certainly wrong.
   * More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
   */
  name?: string | null | undefined;
};

/** LandscaperSpec defines the desired state of Landscaper. */
export type LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperSpec_Input = {
  /**
   * ProviderConfigRef is a reference to the ProviderConfig that this Landscaper instance should use.
   * If not specified, the controller will use the default ProviderConfig in the cluster.
   */
  providerConfigRef?:
    LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperSpecProviderConfigRef_Input | null | undefined;
  /** Version is the version of the Landscaper instance to deploy. */
  version?: string | null | undefined;
};

/** Condition contains details for one aspect of the current state of this API Resource. */
export type LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperStatusConditions_Input = {
  /**
   * lastTransitionTime is the last time the condition transitioned from one status to another.
   * This should be when the underlying condition changed.  If that is not known, then using the time when the API field changed is acceptable.
   */
  lastTransitionTime?: string | null | undefined;
  /**
   * message is a human readable message indicating details about the transition.
   * This may be an empty string.
   */
  message?: string | null | undefined;
  /**
   * observedGeneration represents the .metadata.generation that the condition was set based upon.
   * For instance, if .metadata.generation is currently 12, but the .status.conditions[x].observedGeneration is 9, the condition is out of date
   * with respect to the current state of the instance.
   */
  observedGeneration?: number | null | undefined;
  /**
   * reason contains a programmatic identifier indicating the reason for the condition's last transition.
   * Producers of specific condition types may define expected values and meanings for this field,
   * and whether the values are considered a guaranteed API.
   * The value should be a CamelCase string.
   * This field may not be empty.
   */
  reason?: string | null | undefined;
  /** status of the condition, one of True, False, Unknown. */
  status?: string | null | undefined;
  /** type of condition in CamelCase or in foo.example.com/CamelCase. */
  type?: string | null | undefined;
};

/** ProviderConfigRef is a reference to the ProviderConfig that this Landscaper instance uses. */
export type LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperStatusProviderConfigRef_Input = {
  /**
   * Name of the referent.
   * This field is effectively required, but due to backwards compatibility is
   * allowed to be empty. Instances of this type with an empty value here are
   * almost certainly wrong.
   * More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
   */
  name?: string | null | undefined;
};

/** LandscaperStatus defines the observed state of Landscaper. */
export type LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperStatus_Input = {
  conditions?:
    | Array<LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperStatusConditions_Input | null | undefined>
    | null
    | undefined;
  /** ObservedGeneration is the last observed generation. */
  observedGeneration?: number | null | undefined;
  /** The current phase of the Landscaper instance deployment. */
  phase?: string | null | undefined;
  /** ProviderConfigRef is a reference to the ProviderConfig that this Landscaper instance uses. */
  providerConfigRef?:
    LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperStatusProviderConfigRef_Input | null | undefined;
};

export type LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input = {
  /** APIVersion defines the versioned schema of this representation of an object. Servers should convert recognized schemas to the latest internal value, and may reject unrecognized values. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources */
  apiVersion?: string | null | undefined;
  /** Kind is a string value representing the REST resource this object represents. Servers may infer this from the endpoint the client submits requests to. Cannot be updated. In CamelCase. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Standard object's metadata. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata */
  metadata?: Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input | null | undefined;
  /** LandscaperSpec defines the desired state of Landscaper. */
  spec?: LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperSpec_Input | null | undefined;
  /** LandscaperStatus defines the observed state of Landscaper. */
  status?: LandscaperServicesOpenControlPlaneIoV1alpha2LandscaperStatus_Input | null | undefined;
};

export type WatchEventType = 'ADDED' | 'DELETED' | 'MODIFIED';

/** NonResourceRule holds information that describes a rule for the non-resource */
export type Io_K8s_Api_Authorization_V1_NonResourceRuleNonResourceRules_Input = {
  /** NonResourceURLs is a set of partial urls that a user should have access to.  *s are allowed, but only as the full, final step in the path.  "*" means all. */
  nonResourceURLs?: Array<string | null | undefined> | null | undefined;
  /** Verb is a list of kubernetes non-resource API verbs, like: get, post, put, delete, patch, head, options.  "*" means all. */
  verbs?: Array<string | null | undefined> | null | undefined;
};

/** ResourceRule is the list of actions the subject is allowed to perform on resources. The list ordering isn't significant, may contain duplicates, and possibly be incomplete. */
export type Io_K8s_Api_Authorization_V1_ResourceRuleResourceRules_Input = {
  /** APIGroups is the name of the APIGroup that contains the resources.  If multiple API groups are specified, any action requested against one of the enumerated resources in any API group will be allowed.  "*" means all. */
  apiGroups?: Array<string | null | undefined> | null | undefined;
  /** ResourceNames is an optional white list of names that the rule applies to.  An empty set means that everything is allowed.  "*" means all. */
  resourceNames?: Array<string | null | undefined> | null | undefined;
  /**
   * Resources is a list of resources this rule applies to.  "*" means all in the specified apiGroups.
   *  "*\/foo" represents the subresource 'foo' for all resources in the specified apiGroups.
   */
  resources?: Array<string | null | undefined> | null | undefined;
  /** Verb is a list of kubernetes resource API verbs, like: get, list, watch, create, update, delete, proxy.  "*" means all. */
  verbs?: Array<string | null | undefined> | null | undefined;
};

/** SelfSubjectRulesReviewSpec defines the specification for SelfSubjectRulesReview. */
export type Io_K8s_Api_Authorization_V1_SelfSubjectRulesReviewSpecSpec_Input = {
  /** Namespace to evaluate rules for. Required. */
  namespace?: string | null | undefined;
};

/** SubjectRulesReviewStatus contains the result of a rules check. This check can be incomplete depending on the set of authorizers the server is configured with and any errors experienced during evaluation. Because authorization rules are additive, if a rule appears in a list it's safe to assume the subject has that permission, even if that list is incomplete. */
export type Io_K8s_Api_Authorization_V1_SubjectRulesReviewStatusStatus_Input = {
  /** EvaluationError can appear in combination with Rules. It indicates an error occurred during rule evaluation, such as an authorizer that doesn't support rule evaluation, and that ResourceRules and/or NonResourceRules may be incomplete. */
  evaluationError?: string | null | undefined;
  /** Incomplete is true when the rules returned by this call are incomplete. This is most commonly encountered when an authorizer, such as an external authorizer, doesn't support rules evaluation. */
  incomplete?: boolean | null | undefined;
  /** NonResourceRules is the list of actions the subject is allowed to perform on non-resources. The list ordering isn't significant, may contain duplicates, and possibly be incomplete. */
  nonResourceRules?:
    Array<Io_K8s_Api_Authorization_V1_NonResourceRuleNonResourceRules_Input | null | undefined> | null | undefined;
  /** ResourceRules is the list of actions the subject is allowed to perform on resources. The list ordering isn't significant, may contain duplicates, and possibly be incomplete. */
  resourceRules?:
    Array<Io_K8s_Api_Authorization_V1_ResourceRuleResourceRules_Input | null | undefined> | null | undefined;
};

/** ManagedFieldsEntry is a workflow-id, a FieldSet and the group version of the resource that the fieldset applies to. */
export type Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ManagedFieldsEntryManagedFields_Input = {
  /** APIVersion defines the version of this resource that this field set applies to. The format is "group/version" just like the top-level APIVersion field. It is necessary to track the version of a field set because it cannot be automatically converted. */
  apiVersion?: string | null | undefined;
  /** FieldsType is the discriminator for the different fields format and version. There is currently only one possible value: "FieldsV1" */
  fieldsType?: string | null | undefined;
  /** FieldsV1 holds the first JSON version format as described in the "FieldsV1" type. */
  fieldsV1?: unknown;
  /** Manager is an identifier of the workflow managing these fields. */
  manager?: string | null | undefined;
  /** Operation is the type of operation which lead to this ManagedFieldsEntry being created. The only valid values for this field are 'Apply' and 'Update'. */
  operation?: string | null | undefined;
  /** Subresource is the name of the subresource used to update that object, or empty string if the object was updated through the main resource. The value of this field is used to distinguish between managers, even if they share the same name. For example, a status update will be distinct from a regular update using the same manager name. Note that the APIVersion field is not related to the Subresource field and it always corresponds to the version of the main resource. */
  subresource?: string | null | undefined;
  /** Time is the timestamp of when the ManagedFields entry was added. The timestamp will also be updated if a field is added, the manager changes any of the owned fields value or removes a field. The timestamp does not update when a field is removed from the entry because another manager took it over. */
  time?: string | null | undefined;
};

/** ObjectMeta is metadata that all persisted resources must have, which includes all objects users must create. */
export type Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ObjectMetaMetadata_Input = {
  /** Annotations is an unstructured key value map stored with a resource that may be set by external tools to store and retrieve arbitrary metadata. They are not queryable and should be preserved when modifying objects. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations */
  annotations?: unknown;
  /**
   * CreationTimestamp is a timestamp representing the server time when this object was created. It is not guaranteed to be set in happens-before order across separate operations. Clients may not set this value. It is represented in RFC3339 form and is in UTC.
   *
   * Populated by the system. Read-only. Null for lists. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   */
  creationTimestamp?: string | null | undefined;
  /** Number of seconds allowed for this object to gracefully terminate before it will be removed from the system. Only set when deletionTimestamp is also set. May only be shortened. Read-only. */
  deletionGracePeriodSeconds?: number | null | undefined;
  /**
   * DeletionTimestamp is RFC 3339 date and time at which this resource will be deleted. This field is set by the server when a graceful deletion is requested by the user, and is not directly settable by a client. The resource is expected to be deleted (no longer visible from resource lists, and not reachable by name) after the time in this field, once the finalizers list is empty. As long as the finalizers list contains items, deletion is blocked. Once the deletionTimestamp is set, this value may not be unset or be set further into the future, although it may be shortened or the resource may be deleted prior to this time. For example, a user may request that a pod is deleted in 30 seconds. The Kubelet will react by sending a graceful termination signal to the containers in the pod. After that 30 seconds, the Kubelet will send a hard termination signal (SIGKILL) to the container and after cleanup, remove the pod from the API. In the presence of network partitions, this object may still exist after this timestamp, until an administrator or automated process can determine the resource is fully terminated. If not set, graceful deletion of the object has not been requested.
   *
   * Populated by the system when a graceful deletion is requested. Read-only. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
   */
  deletionTimestamp?: string | null | undefined;
  /** Must be empty before the object is deleted from the registry. Each entry is an identifier for the responsible component that will remove the entry from the list. If the deletionTimestamp of the object is non-nil, entries in this list can only be removed. Finalizers may be processed and removed in any order.  Order is NOT enforced because it introduces significant risk of stuck finalizers. finalizers is a shared field, any actor with permission can reorder it. If the finalizer list is processed in order, then this can lead to a situation in which the component responsible for the first finalizer in the list is waiting for a signal (field value, external system, or other) produced by a component responsible for a finalizer later in the list, resulting in a deadlock. Without enforced ordering finalizers are free to order amongst themselves and are not vulnerable to ordering changes in the list. */
  finalizers?: Array<string | null | undefined> | null | undefined;
  /**
   * GenerateName is an optional prefix, used by the server, to generate a unique name ONLY IF the Name field has not been provided. If this field is used, the name returned to the client will be different than the name passed. This value will also be combined with a unique suffix. The provided value has the same validation rules as the Name field, and may be truncated by the length of the suffix required to make the value unique on the server.
   *
   * If this field is specified and the generated name exists, the server will return a 409.
   *
   * Applied only if Name is not specified. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#idempotency
   */
  generateName?: string | null | undefined;
  /** A sequence number representing a specific generation of the desired state. Populated by the system. Read-only. */
  generation?: number | null | undefined;
  /** Map of string keys and values that can be used to organize and categorize (scope and select) objects. May match selectors of replication controllers and services. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/labels */
  labels?: unknown;
  /** ManagedFields maps workflow-id and version to the set of fields that are managed by that workflow. This is mostly for internal housekeeping, and users typically shouldn't need to set or understand this field. A workflow can be the user's name, a controller's name, or the name of a specific apply path like "ci-cd". The set of fields is always in the version that the workflow used when modifying the object. */
  managedFields?:
    | Array<Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_ManagedFieldsEntryManagedFields_Input | null | undefined>
    | null
    | undefined;
  /** Name must be unique within a namespace. Is required when creating resources, although some resources may allow a client to request the generation of an appropriate name automatically. Name is primarily intended for creation idempotence and configuration definition. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names */
  name?: string | null | undefined;
  /**
   * Namespace defines the space within which each name must be unique. An empty namespace is equivalent to the "default" namespace, but "default" is the canonical representation. Not all objects are required to be scoped to a namespace - the value of this field for those objects will be empty.
   *
   * Must be a DNS_LABEL. Cannot be updated. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces
   */
  namespace?: string | null | undefined;
  /** List of objects depended by this object. If ALL objects in the list have been deleted, this object will be garbage collected. If this object is managed by a controller, then an entry in this list will point to this controller, with the controller field set to true. There cannot be more than one managing controller. */
  ownerReferences?:
    | Array<Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_OwnerReferenceOwnerReferences_Input | null | undefined>
    | null
    | undefined;
  /**
   * An opaque value that represents the internal version of this object that can be used by clients to determine when objects have changed. May be used for optimistic concurrency, change detection, and the watch operation on a resource or set of resources. Clients must treat these values as opaque and passed unmodified back to the server. They may only be valid for a particular resource or set of resources.
   *
   * Populated by the system. Read-only. Value must be treated as opaque by clients and . More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency
   */
  resourceVersion?: string | null | undefined;
  /** Deprecated: selfLink is a legacy read-only field that is no longer populated by the system. */
  selfLink?: string | null | undefined;
  /**
   * UID is the unique in time and space value for this object. It is typically generated by the server on successful creation of a resource and is not allowed to change on PUT operations.
   *
   * Populated by the system. Read-only. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
   */
  uid?: string | null | undefined;
};

/** OwnerReference contains enough information to let you identify an owning object. An owning object must be in the same namespace as the dependent, or be cluster-scoped, so there is no namespace field. */
export type Io_K8s_Apimachinery_Pkg_Apis_Meta_V1_OwnerReferenceOwnerReferences_Input = {
  /** API version of the referent. */
  apiVersion?: string | null | undefined;
  /** If true, AND if the owner has the "foregroundDeletion" finalizer, then the owner cannot be deleted from the key-value store until this reference is removed. See https://kubernetes.io/docs/concepts/architecture/garbage-collection/#foreground-deletion for how the garbage collector interacts with this field and enforces the foreground deletion. Defaults to false. To set this field, a user needs "delete" permission of the owner, otherwise 422 (Unprocessable Entity) will be returned. */
  blockOwnerDeletion?: boolean | null | undefined;
  /** If true, this reference points to the managing controller. */
  controller?: boolean | null | undefined;
  /** Kind of the referent. More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds */
  kind?: string | null | undefined;
  /** Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names */
  name?: string | null | undefined;
  /** UID of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids */
  uid?: string | null | undefined;
};

export type GetCrossplaneQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetCrossplaneQuery = {
  crossplane_services_open_control_plane_io: {
    v1alpha1: {
      Crossplane: {
        kind: string | null;
        metadata: { name: string | null; namespace: string | null } | null;
        spec: {
          version: string | null;
          providers: Array<{ name: string | null; version: string | null } | null> | null;
        } | null;
        status: {
          conditions: Array<{
            type: string | null;
            status: string | null;
            reason: string | null;
            message: string | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type GetExternalSecretsOperatorQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetExternalSecretsOperatorQuery = {
  external_secrets_services_open_control_plane_io: {
    v1alpha1: {
      ExternalSecretsOperator: {
        metadata: { name: string | null; namespace: string | null } | null;
        spec: { version: string | null } | null;
        status: {
          conditions: Array<{
            type: string | null;
            status: string | null;
            reason: string | null;
            message: string | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type GetFluxQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetFluxQuery = {
  flux_services_open_control_plane_io: {
    v1alpha1: {
      Flux: {
        metadata: { name: string | null; namespace: string | null } | null;
        spec: { version: string | null } | null;
        status: {
          conditions: Array<{
            type: string | null;
            status: string | null;
            reason: string | null;
            message: string | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type GetLandscaperQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetLandscaperQuery = {
  landscaper_services_open_control_plane_io: {
    v1alpha2: {
      Landscaper: {
        metadata: { name: string | null; namespace: string | null } | null;
        spec: { version: string | null } | null;
        status: {
          phase: string | null;
          conditions: Array<{
            type: string | null;
            status: string | null;
            reason: string | null;
            message: string | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type CreateManagedControlPlaneV2MutationVariables = Exact<{
  namespace?: string | null | undefined;
  object: CoreOpenControlPlaneIoV2alpha1ControlPlane_Input;
  dryRun?: boolean | null | undefined;
}>;

export type CreateManagedControlPlaneV2Mutation = {
  core_open_control_plane_io: {
    v2alpha1: {
      createControlPlane: {
        metadata: { name: string | null; namespace: string | null } | null;
        status: { phase: string | null } | null;
      } | null;
    } | null;
  } | null;
};

export type DeleteManagedControlPlaneV2MutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
  dryRun?: boolean | null | undefined;
}>;

export type DeleteManagedControlPlaneV2Mutation = {
  core_open_control_plane_io: { v2alpha1: { deleteControlPlane: boolean | null } | null } | null;
};

export type UpdateManagedControlPlaneV2MutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
  object: CoreOpenControlPlaneIoV2alpha1ControlPlane_Input;
  dryRun?: boolean | null | undefined;
}>;

export type UpdateManagedControlPlaneV2Mutation = {
  core_open_control_plane_io: {
    v2alpha1: {
      updateControlPlane: {
        metadata: { name: string | null; namespace: string | null } | null;
        status: { phase: string | null } | null;
      } | null;
    } | null;
  } | null;
};

export type CreateCrossplaneMutationVariables = Exact<{
  namespace?: string | null | undefined;
  object: CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input;
}>;

export type CreateCrossplaneMutation = {
  crossplane_services_open_control_plane_io: {
    v1alpha1: {
      createCrossplane: { metadata: { name: string | null; namespace: string | null } | null } | null;
    } | null;
  } | null;
};

export type CreateExternalSecretsOperatorMutationVariables = Exact<{
  namespace?: string | null | undefined;
  object: ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input;
}>;

export type CreateExternalSecretsOperatorMutation = {
  external_secrets_services_open_control_plane_io: {
    v1alpha1: {
      createExternalSecretsOperator: { metadata: { name: string | null; namespace: string | null } | null } | null;
    } | null;
  } | null;
};

export type CreateFluxMutationVariables = Exact<{
  namespace?: string | null | undefined;
  object: FluxServicesOpenControlPlaneIoV1alpha1Flux_Input;
}>;

export type CreateFluxMutation = {
  flux_services_open_control_plane_io: {
    v1alpha1: { createFlux: { metadata: { name: string | null; namespace: string | null } | null } | null } | null;
  } | null;
};

export type CreateLandscaperMutationVariables = Exact<{
  namespace?: string | null | undefined;
  object: LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input;
}>;

export type CreateLandscaperMutation = {
  landscaper_services_open_control_plane_io: {
    v1alpha2: {
      createLandscaper: { metadata: { name: string | null; namespace: string | null } | null } | null;
    } | null;
  } | null;
};

export type GetCrossplaneYamlQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetCrossplaneYamlQuery = {
  crossplane_services_open_control_plane_io: { v1alpha1: { CrossplaneYaml: string } | null } | null;
};

export type DeleteCrossplaneMutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type DeleteCrossplaneMutation = {
  crossplane_services_open_control_plane_io: { v1alpha1: { deleteCrossplane: boolean | null } | null } | null;
};

export type DeleteExternalSecretsOperatorMutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type DeleteExternalSecretsOperatorMutation = {
  external_secrets_services_open_control_plane_io: {
    v1alpha1: { deleteExternalSecretsOperator: boolean | null } | null;
  } | null;
};

export type DeleteFluxMutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type DeleteFluxMutation = {
  flux_services_open_control_plane_io: { v1alpha1: { deleteFlux: boolean | null } | null } | null;
};

export type DeleteLandscaperMutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type DeleteLandscaperMutation = {
  landscaper_services_open_control_plane_io: { v1alpha2: { deleteLandscaper: boolean | null } | null } | null;
};

export type GetEsoYamlQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetEsoYamlQuery = {
  external_secrets_services_open_control_plane_io: { v1alpha1: { ExternalSecretsOperatorYaml: string } | null } | null;
};

export type GetFluxYamlQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetFluxYamlQuery = {
  flux_services_open_control_plane_io: { v1alpha1: { FluxYaml: string } | null } | null;
};

export type GetLandscaperYamlQueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetLandscaperYamlQuery = {
  landscaper_services_open_control_plane_io: { v1alpha2: { LandscaperYaml: string } | null } | null;
};

export type UpdateCrossplaneMutationVariables = Exact<{
  namespace?: string | null | undefined;
  name: string;
  object: CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input;
}>;

export type UpdateCrossplaneMutation = {
  crossplane_services_open_control_plane_io: {
    v1alpha1: {
      updateCrossplane: { metadata: { name: string | null; namespace: string | null } | null } | null;
    } | null;
  } | null;
};

export type UpdateExternalSecretsOperatorMutationVariables = Exact<{
  namespace?: string | null | undefined;
  name: string;
  object: ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input;
}>;

export type UpdateExternalSecretsOperatorMutation = {
  external_secrets_services_open_control_plane_io: {
    v1alpha1: {
      updateExternalSecretsOperator: { metadata: { name: string | null; namespace: string | null } | null } | null;
    } | null;
  } | null;
};

export type UpdateFluxMutationVariables = Exact<{
  namespace?: string | null | undefined;
  name: string;
  object: FluxServicesOpenControlPlaneIoV1alpha1Flux_Input;
}>;

export type UpdateFluxMutation = {
  flux_services_open_control_plane_io: {
    v1alpha1: { updateFlux: { metadata: { name: string | null; namespace: string | null } | null } | null } | null;
  } | null;
};

export type UpdateLandscaperMutationVariables = Exact<{
  namespace?: string | null | undefined;
  name: string;
  object: LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input;
}>;

export type UpdateLandscaperMutation = {
  landscaper_services_open_control_plane_io: {
    v1alpha2: {
      updateLandscaper: { metadata: { name: string | null; namespace: string | null } | null } | null;
    } | null;
  } | null;
};

export type GetMcPv2QueryVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
}>;

export type GetMcPv2Query = {
  core_open_control_plane_io: {
    v2alpha1: {
      ControlPlane: {
        kind: string | null;
        metadata: {
          name: string | null;
          namespace: string | null;
          annotations: unknown;
          creationTimestamp: string | null;
        } | null;
        spec: {
          iam: {
            oidc: {
              defaultProvider: {
                roleBindings: Array<{
                  roleRefs: Array<{ kind: string | null; name: string | null; namespace: string | null } | null> | null;
                  subjects: Array<{
                    apiGroup: string | null;
                    kind: string | null;
                    name: string | null;
                    namespace: string | null;
                  } | null> | null;
                } | null> | null;
              } | null;
              extraProviders: Array<{
                roleBindings: Array<{
                  roleRefs: Array<{ kind: string | null; name: string | null; namespace: string | null } | null> | null;
                  subjects: Array<{
                    apiGroup: string | null;
                    kind: string | null;
                    name: string | null;
                    namespace: string | null;
                  } | null> | null;
                } | null> | null;
              } | null> | null;
            } | null;
            tokens: Array<{
              name: string | null;
              permissions: Array<{
                rules: Array<{
                  apiGroups: Array<string | null> | null;
                  resources: Array<string | null> | null;
                  verbs: Array<string | null> | null;
                } | null> | null;
              } | null> | null;
              roleRefs: Array<{ kind: string | null; name: string | null; namespace: string | null } | null> | null;
            } | null> | null;
          } | null;
        } | null;
        status: {
          phase: string | null;
          access: unknown;
          observedGeneration: number | null;
          conditions: Array<{
            type: string | null;
            status: string | null;
            reason: string | null;
            message: string | null;
            lastTransitionTime: string | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type CreateProjectMutationVariables = Exact<{
  object: CoreOpenmcpCloudV1alpha1Project_Input;
  dryRun?: boolean | null | undefined;
}>;

export type CreateProjectMutation = {
  core_openmcp_cloud: {
    v1alpha1: { createProject: { metadata: { name: string | null } | null } | null } | null;
  } | null;
};

export type CreateWorkspaceMutationVariables = Exact<{
  namespace: string;
  object: CoreOpenmcpCloudV1alpha1Workspace_Input;
  dryRun?: boolean | null | undefined;
}>;

export type CreateWorkspaceMutation = {
  core_openmcp_cloud: {
    v1alpha1: { createWorkspace: { metadata: { name: string | null; namespace: string | null } | null } | null } | null;
  } | null;
};

export type DeleteProjectMutationVariables = Exact<{
  name: string;
  dryRun?: boolean | null | undefined;
}>;

export type DeleteProjectMutation = {
  core_openmcp_cloud: { v1alpha1: { deleteProject: boolean | null } | null } | null;
};

export type DeleteWorkspaceMutationVariables = Exact<{
  name: string;
  namespace?: string | null | undefined;
  dryRun?: boolean | null | undefined;
}>;

export type DeleteWorkspaceMutation = {
  core_openmcp_cloud: { v1alpha1: { deleteWorkspace: boolean | null } | null } | null;
};

export type GetProjectQueryVariables = Exact<{
  name: string;
}>;

export type GetProjectQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      Project: {
        metadata: { name: string | null; annotations: unknown; labels: unknown } | null;
        spec: {
          members: Array<{
            kind: string | null;
            name: string | null;
            namespace: string | null;
            roles: Array<string | null> | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type GetWorkspaceQueryVariables = Exact<{
  name: string;
  namespace: string;
}>;

export type GetWorkspaceQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      Workspace: {
        metadata: { name: string | null; namespace: string | null; annotations: unknown; labels: unknown } | null;
        spec: {
          members: Array<{
            kind: string | null;
            name: string | null;
            namespace: string | null;
            roles: Array<string | null> | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type GetKubeconfigQueryVariables = Exact<{
  kubeConfigName: string;
  namespaceName?: string | null | undefined;
}>;

export type GetKubeconfigQuery = { v1: { Secret: { data: unknown } } | null };

export type GetMcPsListQueryVariables = Exact<{
  workspaceNamespace: string;
}>;

export type GetMcPsListQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      ManagedControlPlanes: {
        items: Array<{
          metadata: {
            name: string | null;
            namespace: string | null;
            creationTimestamp: string | null;
            annotations: unknown;
          } | null;
          spec: {
            components: {
              crossplane: { __typename: 'CoreOpenmcpCloudV1alpha1ManagedControlPlaneSpecComponentsCrossplane' } | null;
              flux: { __typename: 'CoreOpenmcpCloudV1alpha1ManagedControlPlaneSpecComponentsFlux' } | null;
              landscaper: { __typename: 'CoreOpenmcpCloudV1alpha1ManagedControlPlaneSpecComponentsLandscaper' } | null;
              kyverno: { __typename: 'CoreOpenmcpCloudV1alpha1ManagedControlPlaneSpecComponentsKyverno' } | null;
              externalSecretsOperator: {
                __typename: 'CoreOpenmcpCloudV1alpha1ManagedControlPlaneSpecComponentsExternalSecretsOperator';
              } | null;
              btpServiceOperator: {
                __typename: 'CoreOpenmcpCloudV1alpha1ManagedControlPlaneSpecComponentsBtpServiceOperator';
              } | null;
            } | null;
          } | null;
          status: {
            status: string | null;
            conditions: Array<{
              type: string | null;
              status: string | null;
              reason: string | null;
              message: string | null;
              lastTransitionTime: string | null;
            } | null> | null;
            components: {
              authentication: {
                access: { key: string | null; name: string | null; namespace: string | null } | null;
              } | null;
            } | null;
          } | null;
        }>;
      };
    } | null;
  } | null;
  core_open_control_plane_io: {
    v2alpha1: {
      ControlPlanes: {
        items: Array<{
          metadata: {
            name: string | null;
            namespace: string | null;
            creationTimestamp: string | null;
            annotations: unknown;
          } | null;
          status: {
            phase: string | null;
            access: unknown;
            conditions: Array<{ type: string | null; status: string | null } | null> | null;
          } | null;
        }>;
      };
    } | null;
  } | null;
};

export type McpV1SubscriptionSubscriptionVariables = Exact<{
  namespace: string;
}>;

export type McpV1SubscriptionSubscription = {
  core_openmcp_cloud_v1alpha1_managedcontrolplanes: { type: WatchEventType } | null;
};

export type McpV2SubscriptionSubscriptionVariables = Exact<{
  namespace: string;
}>;

export type McpV2SubscriptionSubscription = {
  core_open_control_plane_io_v2alpha1_controlplanes: { type: WatchEventType } | null;
};

export type GetProjectMembersQueryVariables = Exact<{
  name: string;
}>;

export type GetProjectMembersQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      Project: {
        metadata: { creationTimestamp: string | null; annotations: unknown } | null;
        spec: {
          members: Array<{
            kind: string | null;
            name: string | null;
            namespace: string | null;
            roles: Array<string | null> | null;
          } | null> | null;
        } | null;
      };
    } | null;
  } | null;
};

export type CreateSelfSubjectRulesReviewMutationVariables = Exact<{
  object: AuthorizationK8sIoV1SelfSubjectRulesReview_Input;
}>;

export type CreateSelfSubjectRulesReviewMutation = {
  authorization_k8s_io: {
    v1: {
      createSelfSubjectRulesReview: {
        status: {
          evaluationError: string | null;
          incomplete: boolean | null;
          resourceRules: Array<{
            apiGroups: Array<string | null> | null;
            resources: Array<string | null> | null;
            verbs: Array<string | null> | null;
            resourceNames: Array<string | null> | null;
          } | null> | null;
        } | null;
      } | null;
    } | null;
  } | null;
};

export type UpdateProjectMutationVariables = Exact<{
  name: string;
  object: CoreOpenmcpCloudV1alpha1Project_Input;
  dryRun?: boolean | null | undefined;
}>;

export type UpdateProjectMutation = {
  core_openmcp_cloud: {
    v1alpha1: { updateProject: { metadata: { name: string | null } | null } | null } | null;
  } | null;
};

export type UpdateWorkspaceMutationVariables = Exact<{
  name: string;
  namespace: string;
  object: CoreOpenmcpCloudV1alpha1Workspace_Input;
  dryRun?: boolean | null | undefined;
}>;

export type UpdateWorkspaceMutation = {
  core_openmcp_cloud: {
    v1alpha1: { updateWorkspace: { metadata: { name: string | null; namespace: string | null } | null } | null } | null;
  } | null;
};

export type GetWorkspaceV2ComponentsQueryVariables = Exact<{
  namespace: string;
}>;

export type GetWorkspaceV2ComponentsQuery = {
  crossplane_services_open_control_plane_io: {
    v1alpha1: {
      Crossplanes: {
        items: Array<{ metadata: { name: string | null } | null; spec: { version: string | null } | null }>;
      };
    } | null;
  } | null;
  flux_services_open_control_plane_io: {
    v1alpha1: {
      Fluxes: { items: Array<{ metadata: { name: string | null } | null; spec: { version: string | null } | null }> };
    } | null;
  } | null;
  landscaper_services_open_control_plane_io: {
    v1alpha2: {
      Landscapers: {
        items: Array<{ metadata: { name: string | null } | null; spec: { version: string | null } | null }>;
      };
    } | null;
  } | null;
  external_secrets_services_open_control_plane_io: {
    v1alpha1: {
      ExternalSecretsOperators: {
        items: Array<{ metadata: { name: string | null } | null; spec: { version: string | null } | null }>;
      };
    } | null;
  } | null;
};

export type GetWorkspacesQueryVariables = Exact<{
  projectNamespace: string;
}>;

export type GetWorkspacesQuery = {
  core_openmcp_cloud: {
    v1alpha1: {
      Workspaces: {
        items: Array<{
          apiVersion: string | null;
          kind: string | null;
          metadata: { name: string | null; namespace: string | null; annotations: unknown } | null;
          spec: {
            members: Array<{
              kind: string | null;
              name: string | null;
              roles: Array<string | null> | null;
              namespace: string | null;
            } | null> | null;
          } | null;
          status: { namespace: string | null } | null;
        }>;
      };
    } | null;
  } | null;
};

export type WorkspacesSubscriptionSubscriptionVariables = Exact<{
  namespace: string;
}>;

export type WorkspacesSubscriptionSubscription = {
  core_openmcp_cloud_v1alpha1_workspaces: { type: WatchEventType } | null;
};

export const GetCrossplaneDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetCrossplane' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'crossplane_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Crossplane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'version' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'providers' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'version' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'conditions' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetCrossplaneQuery, GetCrossplaneQueryVariables>;
export const GetExternalSecretsOperatorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetExternalSecretsOperator' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'external_secrets_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ExternalSecretsOperator' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'conditions' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetExternalSecretsOperatorQuery, GetExternalSecretsOperatorQueryVariables>;
export const GetFluxDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetFlux' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'flux_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Flux' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'conditions' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetFluxQuery, GetFluxQueryVariables>;
export const GetLandscaperDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLandscaper' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'landscaper_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha2' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Landscaper' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'phase' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'conditions' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLandscaperQuery, GetLandscaperQueryVariables>;
export const CreateManagedControlPlaneV2Document = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateManagedControlPlaneV2' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CoreOpenControlPlaneIoV2alpha1ControlPlane_Input' },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v2alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createControlPlane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'phase' } }],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateManagedControlPlaneV2Mutation, CreateManagedControlPlaneV2MutationVariables>;
export const DeleteManagedControlPlaneV2Document = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteManagedControlPlaneV2' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v2alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteControlPlane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteManagedControlPlaneV2Mutation, DeleteManagedControlPlaneV2MutationVariables>;
export const UpdateManagedControlPlaneV2Document = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateManagedControlPlaneV2' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CoreOpenControlPlaneIoV2alpha1ControlPlane_Input' },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v2alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateControlPlane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'phase' } }],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateManagedControlPlaneV2Mutation, UpdateManagedControlPlaneV2MutationVariables>;
export const CreateCrossplaneDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateCrossplane' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'crossplane_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createCrossplane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateCrossplaneMutation, CreateCrossplaneMutationVariables>;
export const CreateExternalSecretsOperatorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateExternalSecretsOperator' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: 'ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input',
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'external_secrets_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createExternalSecretsOperator' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateExternalSecretsOperatorMutation, CreateExternalSecretsOperatorMutationVariables>;
export const CreateFluxDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateFlux' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'FluxServicesOpenControlPlaneIoV1alpha1Flux_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'flux_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createFlux' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateFluxMutation, CreateFluxMutationVariables>;
export const CreateLandscaperDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateLandscaper' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'landscaper_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha2' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createLandscaper' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateLandscaperMutation, CreateLandscaperMutationVariables>;
export const GetCrossplaneYamlDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetCrossplaneYaml' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'crossplane_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'CrossplaneYaml' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetCrossplaneYamlQuery, GetCrossplaneYamlQueryVariables>;
export const DeleteCrossplaneDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteCrossplane' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'crossplane_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteCrossplane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCrossplaneMutation, DeleteCrossplaneMutationVariables>;
export const DeleteExternalSecretsOperatorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteExternalSecretsOperator' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'external_secrets_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteExternalSecretsOperator' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteExternalSecretsOperatorMutation, DeleteExternalSecretsOperatorMutationVariables>;
export const DeleteFluxDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteFlux' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'flux_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteFlux' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteFluxMutation, DeleteFluxMutationVariables>;
export const DeleteLandscaperDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteLandscaper' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'landscaper_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha2' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteLandscaper' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteLandscaperMutation, DeleteLandscaperMutationVariables>;
export const GetEsoYamlDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetEsoYaml' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'external_secrets_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ExternalSecretsOperatorYaml' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetEsoYamlQuery, GetEsoYamlQueryVariables>;
export const GetFluxYamlDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetFluxYaml' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'flux_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'FluxYaml' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetFluxYamlQuery, GetFluxYamlQueryVariables>;
export const GetLandscaperYamlDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetLandscaperYaml' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'landscaper_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha2' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'LandscaperYaml' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetLandscaperYamlQuery, GetLandscaperYamlQueryVariables>;
export const UpdateCrossplaneDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateCrossplane' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'CrossplaneServicesOpenControlPlaneIoV1alpha1Crossplane_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'crossplane_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateCrossplane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateCrossplaneMutation, UpdateCrossplaneMutationVariables>;
export const UpdateExternalSecretsOperatorDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateExternalSecretsOperator' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: {
                kind: 'Name',
                value: 'ExternalSecretsServicesOpenControlPlaneIoV1alpha1ExternalSecretsOperator_Input',
              },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'external_secrets_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateExternalSecretsOperator' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateExternalSecretsOperatorMutation, UpdateExternalSecretsOperatorMutationVariables>;
export const UpdateFluxDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateFlux' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'FluxServicesOpenControlPlaneIoV1alpha1Flux_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'flux_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateFlux' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateFluxMutation, UpdateFluxMutationVariables>;
export const UpdateLandscaperDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateLandscaper' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'LandscaperServicesOpenControlPlaneIoV1alpha2Landscaper_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'landscaper_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha2' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateLandscaper' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateLandscaperMutation, UpdateLandscaperMutationVariables>;
export const GetMcPv2Document = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMCPv2' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v2alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ControlPlane' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'creationTimestamp' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'iam' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'oidc' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'defaultProvider' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'roleBindings' },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'roleRefs' },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'kind' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'name' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'namespace' },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'subjects' },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'apiGroup' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'kind' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'name' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'namespace' },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'extraProviders' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'roleBindings' },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'roleRefs' },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'kind' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'name' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'namespace' },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                          {
                                                            kind: 'Field',
                                                            name: { kind: 'Name', value: 'subjects' },
                                                            selectionSet: {
                                                              kind: 'SelectionSet',
                                                              selections: [
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'apiGroup' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'kind' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'name' },
                                                                },
                                                                {
                                                                  kind: 'Field',
                                                                  name: { kind: 'Name', value: 'namespace' },
                                                                },
                                                              ],
                                                            },
                                                          },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'tokens' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'permissions' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'rules' },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          { kind: 'Field', name: { kind: 'Name', value: 'apiGroups' } },
                                                          { kind: 'Field', name: { kind: 'Name', value: 'resources' } },
                                                          { kind: 'Field', name: { kind: 'Name', value: 'verbs' } },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'roleRefs' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                                    { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                                    { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'phase' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'access' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'observedGeneration' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'conditions' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'lastTransitionTime' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetMcPv2Query, GetMcPv2QueryVariables>;
export const CreateProjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CoreOpenmcpCloudV1alpha1Project_Input' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createProject' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateProjectMutation, CreateProjectMutationVariables>;
export const CreateWorkspaceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateWorkspace' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CoreOpenmcpCloudV1alpha1Workspace_Input' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createWorkspace' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateWorkspaceMutation, CreateWorkspaceMutationVariables>;
export const DeleteProjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteProject' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteProjectMutation, DeleteProjectMutationVariables>;
export const DeleteWorkspaceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'DeleteWorkspace' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'deleteWorkspace' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteWorkspaceMutation, DeleteWorkspaceMutationVariables>;
export const GetProjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Project' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'labels' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'members' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'roles' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetProjectQuery, GetProjectQueryVariables>;
export const GetWorkspaceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetWorkspace' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Workspace' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'labels' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'members' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'roles' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetWorkspaceQuery, GetWorkspaceQueryVariables>;
export const GetKubeconfigDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetKubeconfig' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'kubeConfigName' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespaceName' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'v1' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'Secret' },
                  arguments: [
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'name' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'kubeConfigName' } },
                    },
                    {
                      kind: 'Argument',
                      name: { kind: 'Name', value: 'namespace' },
                      value: { kind: 'Variable', name: { kind: 'Name', value: 'namespaceName' } },
                    },
                  ],
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'data' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetKubeconfigQuery, GetKubeconfigQueryVariables>;
export const GetMcPsListDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetMCPsList' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'workspaceNamespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ManagedControlPlanes' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'workspaceNamespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'creationTimestamp' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'spec' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'components' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'crossplane' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'flux' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'landscaper' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'kyverno' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'externalSecretsOperator' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                                  ],
                                                },
                                              },
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'btpServiceOperator' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'status' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'conditions' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'reason' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'message' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'lastTransitionTime' } },
                                            ],
                                          },
                                        },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'components' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              {
                                                kind: 'Field',
                                                name: { kind: 'Name', value: 'authentication' },
                                                selectionSet: {
                                                  kind: 'SelectionSet',
                                                  selections: [
                                                    {
                                                      kind: 'Field',
                                                      name: { kind: 'Name', value: 'access' },
                                                      selectionSet: {
                                                        kind: 'SelectionSet',
                                                        selections: [
                                                          { kind: 'Field', name: { kind: 'Name', value: 'key' } },
                                                          { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                                          { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                                        ],
                                                      },
                                                    },
                                                  ],
                                                },
                                              },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v2alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ControlPlanes' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'workspaceNamespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'creationTimestamp' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'status' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'phase' } },
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'conditions' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              { kind: 'Field', name: { kind: 'Name', value: 'type' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'status' } },
                                            ],
                                          },
                                        },
                                        { kind: 'Field', name: { kind: 'Name', value: 'access' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetMcPsListQuery, GetMcPsListQueryVariables>;
export const McpV1SubscriptionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'McpV1Subscription' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud_v1alpha1_managedcontrolplanes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'namespace' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'type' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<McpV1SubscriptionSubscription, McpV1SubscriptionSubscriptionVariables>;
export const McpV2SubscriptionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'McpV2Subscription' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_open_control_plane_io_v2alpha1_controlplanes' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'namespace' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'type' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<McpV2SubscriptionSubscription, McpV2SubscriptionSubscriptionVariables>;
export const GetProjectMembersDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetProjectMembers' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Project' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'creationTimestamp' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                ],
                              },
                            },
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'spec' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'members' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'roles' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetProjectMembersQuery, GetProjectMembersQueryVariables>;
export const CreateSelfSubjectRulesReviewDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'CreateSelfSubjectRulesReview' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'NamedType',
              name: { kind: 'Name', value: 'AuthorizationK8sIoV1SelfSubjectRulesReview_Input' },
            },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'authorization_k8s_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'createSelfSubjectRulesReview' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'status' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'evaluationError' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'incomplete' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'resourceRules' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'apiGroups' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'resources' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'verbs' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'resourceNames' } },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateSelfSubjectRulesReviewMutation, CreateSelfSubjectRulesReviewMutationVariables>;
export const UpdateProjectDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateProject' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CoreOpenmcpCloudV1alpha1Project_Input' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateProject' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables>;
export const UpdateWorkspaceDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'UpdateWorkspace' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CoreOpenmcpCloudV1alpha1Workspace_Input' } },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'updateWorkspace' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'name' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'object' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'object' } },
                          },
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'dryRun' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'dryRun' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'metadata' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateWorkspaceMutation, UpdateWorkspaceMutationVariables>;
export const GetWorkspaceV2ComponentsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetWorkspaceV2Components' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'crossplane_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Crossplanes' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'spec' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'flux_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Fluxes' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'spec' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'landscaper_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha2' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Landscapers' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'spec' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'external_secrets_services_open_control_plane_io' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'ExternalSecretsOperators' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'spec' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'version' } }],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetWorkspaceV2ComponentsQuery, GetWorkspaceV2ComponentsQueryVariables>;
export const GetWorkspacesDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'GetWorkspaces' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'projectNamespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'v1alpha1' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'Field',
                        name: { kind: 'Name', value: 'Workspaces' },
                        arguments: [
                          {
                            kind: 'Argument',
                            name: { kind: 'Name', value: 'namespace' },
                            value: { kind: 'Variable', name: { kind: 'Name', value: 'projectNamespace' } },
                          },
                        ],
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            {
                              kind: 'Field',
                              name: { kind: 'Name', value: 'items' },
                              selectionSet: {
                                kind: 'SelectionSet',
                                selections: [
                                  { kind: 'Field', name: { kind: 'Name', value: 'apiVersion' } },
                                  { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'metadata' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                        { kind: 'Field', name: { kind: 'Name', value: 'annotations' } },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'spec' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [
                                        {
                                          kind: 'Field',
                                          name: { kind: 'Name', value: 'members' },
                                          selectionSet: {
                                            kind: 'SelectionSet',
                                            selections: [
                                              { kind: 'Field', name: { kind: 'Name', value: 'kind' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'roles' } },
                                              { kind: 'Field', name: { kind: 'Name', value: 'namespace' } },
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    kind: 'Field',
                                    name: { kind: 'Name', value: 'status' },
                                    selectionSet: {
                                      kind: 'SelectionSet',
                                      selections: [{ kind: 'Field', name: { kind: 'Name', value: 'namespace' } }],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetWorkspacesQuery, GetWorkspacesQueryVariables>;
export const WorkspacesSubscriptionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'subscription',
      name: { kind: 'Name', value: 'WorkspacesSubscription' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'core_openmcp_cloud_v1alpha1_workspaces' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'namespace' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'namespace' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'type' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<WorkspacesSubscriptionSubscription, WorkspacesSubscriptionSubscriptionVariables>;
