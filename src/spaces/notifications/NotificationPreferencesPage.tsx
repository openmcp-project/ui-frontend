import '@ui5/webcomponents-icons/dist/delete';
import '@ui5/webcomponents-icons/dist/add';
import {
  Bar,
  Button,
  BusyIndicator,
  CheckBox,
  Dialog,
  FlexBox,
  Label,
  Option,
  Panel,
  Select,
  SelectDomRef,
  Table,
  TableCell,
  TableHeaderCell,
  TableHeaderRow,
  TableRow,
  Text,
  Title,
  Ui5CustomEvent,
} from '@ui5/webcomponents-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';
import { generateCrateAPIConfig } from '../../lib/api/types/apiConfig';
import { fetchApiServer, fetchApiServerJson } from '../../lib/api/fetch';
import { useAuthOnboarding } from '../onboarding/auth/AuthContextOnboarding';

const API_GROUP = 'notifications.platform.open-control-plane.io';
const API_VERSION = 'v1alpha1';
const crateConfig = generateCrateAPIConfig();

type Category = 'MembershipAdded' | 'NewServiceVersion';
const ALL_CATEGORIES: Category[] = ['MembershipAdded', 'NewServiceVersion'];

interface UserNotificationOptOut {
  metadata: { name: string; namespace: string };
  spec: {
    subject: { kind: string; name: string };
    target: { kind: string; name: string };
    categories?: Category[];
  };
}

interface UserNotificationOptOutList {
  items: UserNotificationOptOut[];
}

const SWR_KEY = `list-usernotificationoptouts`;

export function NotificationPreferencesPage() {
  const { t } = useTranslation();
  const auth = useAuthOnboarding();
  const userEmail = auth.user?.email ?? '';
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addTarget, setAddTarget] = useState({ kind: 'Project', name: '' });
  const [addCategories, setAddCategories] = useState<Category[]>([]);

  const { data, isLoading, mutate } = useSWR<UserNotificationOptOutList>(
    SWR_KEY,
    () =>
      fetchApiServerJson<UserNotificationOptOutList>(
        `/apis/${API_GROUP}/${API_VERSION}/usernotificationoptouts`,
        crateConfig,
      ),
    { revalidateOnFocus: true },
  );

  const myOptOuts = (data?.items ?? []).filter(
    (o) => o.spec.subject.kind === 'User' && o.spec.subject.name === userEmail,
  );

  const deleteOptOut = async (item: UserNotificationOptOut) => {
    await fetchApiServer(
      `/apis/${API_GROUP}/${API_VERSION}/namespaces/${item.metadata.namespace}/usernotificationoptouts/${item.metadata.name}`,
      crateConfig,
      undefined,
      'DELETE',
    );
    await mutate();
  };

  const createOptOut = async () => {
    const ns = `project-${addTarget.name}`;
    const body = JSON.stringify({
      apiVersion: `${API_GROUP}/${API_VERSION}`,
      kind: 'UserNotificationOptOut',
      metadata: { generateName: 'optout-', namespace: ns },
      spec: {
        subject: { kind: 'User', name: userEmail },
        target: { kind: addTarget.kind, name: addTarget.name },
        categories: addCategories.length > 0 ? addCategories : undefined,
      },
    });
    await fetchApiServer(
      `/apis/${API_GROUP}/${API_VERSION}/namespaces/${ns}/usernotificationoptouts`,
      crateConfig,
      undefined,
      'POST',
      body,
    );
    await mutate();
    setAddDialogOpen(false);
  };

  const toggleCategory = (cat: Category) =>
    setAddCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <FlexBox alignItems="Center" justifyContent="SpaceBetween" style={{ marginBottom: '1.5rem' }}>
        <Title>{t('Notifications.pageTitle')}</Title>
        <Button icon="add" design="Emphasized" onClick={() => setAddDialogOpen(true)}>
          {t('Notifications.addOptOut')}
        </Button>
      </FlexBox>

      <Panel headerText={t('Notifications.myOptOuts')} collapsed={false}>
        {isLoading ? (
          <BusyIndicator active style={{ padding: '2rem' }} />
        ) : myOptOuts.length === 0 ? (
          <Text style={{ padding: '1rem', color: 'var(--sapContent_LabelColor)' }}>
            {t('Notifications.noOptOuts')}
          </Text>
        ) : (
          <Table>
            <TableHeaderRow slot="headerRow">
              <TableHeaderCell>{t('Notifications.colTarget')}</TableHeaderCell>
              <TableHeaderCell>{t('Notifications.colScope')}</TableHeaderCell>
              <TableHeaderCell>{t('Notifications.colCategories')}</TableHeaderCell>
              <TableHeaderCell />
            </TableHeaderRow>
            {myOptOuts.map((item) => (
              <TableRow key={`${item.metadata.namespace}/${item.metadata.name}`}>
                <TableCell>
                  <strong>{item.spec.target.name}</strong>
                </TableCell>
                <TableCell>{item.spec.target.kind}</TableCell>
                <TableCell>
                  {item.spec.categories && item.spec.categories.length > 0
                    ? item.spec.categories.join(', ')
                    : t('Notifications.categoriesAll')}
                </TableCell>
                <TableCell>
                  <Button
                    icon="delete"
                    design="Transparent"
                    tooltip={t('Notifications.delete')}
                    onClick={() => void deleteOptOut(item)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </Panel>

      <Dialog
        open={addDialogOpen}
        headerText={t('Notifications.addOptOutTitle')}
        onClose={() => setAddDialogOpen(false)}
        footer={
          <Bar
            endContent={
              <FlexBox gap={8}>
                <Button design="Emphasized" onClick={() => void createOptOut()}>
                  {t('Notifications.save')}
                </Button>
                <Button onClick={() => setAddDialogOpen(false)}>{t('Notifications.cancel')}</Button>
              </FlexBox>
            }
          />
        }
      >
        <FlexBox direction="Column" gap={16} style={{ padding: '1rem', minWidth: '320px' }}>
          <FlexBox direction="Column" gap={4}>
            <Label required>{t('Notifications.targetKind')}</Label>
            <Select
              onChange={(e: Ui5CustomEvent<SelectDomRef, { selectedOption: HTMLElement }>) =>
                setAddTarget((prev) => ({
                  ...prev,
                  kind: e.detail.selectedOption.getAttribute('value') ?? 'Project',
                }))
              }
            >
              <Option value="Project">{t('Notifications.kindProject')}</Option>
              <Option value="Workspace">{t('Notifications.kindWorkspace')}</Option>
              <Option value="ControlPlane">{t('Notifications.kindControlPlane')}</Option>
            </Select>
          </FlexBox>
          <FlexBox direction="Column" gap={4}>
            <Label required>{t('Notifications.targetName')}</Label>
            <input
              style={{
                border: '1px solid var(--sapField_BorderColor)',
                borderRadius: '4px',
                padding: '8px',
                fontSize: '14px',
              }}
              value={addTarget.name}
              onChange={(e) => setAddTarget((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('Notifications.targetNamePlaceholder')}
            />
          </FlexBox>
          <FlexBox direction="Column" gap={4}>
            <Label>{t('Notifications.categories')}</Label>
            <Text style={{ fontSize: '12px', color: 'var(--sapContent_LabelColor)' }}>
              {t('Notifications.categoriesHint')}
            </Text>
            {ALL_CATEGORIES.map((cat) => (
              <CheckBox
                key={cat}
                text={t(`Notifications.category_${cat}`)}
                checked={addCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
              />
            ))}
          </FlexBox>
        </FlexBox>
      </Dialog>
    </div>
  );
}
