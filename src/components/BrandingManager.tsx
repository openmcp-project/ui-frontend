import { useEffect } from 'react';
import { useFrontendConfig } from '../context/FrontendConfigContext.tsx';

const STYLE_ID = 'branding-overrides';
const LINK_ID = 'branding-font';
const FAVICON_SELECTOR = 'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]';

export function BrandingManager() {
  const { branding } = useFrontendConfig();
  const { primaryColor, fontFamily, fontUrl, favicon } = branding;

  useEffect(() => {
    if (!favicon) return;
    const replaced = [...document.head.querySelectorAll<HTMLLinkElement>(FAVICON_SELECTOR)];
    replaced.forEach((el) => el.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = favicon;
    document.head.appendChild(link);
    return () => {
      link.remove();
      replaced.forEach((el) => document.head.appendChild(el));
    };
  }, [favicon]);

  useEffect(() => {
    if (!fontUrl) return;
    const link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
    return () => link.remove();
  }, [fontUrl]);

  useEffect(() => {
    const rules: string[] = [];

    if (primaryColor) {
      // Darker shades — mirrors SAP Horizon: brand #0070f2, hover/selected #0064d9, focus ring #0032a5
      const dark = `color-mix(in srgb, ${primaryColor} 87%, black)`;
      const focus = `color-mix(in srgb, ${primaryColor} 55%, black)`;

      rules.push(
        // Base brand tokens
        `--sapBrandColor: ${primaryColor} !important`,
        `--sapHighlightColor: ${dark} !important`,
        `--sapSelectedColor: ${dark} !important`,
        `--sapInformativeColor: ${primaryColor} !important`,
        `--sapInformativeElementColor: ${primaryColor} !important`,
        `--sapInformativeTextColor: ${dark} !important`,
        `--sapInformationColor: ${primaryColor} !important`,
        `--sapInformationBorderColor: ${primaryColor} !important`,

        // Links
        `--sapLinkColor: ${dark} !important`,
        `--sapLink_Color: ${primaryColor} !important`,
        `--sapLink_Hover_Color: ${dark} !important`,
        `--sapLink_Active_Color: ${dark} !important`,
        `--sapLink_Visited_Color: ${dark} !important`,

        // Emphasized buttons (primary / CTA)
        `--sapButton_Emphasized_Background: ${primaryColor} !important`,
        `--sapButton_Emphasized_BorderColor: ${primaryColor} !important`,
        `--sapButton_Emphasized_Hover_Background: ${dark} !important`,
        `--sapButton_Emphasized_Hover_BorderColor: ${dark} !important`,
        `--sapButton_Emphasized_Active_Background: ${dark} !important`,
        `--sapButton_Emphasized_Active_BorderColor: ${dark} !important`,

        // Standard / ghost / lite buttons
        `--sapButton_TextColor: ${dark} !important`,
        `--sapButton_Hover_TextColor: ${dark} !important`,
        `--sapButton_IconColor: ${dark} !important`,
        `--sapButton_Active_BorderColor: ${dark} !important`,
        `--sapButton_Active_TextColor: ${dark} !important`,
        `--sapButton_Lite_TextColor: ${dark} !important`,
        `--sapButton_Lite_Hover_TextColor: ${dark} !important`,
        `--sapButton_Lite_Active_BorderColor: ${dark} !important`,
        `--sapButton_Selected_BorderColor: ${dark} !important`,
        `--sapButton_Selected_TextColor: ${dark} !important`,
        `--sapButton_Track_Selected_Background: ${dark} !important`,
        `--sapButton_Track_Selected_BorderColor: ${dark} !important`,

        // Input fields — focus/hover border
        `--sapField_Hover_BorderColor: ${dark} !important`,
        `--sapField_Active_BorderColor: ${dark} !important`,
        `--sapField_InformationColor: ${primaryColor} !important`,

        // Lists / tables — selection indicator
        `--sapList_SelectionBorderColor: ${dark} !important`,

        // Tabs
        `--sapTab_ForegroundColor: ${dark} !important`,
        `--sapTab_IconColor: ${dark} !important`,
        `--sapTab_Selected_TextColor: ${dark} !important`,
        `--sapTab_Selected_Background: ${dark} !important`,

        // Content — selected state, busy/drag indicators
        `--sapContent_Selected_TextColor: ${dark} !important`,
        `--sapContent_Selected_ForegroundColor: ${dark} !important`,
        `--sapContent_BusyColor: ${dark} !important`,
        `--sapContent_DragAndDropActiveColor: ${dark} !important`,

        // Shell navigation
        `--sapShell_Active_TextColor: ${primaryColor} !important`,
        `--sapShell_Selected_TextColor: ${primaryColor} !important`,
        `--sapShell_SubBrand_TextColor: ${primaryColor} !important`,
        `--sapShell_Navigation_SelectedColor: ${dark} !important`,
        `--sapShell_Navigation_Selected_TextColor: ${dark} !important`,
        `--sapShell_Navigation_Active_TextColor: ${dark} !important`,
        `--sapShell_InformativeColor: ${dark} !important`,

        // Focus ring
        `--sapContent_FocusColor: ${focus} !important`,
        `--sapField_Focus_BorderColor: ${focus} !important`,
      );
    }

    if (fontFamily) {
      rules.push(`--sapFontFamily: ${fontFamily} !important`);
    }

    if (rules.length === 0) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `:root { ${rules.join('; ')} }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [primaryColor, fontFamily]);

  return null;
}
