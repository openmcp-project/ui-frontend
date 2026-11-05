/**
 * Triggers a browser download of `content` as `${filename}.yaml` via a temporary object URL.
 * Shared by the YAML side panel and the wizard's services preview so the download behaviour
 * (and cleanup of the object URL) stays in one place.
 */
export function downloadYamlFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/yaml' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.yaml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
