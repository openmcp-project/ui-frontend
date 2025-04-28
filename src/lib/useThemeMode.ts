export const useThemeMode = (): {
  isDarkMode: boolean;
  mode: 'dark' | 'light';
} => {
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return { isDarkMode: isDarkMode, mode: isDarkMode ? 'dark' : 'light' };
};
