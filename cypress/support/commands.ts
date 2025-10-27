import '@ui5/webcomponents-cypress-commands';
import '../../src/utils/i18n/i18n';

const toPlain = <T>(o: T): T => JSON.parse(JSON.stringify(o));

Cypress.Commands.add('deepEqualJson', { prevSubject: true }, (subject, expected) => {
  expect(toPlain(subject)).to.deep.equal(toPlain(expected));
  return subject;
});
