import '@ui5/webcomponents-cypress-commands';
import '../../src/utils/i18n/i18n';

// Sort object keys recursively so deep equality is key-order-insensitive
const toPlain = <T>(o: T): T => {
  const json = JSON.stringify(o, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
  return JSON.parse(json) as T;
};

Cypress.Commands.add('deepEqualJson', { prevSubject: true }, (subject, expected) => {
  expect(toPlain(subject)).to.deep.equal(toPlain(expected));
  return subject;
});
