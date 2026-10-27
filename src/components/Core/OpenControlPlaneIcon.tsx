import { useFrontendConfig } from '../../context/FrontendConfigContext';

function hexToRgb(hex: string): [number, number, number] | null {
  const short = /^#([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (short) {
    return [
      parseInt(short[1] + short[1], 16),
      parseInt(short[2] + short[2], 16),
      parseInt(short[3] + short[3], 16),
    ];
  }
  const full = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!full) return null;
  return [parseInt(full[1], 16), parseInt(full[2], 16), parseInt(full[3], 16)];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const r1 = r / 255,
    g1 = g / 255,
    b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r1) h = ((g1 - b1) / d + (g1 < b1 ? 6 : 0)) / 6;
  else if (max === g1) h = ((b1 - r1) / d + 2) / 6;
  else h = ((r1 - g1) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number): number => {
    const t1 = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    if (t1 < 1 / 6) return p + (q - p) * 6 * t1;
    if (t1 < 1 / 2) return q;
    if (t1 < 2 / 3) return p + (q - p) * (2 / 3 - t1) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${v}${v}${v}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const h1 = h / 360;
  const r = Math.round(hue2rgb(p, q, h1 + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, h1) * 255);
  const bl = Math.round(hue2rgb(p, q, h1 - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

interface DerivedColors {
  light: string;
  dark: string;
  muted: string;
}

function deriveColors(primaryColor: string): DerivedColors | null {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) return null;
  const [h, s, l] = rgbToHsl(...rgb);
  return {
    light: hslToHex(h, Math.min(s * 0.9, 0.9), Math.min(l + 0.2, 0.75)),
    dark: hslToHex(h, s, Math.max(l - 0.2, 0.1)),
    muted: hslToHex(h, Math.max(s * 0.5, 0.1), Math.max(l - 0.05, 0.2)),
  };
}

interface OpenControlPlaneIconProps {
  alt?: string;
  className?: string;
}

export function OpenControlPlaneIcon({ alt, className }: OpenControlPlaneIconProps) {
  const config = useFrontendConfig();
  const primaryColor = config.branding?.primaryColor ?? null;
  const colors = primaryColor ? deriveColors(primaryColor) : null;

  const light = colors?.light ?? '#53B7F9';
  const dark = colors?.dark ?? '#2142E4';
  const muted = colors?.muted ?? '#5279A3';

  return (
    <svg
      aria-label={alt}
      className={className}
      data-testid="app-icon"
      fill="none"
      height="816"
      role="img"
      viewBox="0 0 694 816"
      width="694"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="orchestrator">
        <path
          d="M234.723 226.775L85.6433 127.635C84.5933 126.935 83.2233 127.125 82.5933 128.045L31.5133 228.605C30.7033 229.795 31.5133 231.495 33.0833 231.855L210.113 266.285C211.013 266.495 211.913 266.174 212.363 265.475L235.503 229.625C236.093 228.715 235.753 227.445 234.733 226.775H234.723Z"
          fill="url(#paint0_linear_1_34)"
          opacity="0.27"
        />
        <path
          d="M173.713 169.015L116.543 129.045C129.583 110.395 150.963 99.2545 173.713 99.2545C211.983 99.2545 243.473 130.745 243.473 169.015C243.473 182.855 239.353 196.385 231.643 207.875L173.713 169.015Z"
          stroke="#221F20"
          strokeMiterlimit="10"
          strokeWidth="5.5"
        />
        <path d="M394.863 445.655L328.883 449.375L353.043 583.185L394.863 445.655Z" fill="white" />
        <path
          d="M333.763 431.105C333.763 431.105 261.463 409.874 261.043 361.124C260.963 351.714 232.893 345.874 232.893 345.874C232.893 345.874 234.423 291.224 238.463 275.464C245.763 246.964 269.543 199.275 337.253 199.275C400.013 199.275 420.893 243.624 425.023 269.934C430.563 305.254 431.893 363.855 411.203 412.275"
          stroke="#221F20"
          strokeLinecap="round"
          strokeMiterlimit="10"
          strokeWidth="5.5"
        />
        <path
          d="M537.873 169.015L595.043 129.045C582.003 110.395 560.623 99.2545 537.873 99.2545C499.603 99.2545 468.113 130.745 468.113 169.015C468.113 182.855 472.233 196.385 479.943 207.875L537.873 169.015Z"
          stroke="#221F20"
          strokeMiterlimit="10"
          strokeWidth="5.5"
        />
        <path
          d="M586.803 126.185C589.993 124.215 593.833 124.144 596.993 125.694C599.143 126.754 600.784 128.644 601.774 130.824L692.064 348.345C693.703 351.935 693.313 356.125 691.033 359.345L512.713 584.845C509.403 589.325 507.613 594.745 507.593 600.314L506.814 811.814C506.804 813.814 505.173 815.435 503.163 815.425L357.173 814.864C356.682 814.864 356.215 814.765 355.788 814.587C355.362 814.765 354.895 814.864 354.404 814.864L208.413 815.425C206.403 815.435 204.773 813.814 204.763 811.814L203.984 600.314C203.964 594.745 202.173 589.325 198.863 584.845L20.5432 359.345C18.2632 356.125 17.873 351.935 19.5129 348.345L109.803 130.824C110.793 128.644 112.433 126.754 114.583 125.694C117.743 124.144 121.584 124.215 124.774 126.185L231.593 198.954C235.893 201.614 237.013 207.395 234.003 211.465L171.354 304.404C168.634 308.094 168.953 313.204 172.113 316.524L254.333 434.364C255.893 436.594 258.203 438.165 260.843 438.805C272.553 441.655 301.823 443.535 318.413 444.295C325.073 444.605 330.684 449.354 332.104 455.864L355.788 564.64L379.473 455.864C380.893 449.354 386.503 444.605 393.163 444.295C409.753 443.535 439.024 441.655 450.734 438.805C453.373 438.165 455.683 436.594 457.243 434.364L539.463 316.524C542.623 313.204 542.943 308.094 540.223 304.404L477.573 211.465C474.563 207.395 475.684 201.614 479.984 198.954L586.803 126.185Z"
          fill="url(#paint1_linear_1_34)"
          id="uniform"
        />
        <g filter="url(#filter0_d_1_34)">
          <path
            d="M234.753 226.854L86.8632 128.514C85.1432 127.374 82.9032 127.674 81.8632 129.184L31.4732 228.724C30.6732 229.884 31.5432 231.504 33.0632 231.864L209.933 266.324C210.933 266.554 211.933 266.204 212.433 265.424L235.493 229.684C236.073 228.784 235.743 227.534 234.733 226.864L234.753 226.854Z"
            fill="#EAEFF4"
          />
        </g>
        <g filter="url(#filter1_d_1_34)">
          <path
            d="M476.823 226.854L624.713 128.514C626.433 127.374 628.673 127.674 629.713 129.184L680.103 228.724C680.903 229.884 680.033 231.504 678.513 231.864L501.643 266.324C500.643 266.554 499.643 266.204 499.143 265.424L476.083 229.684C475.503 228.784 475.833 227.534 476.843 226.864L476.823 226.854Z"
            fill="white"
          />
        </g>
        <path
          d="M476.853 226.775L625.933 127.635C626.983 126.935 628.353 127.125 628.983 128.045L680.063 228.605C680.873 229.795 680.063 231.495 678.493 231.855L501.463 266.285C500.563 266.495 499.663 266.174 499.213 265.475L476.073 229.625C475.483 228.715 475.823 227.445 476.843 226.775H476.853Z"
          fill="url(#paint2_linear_1_34)"
          opacity="0.27"
        />
        <path
          d="M400.803 13.6445C420.513 5.79451 433.893 0.464508 433.893 0.464508C433.893 0.464508 275.353 91.1445 255.383 102.575C253.113 103.665 250.923 104.725 250.923 104.725C240.023 109.985 228.353 108.395 224.873 101.165C221.393 93.9445 227.403 83.8245 238.313 78.5645C238.313 78.5645 239.413 78.0345 240.863 77.3345C246.263 75.1845 347.083 35.0345 400.813 13.6345L400.803 13.6445Z"
          fill="#221F20"
          stroke="#221F20"
          strokeMiterlimit="10"
        />
        <path
          d="M62.0332 225.275C67.2026 225.275 71.3932 221.084 71.3932 215.915C71.3932 210.745 67.2026 206.555 62.0332 206.555C56.8639 206.555 52.6732 210.745 52.6732 215.915C52.6732 221.084 56.8639 225.275 62.0332 225.275Z"
          fill={muted}
          id="button"
        />
        <path
          d="M646.183 225.275C651.353 225.275 655.543 221.084 655.543 215.915C655.543 210.745 651.353 206.555 646.183 206.555C641.014 206.555 636.823 210.745 636.823 215.915C636.823 221.084 641.014 225.275 646.183 225.275Z"
          fill={muted}
          id="button2"
        />
        <g filter="url(#filter2_d_1_34)">
          <path
            d="M355.853 656.754C363.79 656.754 370.223 650.321 370.223 642.384C370.223 634.448 363.79 628.014 355.853 628.014C347.917 628.014 341.483 634.448 341.483 642.384C341.483 650.321 347.917 656.754 355.853 656.754Z"
            fill="white"
          />
        </g>
        <path
          d="M355.853 656.754C363.79 656.754 370.223 650.321 370.223 642.384C370.223 634.448 363.79 628.014 355.853 628.014C347.917 628.014 341.483 634.448 341.483 642.384C341.483 650.321 347.917 656.754 355.853 656.754Z"
          fill="url(#paint3_linear_1_34)"
        />
        <g filter="url(#filter3_d_1_34)">
          <path
            d="M355.853 711.564C363.79 711.564 370.223 705.131 370.223 697.194C370.223 689.258 363.79 682.824 355.853 682.824C347.917 682.824 341.483 689.258 341.483 697.194C341.483 705.131 347.917 711.564 355.853 711.564Z"
            fill="white"
          />
        </g>
        <path
          d="M355.853 711.564C363.79 711.564 370.223 705.131 370.223 697.194C370.223 689.258 363.79 682.824 355.853 682.824C347.917 682.824 341.483 689.258 341.483 697.194C341.483 705.131 347.917 711.564 355.853 711.564Z"
          fill="url(#paint4_linear_1_34)"
        />
        <g filter="url(#filter4_d_1_34)">
          <path
            d="M341.473 753.975C341.473 746.035 347.903 739.605 355.843 739.605C363.783 739.605 370.213 746.035 370.213 753.975C370.213 761.915 363.783 768.345 355.843 768.345C347.903 768.345 341.473 761.915 341.473 753.975Z"
            fill="white"
          />
        </g>
        <path
          d="M341.473 753.975C341.473 746.035 347.903 739.605 355.843 739.605C363.783 739.605 370.213 746.035 370.213 753.975C370.213 761.915 363.783 768.345 355.843 768.345C347.903 768.345 341.473 761.915 341.473 753.975Z"
          fill="url(#paint5_linear_1_34)"
        />
        <g filter="url(#filter5_d_1_34)">
          <path
            d="M356.203 461.795L239.823 511.525C238.863 511.945 237.783 511.234 237.783 510.184V404.605C237.783 403.525 238.913 402.815 239.883 403.295L356.263 459.145C357.383 459.695 357.343 461.305 356.203 461.795Z"
            fill="white"
          />
        </g>
        <path
          d="M356.553 461.574L239.823 511.525C238.863 511.945 237.783 511.234 237.783 510.184V404.594C237.783 403.684 239.053 402.894 239.883 403.284L356.573 459.294C357.553 459.744 357.533 461.144 356.543 461.564L356.553 461.574Z"
          fill="url(#paint6_linear_1_34)"
          opacity="0.42"
        />
        <g filter="url(#filter6_d_1_34)">
          <path
            d="M355.493 461.795L471.873 511.525C472.833 511.945 473.913 511.234 473.913 510.184V404.605C473.913 403.525 472.783 402.815 471.813 403.295L355.433 459.145C354.313 459.695 354.353 461.305 355.493 461.795Z"
            fill="white"
          />
        </g>
        <path
          d="M355.143 461.555L471.873 511.505C472.833 511.925 473.913 511.215 473.913 510.165V404.575C473.913 403.665 472.643 402.875 471.813 403.265L355.123 459.275C354.143 459.725 354.163 461.125 355.153 461.545L355.143 461.555Z"
          fill="url(#paint7_linear_1_34)"
          opacity="0.42"
        />
        <path
          d="M355.853 474.675C364.005 474.675 370.613 468.066 370.613 459.915C370.613 451.763 364.005 445.155 355.853 445.155C347.702 445.155 341.093 451.763 341.093 459.915C341.093 468.066 347.702 474.675 355.853 474.675Z"
          fill="white"
        />
        <path
          d="M355.853 474.685C364.06 474.685 370.713 468.031 370.713 459.825C370.713 451.618 364.06 444.965 355.853 444.965C347.646 444.965 340.993 451.618 340.993 459.825C340.993 468.031 347.646 474.685 355.853 474.685Z"
          fill="url(#paint8_linear_1_34)"
        />
      </g>
      <defs>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="172.581"
          id="filter0_d_1_34"
          width="238.608"
          x="-1.71661e-05"
          y="127.823"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="172.581"
          id="filter1_d_1_34"
          width="238.608"
          x="444.628"
          y="127.823"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="62.75"
          id="filter2_d_1_34"
          width="62.74"
          x="310.313"
          y="628.014"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="62.75"
          id="filter3_d_1_34"
          width="62.74"
          x="310.313"
          y="682.824"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="62.7501"
          id="filter4_d_1_34"
          width="62.74"
          x="310.303"
          y="739.605"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="142.515"
          id="filter5_d_1_34"
          width="153.298"
          x="206.613"
          y="403.142"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <filter
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
          height="142.515"
          id="filter6_d_1_34"
          width="153.298"
          x="323.445"
          y="403.142"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dx="-14.17" dy="17.01" />
          <feGaussianBlur stdDeviation="8.5" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0" />
          <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_34" />
          <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_34" mode="normal" result="shape" />
        </filter>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint0_linear_1_34"
          x1="208.105"
          x2="77.854"
          y1="162.084"
          y2="249.863"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.12" stopColor="#C8D4E1" stopOpacity="0.32" />
          <stop offset="0.25" stopColor="#95ADC6" stopOpacity="0.61" />
          <stop offset="0.37" stopColor="#7090B3" stopOpacity="0.82" />
          <stop offset="0.46" stopColor="#5A7FA7" stopOpacity="0.95" />
          <stop offset="0.52" stopColor="#5279A3" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint1_linear_1_34"
          x1="735.688"
          x2="270.098"
          y1="729.27"
          y2="263.689"
        >
          <stop stopColor={light} />
          <stop offset="0.99" stopColor={dark} />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint2_linear_1_34"
          x1="482.787"
          x2="613.047"
          y1="168.653"
          y2="256.429"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.12" stopColor="#C8D4E1" stopOpacity="0.32" />
          <stop offset="0.25" stopColor="#95ADC6" stopOpacity="0.61" />
          <stop offset="0.37" stopColor="#7090B3" stopOpacity="0.82" />
          <stop offset="0.46" stopColor="#5A7FA7" stopOpacity="0.95" />
          <stop offset="0.52" stopColor="#5279A3" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint3_linear_1_34"
          x1="363.033"
          x2="348.663"
          y1="629.934"
          y2="654.834"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.08" stopColor="#E5EBF1" stopOpacity="0.12" />
          <stop offset="0.29" stopColor="#A6BACF" stopOpacity="0.41" />
          <stop offset="0.47" stopColor="#7896B7" stopOpacity="0.62" />
          <stop offset="0.63" stopColor="#5C80A8" stopOpacity="0.75" />
          <stop offset="0.73" stopColor="#5279A3" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint4_linear_1_34"
          x1="363.033"
          x2="348.663"
          y1="684.744"
          y2="709.645"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.08" stopColor="#E5EBF1" stopOpacity="0.12" />
          <stop offset="0.29" stopColor="#A6BACF" stopOpacity="0.41" />
          <stop offset="0.47" stopColor="#7896B7" stopOpacity="0.62" />
          <stop offset="0.63" stopColor="#5C80A8" stopOpacity="0.75" />
          <stop offset="0.73" stopColor="#5279A3" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint5_linear_1_34"
          x1="363.033"
          x2="348.663"
          y1="741.524"
          y2="766.425"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.08" stopColor="#E5EBF1" stopOpacity="0.12" />
          <stop offset="0.29" stopColor="#A6BACF" stopOpacity="0.41" />
          <stop offset="0.47" stopColor="#7896B7" stopOpacity="0.62" />
          <stop offset="0.63" stopColor="#5C80A8" stopOpacity="0.75" />
          <stop offset="0.73" stopColor="#5279A3" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint6_linear_1_34"
          x1="299.173"
          x2="253.803"
          y1="429.724"
          y2="508.314"
        >
          <stop stopColor="#FBFCFD" stopOpacity="0.02" />
          <stop offset="0.08" stopColor="#CED9E5" stopOpacity="0.28" />
          <stop offset="0.17" stopColor="#A8BBD0" stopOpacity="0.5" />
          <stop offset="0.25" stopColor="#88A3C0" stopOpacity="0.68" />
          <stop offset="0.35" stopColor="#7090B3" stopOpacity="0.82" />
          <stop offset="0.44" stopColor="#5F83AA" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="#557BA4" stopOpacity="0.98" />
          <stop offset="0.7" stopColor="#5279A3" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint7_linear_1_34"
          x1="462.743"
          x2="415.123"
          y1="401.165"
          y2="483.635"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.02" stopColor="#F5F7FA" stopOpacity="0.05" />
          <stop offset="0.16" stopColor="#C4D1DF" stopOpacity="0.34" />
          <stop offset="0.29" stopColor="#9BB1C9" stopOpacity="0.58" />
          <stop offset="0.42" stopColor="#7B98B8" stopOpacity="0.76" />
          <stop offset="0.55" stopColor="#6487AC" stopOpacity="0.89" />
          <stop offset="0.67" stopColor="#567CA5" stopOpacity="0.97" />
          <stop offset="0.79" stopColor="#5279A3" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="paint8_linear_1_34"
          x1="363.273"
          x2="348.423"
          y1="446.945"
          y2="472.684"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.08" stopColor="#E5EBF1" stopOpacity="0.12" />
          <stop offset="0.29" stopColor="#A6BACF" stopOpacity="0.41" />
          <stop offset="0.47" stopColor="#7896B7" stopOpacity="0.62" />
          <stop offset="0.63" stopColor="#5C80A8" stopOpacity="0.75" />
          <stop offset="0.73" stopColor="#5279A3" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
