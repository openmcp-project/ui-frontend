import { useCallback, useEffect, useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { graphql } from '../../../types/__generated__/graphql';
import { Io_K8s_Api_Authorization_V1_ResourceRuleResourceRules_Input as ResourceRule } from '../../../types/__generated__/graphql/graphql';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '../../../lib/telemetry/telemetry.ts';
import type { Telemetry } from '../../../lib/telemetry/types.ts';
import type { PollingQueryResult } from './types.ts';

const PROJECTS_REFRESH_INTERVAL_MS = 30_000;

const CreateSelfSubjectRulesReview = graphql(`
  mutation CreateSelfSubjectRulesReview($object: AuthorizationK8sIoV1SelfSubjectRulesReview_Input!) {
    authorization_k8s_io {
      v1 {
        createSelfSubjectRulesReview(object: $object) {
          status {
            evaluationError
            incomplete
            resourceRules {
              apiGroups
              resources
              verbs
              resourceNames
            }
          }
        }
      }
    }
  }
`);

function parseProjectNamesFromRules(rules: (ResourceRule | null)[] | null | undefined): string[] {
  if (!Array.isArray(rules)) return [];
  const names = rules.flatMap((r) => {
    const apiGroups = r?.apiGroups ?? [];
    const resources = r?.resources ?? [];
    const verbs = r?.verbs ?? [];
    const apiGroupMatches = apiGroups.includes('core.openmcp.cloud') || apiGroups.includes('*');
    const resourceMatches = resources.includes('projects') || resources.includes('*');
    const verbMatches = verbs.includes('get') || verbs.includes('*');

    if (apiGroupMatches && resourceMatches && verbMatches) {
      return r?.resourceNames ?? [];
    }
    return [];
  });
  return Array.from(new Set(names.filter((name): name is string => Boolean(name))));
}

type RulesReviewStatus =
  | {
      evaluationError?: string | null;
      incomplete?: boolean | null;
    }
  | null
  | undefined;

function reportStatusConditions(status: RulesReviewStatus, telemetry: Telemetry): void {
  if (status?.evaluationError) {
    telemetry.breadcrumb('SelfSubjectRulesReview evaluationError', {
      level: 'warning',
      context: { evaluationError: status.evaluationError },
    });
  }
  if (status?.incomplete) {
    telemetry.breadcrumb('SelfSubjectRulesReview result is incomplete', { level: 'warning' });
  }
}

export function useProjectsQuery(): PollingQueryResult<string[]> {
  const [data, setData] = useState<string[]>([]);
  const [localError, setLocalError] = useState<Error | null>(null);
  const [fetchMutation, { loading, error }] = useMutation(CreateSelfSubjectRulesReview);
  const { t } = useTranslation();
  const telemetry = useTelemetry();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await fetchMutation({
        variables: {
          object: {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectRulesReview',
            metadata: {
              name: 'projects-access-check',
            },
            spec: { namespace: '*' },
          },
        },
      });

      const status = res.data?.authorization_k8s_io?.v1?.createSelfSubjectRulesReview?.status;
      reportStatusConditions(status, telemetry);

      const names = parseProjectNamesFromRules(status?.resourceRules);
      setData(names);
      setLocalError(null);
      setHasLoadedOnce(true);
      return names;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(t('ProjectsListView.fetchError'));
      setLocalError(err);
      return [];
    }
  }, [fetchMutation, t, telemetry]);

  useEffect(() => {
    // false positive: fetch() only calls setState after an await, not synchronously — see facebook/react#34905
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetch();
    const intervalId = window.setInterval(() => {
      void fetch();
    }, PROJECTS_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetch]);

  const isPending = loading && !hasLoadedOnce;

  return { data, isPending, error: localError ?? error ?? null, refetch: fetch };
}
