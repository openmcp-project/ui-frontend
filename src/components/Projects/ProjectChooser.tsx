import { VariantItem, VariantManagement } from '@ui5/webcomponents-react';
import { useProjectsQuery as _useProjectsQuery } from '../../spaces/onboarding/hooks/useProjectsQuery.ts';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';

interface Props {
  currentProjectName: string;
  useProjectsQuery?: typeof _useProjectsQuery;
}

export default function ProjectChooser({ currentProjectName, useProjectsQuery = _useProjectsQuery }: Props) {
  const { data, error } = useProjectsQuery();
  const navigate = useLuigiNavigate();

  if (error) {
    return <IllustratedError details={error.message} />;
  }

  return (
    <>
      <VariantManagement
        size="H5"
        hideSaveAs
        hideManageVariants
        titleText="Select Project"
        closeOnItemSelect
        placement="Bottom"
        onSelect={(e) => {
          navigate(`/projects/${e.detail.selectedVariant.children}`);
        }}
      >
        {data?.map((p) => (
          <VariantItem key={p} selected={p === currentProjectName}>
            {p}
          </VariantItem>
        ))}
      </VariantManagement>
    </>
  );
}
