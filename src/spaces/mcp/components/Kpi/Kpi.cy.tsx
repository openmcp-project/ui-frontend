import { Kpi, KpiProps } from './Kpi';
import { APIError } from '../../../../lib/api/error.ts';

describe('<Kpi>', () => {
  const mount = (props: KpiProps) => {
    cy.mount(<Kpi {...props} />, {});
  };

  context('kpiType="progress"', () => {
    it('renders correctly', () => {
      mount({
        kpiType: 'progress',
        isLoading: false,
        progressValue: 75,
        progressLabel: 'Healthy: 3 / 4',
      });

      // BusyIndicator should be inactive
      cy.get('[data-cy="busy-indicator"]').should('not.have.attr', 'active');

      // Kpi should be shown
      cy.contains('Healthy: 3 / 4').should('exist');
      cy.get('[data-cy="progress-indicator"]').should('have.attr', 'value', 75);
    });

    it('renders with "isLoading=true"', () => {
      mount({
        kpiType: 'progress',
        isLoading: true,
        progressValue: 42,
        progressLabel: 'progressLabel',
      });

      // BusyIndicator should be present and active
      cy.get('[data-cy="busy-indicator"]').should('have.attr', 'active');

      // Kpi should be shown
      cy.contains('progressLabel').should('exist');
      cy.get('[data-cy="progress-indicator"]').should('have.attr', 'value', 42);
    });

    it('renders with "error" defined', () => {
      mount({
        kpiType: 'progress',
        isLoading: false,
        error: new APIError('error message', 404),
        progressValue: 10,
        progressLabel: 'won’t show',
      });

      // Error message should be shown
      cy.get('[role="status"]').should(
        'contain.text',
        'There was a problem loading this data. Please try again later.',
      );

      // Kpi should not be shown
      cy.get('[data-cy="busy-indicator"]').should('not.exist');
      cy.get('body').should('not.contain', 'won’t show');
      cy.get('[data-cy="progress-indicator"]').should('not.exist');
    });
  });

  context('kpiType="none"', () => {
    it('renders nothing', () => {
      mount({ kpiType: 'enabled' });

      cy.get('[data-cy="busy-indicator"]').should('not.exist');
      cy.get('[data-cy="progress-indicator"]').should('not.exist');
    });
  });
});
