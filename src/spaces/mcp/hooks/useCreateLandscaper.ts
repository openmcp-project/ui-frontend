import { useMutation } from '@apollo/client/react';
import { useCallback } from 'react';
import {
  CreateLandscaperDocument,
  type CreateLandscaperMutationVariables,
} from '../../../types/__generated__/graphql/graphql';

export function useCreateLandscaper() {
  const [createMutation, { loading, error }] = useMutation(CreateLandscaperDocument, {
    refetchQueries: ['GetLandscaper'],
  });

  const create = useCallback(
    async (variables: { namespace: string; object: unknown }) => {
      return createMutation({ variables: variables as CreateLandscaperMutationVariables });
    },
    [createMutation],
  );

  return { create, loading, error };
}
