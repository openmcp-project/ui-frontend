import { Form, FormGroup, FormItem, Input, Label } from '@ui5/webcomponents-react';

export interface ModifyGitRepositoryDialogStep1Props {
  close: () => void;
}

export function ModifyGitRepositoryDialogStep1() {
  return (
    <Form layout={'S1 M1 L1 XL1'}>
      <FormGroup headerText="Metadata">
        <FormItem labelContent={<Label required>Name</Label>}>
          <Input required type="Text" />
        </FormItem>
      </FormGroup>
      <FormGroup headerText="Spec">
        <FormItem labelContent={<Label required>Interval</Label>}>
          <Input type="Text" required placeholder="1m0s" />
        </FormItem>
        <FormItem labelContent={<Label required>URL</Label>}>
          <Input type="Text" required placeholder="https://github.com/owner/repo" />
        </FormItem>
        <FormItem labelContent={<Label required>Branch</Label>}>
          <Input type="Text" required placeholder="main" />
        </FormItem>
        <FormItem labelContent={<Label>SecretRef</Label>}>
          <Input type="Text" required />
        </FormItem>
      </FormGroup>
    </Form>
  );
}
