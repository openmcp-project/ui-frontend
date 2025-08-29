interface FeatureToggleExistanceProps {
  shouldBeVisible: (searchParams?: URLSearchParams) => boolean;
  children?: React.ReactNode;
}

// A component that conditionally renders its children based on a flag in the URL search parameters.
// The flag and its handling logic must be set via the `shouldBeVisible` prop function.
export function SearchParamToggleVisibility({ shouldBeVisible, children }: FeatureToggleExistanceProps) {
  const searchParams = URL.parse(window.location.href)?.searchParams;

  return <>{shouldBeVisible(searchParams) && children}</>;
}
