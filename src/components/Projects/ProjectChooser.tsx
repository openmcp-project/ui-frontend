import { VariantItem, VariantManagement } from '@ui5/webcomponents-react';
import { CopyButton } from '../Shared/CopyButton.tsx';
import useLuigiNavigate from '../Shared/useLuigiNavigate.tsx';
import IllustratedError from '../Shared/IllustratedError.tsx';
import useResource from '../../lib/api/useApiResource';
import { ListProjectNames } from '../../lib/api/types/crate/listProjectNames';

interface Props {
  currentProjectName: string;
}

export default function ProjectChooser({ currentProjectName }: Props) {
  const { data, error } = useResource(ListProjectNames);
  const navigate = useLuigiNavigate();

  if (error) {
    return <IllustratedError error={error} />;
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
          navigate(
            `/mcp/projects/${e.detail.selectedVariant.variantItem.innerText}`,
          );
        }}
      >
        {data?.map((p) => (
          <VariantItem key={p} selected={p === currentProjectName}>
            {p}
          </VariantItem>
        ))}
      </VariantManagement>
      <CopyButton text={`project-${currentProjectName}`} />
    </>
  );
}
