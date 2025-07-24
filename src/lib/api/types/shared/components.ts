export type ComponentType = 'crossplane' | 'btpServiceOperator' | 'externalSecretsOperator' | 'flux' | 'kyverno';

export const possibleComponents: Component[] = [
  { name: 'crossplane', version: '1.17.1' },
  { name: 'btpServiceOperator', version: '0.6.8' },
  { name: 'externalSecretsOperator', version: '2.12.4' },
  { name: 'flux', version: '2.12.4' },
  { name: 'kyverno', version: '3.2.4' },
];

export const possibleProviders: Provider[] = [
  { name: 'btp', version: '1.0.0' },
  { name: 'cloudfoundry', version: '2.2.3' },
  { name: 'kubernetes', version: '0.15.0' },
];

export interface Component {
  name: ComponentType;
  version: string;
}

export interface Provider {
  name: string;
  version: string;
}

export interface CrossplaneComponent extends Component {
  providers: Provider[];
}
