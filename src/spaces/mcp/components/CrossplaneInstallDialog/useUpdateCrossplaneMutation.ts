import { gql } from '@apollo/client';

export const UpdateCrossplaneMutation = gql`
  mutation UpdateCrossplane($namespace: String, $name: String!, $object: CrossplaneInput!) {
    crossplane_services_openmcp_cloud {
      v1alpha1 {
        updateCrossplane(namespace: $namespace, name: $name, object: $object) {
          metadata {
            name
            namespace
          }
        }
      }
    }
  }
`;
