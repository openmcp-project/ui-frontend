import { useThemeMode } from '../../lib/useThemeMode.ts';

export const YamlIcon = () => {
  const { isDarkMode } = useThemeMode();
  return (
    <img
      className="logo"
      src={isDarkMode ? '/yaml-icon-dark.svg' : '/yaml-icon-light.svg'}
      alt="Yaml icon"
      width={32}
      height={16}
    />
  );
};
