import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const EXCLUDED_QUERY_PARAMS = [
  'account',
  'accountnum',
  'address',
  'address1',
  'address2',
  'address3',
  'addressline1',
  'addressline2',
  'adres',
  'adresse',
  'adresse1',
  'adresse2',
  'adresse3',
  'adresse_email',
  'adressemail',
  'adressepostale',
  'age',
  'alter',
  'auth',
  'authpw',
  'bic',
  'billingaddress',
  'billingaddress1',
  'billingaddress2',
  'calle',
  'cardnumber',
  'carte',
  'cartebancaire',
  'carteidentite',
  'cb',
  'cc',
  'ccc',
  'cccsc',
  'cccvc',
  'cccvv',
  'ccexpiry',
  'ccexpmonth',
  'ccexpyear',
  'ccname',
  'ccnumber',
  'cctype',
  'cell',
  'cellphone',
  'city',
  'civilite',
  'civilité',
  'cle',
  'clientid',
  'clientsecret',
  'clé',
  'codepostal',
  'company',
  'consumerkey',
  'consumersecret',
  'contrasenya',
  'contraseña',
  'courriel',
  'cp',
  'creditcard',
  'creditcardnumber',
  'cvc',
  'cvv',
  'datedenaissance',
  'dateexpiration',
  'datenaissance',
  'dateofbirth',
  'debitcard',
  'departement',
  'dirección',
  'dob',
  'domain',
  'département',
  'ebost',
  'email',
  'emailaddress',
  'emailadresse',
  'entreprise',
  'epos',
  'epost',
  'eposta',
  'exp',
  'expiration',
  'familyname',
  'firma',
  'firstname',
  'formlogin',
  'fullname',
  'gender',
  'genre',
  'geschlecht',
  'gst',
  'gstnumber',
  'handynummer',
  'hasło',
  'heslo',
  'iban',
  'ibanaccountnum',
  'ibanaccountnumber',
  'id',
  'identifiant',
  'identifier',
  'identitenationale',
  'indirizzo',
  'kartakredytowa',
  'kennwort',
  'keyconsumerkey',
  'keyconsumersecret',
  'konto',
  'kontonr',
  'kontonummer',
  'kredietkaart',
  'kreditkarte',
  'kreditkort',
  'lastname',
  'login',
  'mail',
  'mdp',
  'mobiili',
  'mobile',
  'mobilne',
  'mot_de_passe',
  'motdepasse',
  'nachname',
  'name',
  'nationalite',
  'nickname',
  'nom',
  'nomcomplet',
  'nomdefamille',
  'nomfamille',
  'nss',
  'numero_fiscal',
  'numerocarte',
  'numerocarteidentite',
  'numerocompte',
  'numerodecarte',
  'numerofiscal',
  'numeroidentite',
  'numeromobile',
  'numeropasseport',
  'numerosecuritesociale',
  'numerotelephone',
  'numerotva',
  'numfiscal',
  'numsecu',
  'numtva',
  'osoite',
  'parole',
  'pass',
  'passeport',
  'passord',
  'password',
  'passwort',
  'pasword',
  'paswort',
  'paword',
  'pays',
  'phone',
  'pin',
  'plz',
  'portable',
  'postalcode',
  'postcode',
  'postleitzahl',
  'prenom',
  'privatekey',
  'prénom',
  'publickey',
  'pw',
  'pwd',
  'pword',
  'pwrd',
  'questionsecrete',
  'region',
  'reponsesecrete',
  'rib',
  'rue',
  'secret',
  'secretclé',
  'secretq',
  'secretquestion',
  'securitesociale',
  'sexe',
  'shippingaddress',
  'shippingaddress1',
  'shippingaddress2',
  'signature',
  'siren',
  'siret',
  'socialsec',
  'socialsecuritynumber',
  'societe',
  'socsec',
  'sokak',
  'ssn',
  'steuernummer',
  'strasse',
  'street',
  'surname',
  'swift',
  'tax',
  'taxnumber',
  'tel',
  'telefon',
  'telefonnr',
  'telefonnummer',
  'telefono',
  'telephone',
  'titre',
  'token',
  'token_auth',
  'tokenauth',
  'tva',
  'téléphone',
  'ulica',
  'user',
  'username',
  'utilisateur',
  'vat',
  'vatnumber',
  'via',
  'ville',
  'voie',
  'vorname',
  'wachtwoord',
  'wagwoord',
  'webhooksecret',
  'website',
  'zip',
  'zipcode',
];

export function injectMatomoTag(matomoUrl: string, siteId: string): string | null {
  const indexPath = join(process.cwd(), 'dist/client/index.html');
  console.log(`[Matomo] Injecting tracker for site ${siteId} into "${indexPath}".`);

  const excludedParams = JSON.stringify(EXCLUDED_QUERY_PARAMS);
  const u = matomoUrl.endsWith('/') ? matomoUrl : `${matomoUrl}/`;
  // scriptBody is the exact text between <script> and </script>. Its sha256 is
  // returned so server.ts can whitelist it in the strict CSP script-src — the
  // hash must match the browser's view of the element's textContent byte-for-byte.
  const scriptBody = `
    var _paq = window._paq = window._paq || [];
    _paq.push(["setExcludedQueryParams", ${excludedParams}]);
    _paq.push(['trackPageView']);
    _paq.push(['enableLinkTracking']);
    (function() {
      var u="${u}";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '${siteId}']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();`;
  const scriptHash = `sha256-${createHash('sha256').update(scriptBody).digest('base64')}`;

  let html: string;
  try {
    html = readFileSync(indexPath, 'utf-8');
  } catch (err) {
    console.error(`[Matomo] Failed to read ${indexPath}.`, err);
    return null;
  }

  // Bootstrap already injected (warm restart): return the hash so the CSP still
  // gets it, but skip re-writing the file.
  if (html.includes('window._paq')) {
    console.log('[Matomo] Bootstrap already present, skipping injection.');
    return scriptHash;
  }

  const scriptTag = `<!-- Matomo -->
  <script>${scriptBody}</script>`;

  const headClose = /<\/head>/i;
  if (!headClose.test(html)) {
    console.error('[Matomo] </head> tag not found, aborting.');
    return null;
  }
  html = html.replace(headClose, `  ${scriptTag}\n</head>`);

  writeFileSync(indexPath, html, 'utf-8');
  console.log('[Matomo] Bootstrap injected successfully.');
  return scriptHash;
}
