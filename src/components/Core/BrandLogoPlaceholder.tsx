import { useFrontendConfig } from '../../context/FrontendConfigContext.tsx';

export function BrandLogoPlaceholder() {
  const { branding } = useFrontendConfig();
  const initial = branding.appName.charAt(0).toUpperCase();

  return (
    <svg aria-label={branding.appName} height="32" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg">
      <rect fill="currentColor" height="32" opacity="0.15" rx="4" width="32" />
      <text
        dominantBaseline="middle"
        fill="currentColor"
        fontSize="18"
        fontWeight="bold"
        textAnchor="middle"
        x="16"
        y="17"
      >
        {initial}
      </text>
    </svg>
  );
}
