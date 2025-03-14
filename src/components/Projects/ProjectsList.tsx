import { AnalyticalTable } from "@ui5/webcomponents-react";
import { ThemingParameters } from "@ui5/webcomponents-react-base";
import { CopyButton } from "../Shared/CopyButton.tsx";
import useLuigiNavigate from "../Shared/useLuigiNavigate.tsx";
import IllustratedError from "../Shared/IllustratedError.tsx";
import useResource from "../../lib/api/useApiResource";
import { projectnameToNamespace } from "../../utils/index"
import "@ui5/webcomponents-icons/dist/copy"
import "@ui5/webcomponents-icons/dist/arrow-right"
import { ListProjectNames } from "../../lib/api/types/crate/listProjectNames";

export default function ProjectsList() {
  const navigate = useLuigiNavigate();
  const { data, error } = useResource(ListProjectNames, { refreshInterval: 3000 });
  if (error) {
    return <IllustratedError error={error} />;
  }

  return (
    <>
      <AnalyticalTable
        onRowClick={(e: any) => {
          navigate(`/mcp/projects/${data ? [e.detail.row.values.projectName] : ""}`);
        }}
        columns={[
          {
            Header: "Projects",
            accessor: "projectName",
            Cell: (instance: any) => (
              <div style={{
                cursor: 'pointer',
                width: "100%",
                color: ThemingParameters.sapLinkColor,
                fontWeight: 'bold'
              }}>
                {instance.cell.value}
              </div>
            )
          },
          {
            Header: "Namespace",
            accessor: "nameSpace",
            Cell: (instance: any) => (
              <div style=
                {{
                  display: "flex",
                  justifyContent: "start",
                  gap: "0.5rem",
                  alignItems: "center",
                  width: "100%",
                  cursor: 'pointer'
                }}>
                <CopyButton text={instance.cell.value}>
                </CopyButton>
              </div>
            )
          }
        ]}
        data={
          data?.map((e) => {
            return {
              projectName: e,
              nameSpace: projectnameToNamespace(e),
            };
          }) ?? []
        }
      />
    </>
  );
}
