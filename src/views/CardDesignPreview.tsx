import LogoCrossplane from '../assets/images/logo-crossplane.svg';
import LogoFlux from '../assets/images/logo-flux.svg';
import LogoLandscaper from '../assets/images/logo-landscaper.svg';
import LogoKyverno from '../assets/images/logo-kyverno.png';
import LogoEso from '../assets/images/logo-eso.svg';
import styles from './CardDesignPreview.module.css';

const COMPONENTS = [
  { name: 'Crossplane', logo: LogoCrossplane },
  { name: 'Flux', logo: LogoFlux },
  { name: 'Landscaper', logo: LogoLandscaper },
];

const COMPONENTS_FULL = [
  { name: 'Crossplane', logo: LogoCrossplane },
  { name: 'Flux', logo: LogoFlux },
  { name: 'Landscaper', logo: LogoLandscaper },
  { name: 'Kyverno', logo: LogoKyverno },
  { name: 'External Secrets', logo: LogoEso },
];

type Status = 'Ready' | 'Progressing' | 'Not Ready' | 'Deleting';

const STATUS_CONFIG: Record<Status, { color: string; dot: string; label: string }> = {
  Ready: { color: 'var(--sapPositiveColor, #188918)', dot: '#188918', label: 'Ready' },
  Progressing: { color: 'var(--sapCriticalColor, #e76500)', dot: '#e76500', label: 'Progressing' },
  'Not Ready': { color: 'var(--sapNegativeColor, #bb0000)', dot: '#bb0000', label: 'Not Ready' },
  Deleting: { color: 'var(--sapNeutralColor, #6a6d70)', dot: '#6a6d70', label: 'Deleting' },
};

const AVATARS = ['ML', 'TK', 'SR', 'PP'];

interface CardData {
  name: string;
  kind: string;
  status: Status;
  components: { name: string; logo: string }[];
}

const CARDS: CardData[] = [
  { name: 'production-eu-west', kind: 'ControlPlane', status: 'Ready', components: COMPONENTS_FULL },
  { name: 'staging-us-east', kind: 'ManagedControlPlane', status: 'Progressing', components: COMPONENTS },
  { name: 'dev-local', kind: 'ControlPlane', status: 'Not Ready', components: COMPONENTS.slice(0, 2) },
  { name: 'preview-feature-x', kind: 'ControlPlane', status: 'Deleting', components: [] },
];

function Avatars({ size = 24 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {AVATARS.slice(0, 3).map((initials, i) => (
        <div
          key={initials}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: `hsl(${i * 60 + 200}, 40%, 55%)`,
            border: '2px solid var(--sapBaseColor, #fff)',
            marginLeft: i === 0 ? 0 : -size * 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.35,
            fontWeight: 600,
            color: '#fff',
            zIndex: 3 - i,
            position: 'relative',
          }}
        >
          {initials}
        </div>
      ))}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="3" r="1.2" fill="currentColor" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
      <circle cx="8" cy="13" r="1.2" fill="currentColor" />
    </svg>
  );
}

function YamlBtn() {
  return (
    <button className={styles.iconBtn} title="View YAML">
      <svg width="18" height="10" viewBox="0 0 32 16" fill="none">
        <path d="M31.75 6.25C31.6 6.08 31.4 6 31.19 6H6.81C6.58 6 6.39 6.08 6.22 6.25C6.07 6.4 6 6.58 6 6.81V12.19C6 12.42 6.07 12.61 6.22 12.78C6.39 12.93 6.58 13 6.81 13H31.19C31.4 13 31.6 12.93 31.75 12.78C31.92 12.61 32 12.42 32 12.19V6.81C32 6.58 31.92 6.4 31.75 6.25Z" fill="currentColor" />
        <path d="M11.19 14.41C11.42 14.41 11.6 14.48 11.75 14.63C11.92 14.77 12 14.96 12 15.19C12 15.42 11.92 15.6 11.75 15.75C11.6 15.92 11.42 16 11.19 16H0.81C0.58 16 0.39 15.92 0.22 15.75C0.07 15.6 0 15.42 0 15.19V6C0 5.79 0.06 5.61 0.19 5.47L4.66 0.28C4.78 0.09 4.98 0 5.25 0H11.19C11.42 0 11.6 0.08 11.75 0.25C11.92 0.4 12 0.58 12 0.81V3.19C12 3.42 11.92 3.61 11.75 3.78C11.6 3.93 11.42 4 11.19 4C10.96 4 10.77 3.93 10.63 3.78C10.48 3.61 10.41 3.42 10.41 3.19V1.59H5.63L5 2.34V4.41C5 4.84 4.84 5.22 4.53 5.53C4.22 5.84 3.84 6 3.41 6H1.84L1.59 6.28V14.41H11.19Z" fill="currentColor" />
        <path d="M8.88 10.24L7 7H8.69L9.65 8.95L10.65 7H12.32L10.43 10.24V12H8.88V10.24Z" fill="white" />
        <path d="M16.12 11.04H14.27L13.96 12H12.39L14.25 7H16.16L18.01 12H16.43L16.12 11.04ZM15.76 9.95L15.37 8.73C15.28 8.47 15.22 8.27 15.19 8.13C15.16 8.25 15.1 8.45 15.02 8.73L14.62 9.95H15.76Z" fill="white" />
        <path d="M19.33 7H21.63L22.23 9.03C22.27 9.16 22.31 9.32 22.35 9.52C22.4 9.72 22.44 9.9 22.47 10.06C22.5 9.91 22.54 9.73 22.59 9.53C22.64 9.33 22.68 9.17 22.72 9.06L23.33 7H25.57V12H24.13V9.54C24.13 9.09 24.14 8.69 24.16 8.34C24.08 8.67 23.95 9.12 23.77 9.71L23.08 12H21.81L21.13 9.71C20.94 9.12 20.81 8.67 20.74 8.34C20.75 8.79 20.76 9.18 20.76 9.54V12H19.33V7Z" fill="white" />
        <path d="M27.2 7H28.75V10.79H31V12H27.2V7Z" fill="white" />
      </svg>
    </button>
  );
}

function ConnectBtn({ disabled = false }: { disabled?: boolean }) {
  return (
    <button className={`${styles.connectBtn} ${disabled ? styles.connectBtnDisabled : ''}`} disabled={disabled}>
      Connect
    </button>
  );
}

/* ─── VARIANT A: Status Bar (left accent border) ─── */
function VariantA({ card }: { card: CardData }) {
  const s = STATUS_CONFIG[card.status];
  return (
    <div className={styles.variantA}>
      <div className={styles.variantAAccent} style={{ background: s.dot }} />
      <div className={styles.variantAInner}>
        <div className={styles.variantAHeader}>
          <div>
            <div className={styles.variantAName}>{card.name}</div>
            <div className={styles.variantAKind}>{card.kind}</div>
          </div>
          <div className={styles.variantAStatusPill} style={{ color: s.color, borderColor: s.color }}>
            <span className={styles.variantADot} style={{ background: s.dot }} />
            {s.label}
          </div>
        </div>

        <div className={styles.variantABody}>
          {card.components.length === 0 ? (
            <span className={styles.variantAEmpty}>No components installed</span>
          ) : (
            card.components.map((c) => (
              <div key={c.name} className={styles.variantAIcon} title={c.name}>
                <img src={c.logo} alt={c.name} />
              </div>
            ))
          )}
        </div>

        <div className={styles.variantAFooter}>
          <div className={styles.variantAActions}>
            <button className={styles.iconBtn} title="Options"><MenuIcon /></button>
            <YamlBtn />
            <Avatars size={22} />
          </div>
          <ConnectBtn disabled={card.status !== 'Ready'} />
        </div>
      </div>
    </div>
  );
}

/* ─── VARIANT B: Capability First (large icons center-stage) ─── */
function VariantB({ card }: { card: CardData }) {
  const s = STATUS_CONFIG[card.status];
  return (
    <div className={styles.variantB}>
      <div className={styles.variantBHeader}>
        <div className={styles.variantBName}>{card.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: s.color, fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
          {s.label}
        </div>
      </div>

      <div className={styles.variantBBody}>
        {card.components.length === 0 ? (
          <span className={styles.variantAEmpty}>No components</span>
        ) : (
          card.components.map((c) => (
            <div key={c.name} className={styles.variantBIcon}>
              <img src={c.logo} alt={c.name} />
              <span className={styles.variantBIconLabel}>{c.name}</span>
            </div>
          ))
        )}
      </div>

      <div className={styles.variantBFooter}>
        <div className={styles.variantAActions}>
          <button className={styles.iconBtn}><MenuIcon /></button>
          <YamlBtn />
          <Avatars size={20} />
        </div>
        <ConnectBtn disabled={card.status !== 'Ready'} />
      </div>
    </div>
  );
}

/* ─── VARIANT C: Pill Status (status inline, ultra-readable) ─── */
function VariantC({ card }: { card: CardData }) {
  const s = STATUS_CONFIG[card.status];
  return (
    <div className={styles.variantC}>
      <div className={styles.variantCHeader}>
        <div>
          <div className={styles.variantCName}>{card.name}</div>
          <div className={styles.variantAKind} style={{ marginTop: 2 }}>{card.kind}</div>
        </div>
        <div className={styles.variantCPill} style={{ background: `${s.dot}18`, color: s.color, border: `1px solid ${s.dot}40` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
          {s.label}
        </div>
      </div>

      <div className={styles.variantCBody}>
        {card.components.length === 0 ? (
          <span className={styles.variantAEmpty}>No components installed</span>
        ) : (
          card.components.map((c) => (
            <div key={c.name} className={styles.variantCIcon} title={c.name}>
              <img src={c.logo} alt={c.name} />
            </div>
          ))
        )}
      </div>

      <div className={styles.variantCFooter}>
        <div className={styles.variantAActions}>
          <button className={styles.iconBtn}><MenuIcon /></button>
          <YamlBtn />
          <Avatars size={20} />
        </div>
        <ConnectBtn disabled={card.status !== 'Ready'} />
      </div>
    </div>
  );
}

/* ─── VARIANT D: Two-zone (hard horizontal split) ─── */
function VariantD({ card }: { card: CardData }) {
  const s = STATUS_CONFIG[card.status];
  return (
    <div className={styles.variantD}>
      <div className={styles.variantDTop}>
        <div className={styles.variantDName}>{card.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
          <span className={styles.variantAKind} style={{ color: 'rgba(0,0,0,0.4)' }}>{card.kind}</span>
          <span style={{ color: 'rgba(0,0,0,0.2)' }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.color, fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
            {s.label}
          </span>
        </div>
      </div>

      <div className={styles.variantDBottom}>
        <div className={styles.variantDIcons}>
          {card.components.length === 0 ? (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>No components</span>
          ) : (
            card.components.map((c) => (
              <div key={c.name} className={styles.variantDIcon} title={c.name}>
                <img src={c.logo} alt={c.name} style={{ filter: 'brightness(0) invert(1)', opacity: 0.85 }} />
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className={styles.iconBtn} style={{ color: 'rgba(255,255,255,0.6)' }}><MenuIcon /></button>
          <div style={{ color: 'rgba(255,255,255,0.6)' }}><YamlBtn /></div>
          <Avatars size={20} />
          <ConnectBtn disabled={card.status !== 'Ready'} />
        </div>
      </div>
    </div>
  );
}

const VARIANTS = [
  { id: 'A', label: 'A — Status Bar', desc: 'Left accent drives health. Terminal-clean.', Component: VariantA },
  { id: 'B', label: 'B — Capability First', desc: 'Components are the hero. Labeled icons.', Component: VariantB },
  { id: 'C', label: 'C — Pill Status', desc: 'Status inline. No popover mystery.', Component: VariantC },
  { id: 'D', label: 'D — Two-zone', desc: 'Hard split: identity top, actions bottom.', Component: VariantD },
];

export default function CardDesignPreview() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Control Plane Card — Design Variants</div>
        <div className={styles.pageSubtitle}>Four directions · four states each (Ready, Progressing, Not Ready, Deleting)</div>
      </div>

      {VARIANTS.map(({ id, label, desc, Component }) => (
        <section key={id} className={styles.section}>
          <div className={styles.sectionLabel}>
            <span className={styles.variantTag}>{id}</span>
            <div>
              <div className={styles.sectionTitle}>{label}</div>
              <div className={styles.sectionDesc}>{desc}</div>
            </div>
          </div>
          <div className={styles.grid}>
            {CARDS.map((card) => (
              <Component key={card.name} card={card} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
