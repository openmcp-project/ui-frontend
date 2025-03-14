import { MemberRoleSelect } from "./MemberRoleSelect.tsx";
import { MemberRoles } from "../../lib/api/types/shared/members";
import "@ui5/webcomponents-cypress-commands";

function mountContainer(fn = function (_: MemberRoles): void {}) {
  cy.mount(<MemberRoleSelect onChange={fn} value={MemberRoles.viewer}></MemberRoleSelect>);
}

describe("<MemberRoleSelect />", () => {
  beforeEach(() => {
    mountContainer();
  });

  it("Should select Administrator value", () => {
    cy.get("#member-role-select").openDropDownByClick();
    cy.get('#member-role-select [value="admin"]').clickDropdownMenuItem({ force: true });

    cy.get("#member-role-select").should("have.value", MemberRoles.admin);
  });

  it("Should select Viewer value", () => {
    cy.get("#member-role-select").openDropDownByClick();
    cy.get('#member-role-select [value="view"]').clickDropdownMenuItem({ force: true });

    cy.get("#member-role-select").should("have.value", MemberRoles.viewer);
  });
});
