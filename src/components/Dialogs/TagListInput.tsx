import { MultiInput, MultiInputDomRef, Token, Ui5CustomEvent } from '@ui5/webcomponents-react';
import type { MultiInputTokenDeleteEventDetail } from '@ui5/webcomponents/dist/MultiInput.js';

/**
 * A UI5 MultiInput wrapper that stores its value as a single
 * comma-separated string — matching how the value is persisted as a
 * Kubernetes annotation on the server. The user sees tag chips; the wire
 * shape stays a `"a, b, c"` string so we don't need to migrate every
 * caller (yaml preview, hooks, extractSupportInfo).
 */
export interface TagListInputProps {
  /** Comma-separated value; empty string means no tags. */
  value: string;
  /** Emits the next comma-separated string. */
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  /** Passed straight to the underlying MultiInput for cypress selectors. */
  'data-testid'?: string;
}

const splitTags = (value: string): string[] =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const joinTags = (tags: string[]): string => tags.join(', ');

export function TagListInput({ value, onChange, placeholder, className, ...rest }: TagListInputProps) {
  const tags = splitTags(value);

  const handleAdd = (event: Ui5CustomEvent<MultiInputDomRef>) => {
    const target = event.target as MultiInputDomRef & { value: string };
    const raw = target.value ?? '';
    // Support paste of "a, b" splitting on commas on the way in as well.
    const additions = splitTags(raw);
    if (additions.length === 0) {
      return;
    }
    const merged = [...tags];
    for (const addition of additions) {
      if (!merged.includes(addition)) {
        merged.push(addition);
      }
    }
    onChange(joinTags(merged));
    // MultiInput does not clear its editable input on Enter by default.
    target.value = '';
  };

  const handleDelete = (event: Ui5CustomEvent<MultiInputDomRef, MultiInputTokenDeleteEventDetail>) => {
    const removed = new Set((event.detail.tokens ?? []).map((token) => token.text ?? ''));
    onChange(joinTags(tags.filter((tag) => !removed.has(tag))));
  };

  return (
    <MultiInput
      className={className}
      data-testid={rest['data-testid']}
      placeholder={placeholder}
      tokens={
        <>
          {tags.map((tag) => (
            <Token key={tag} text={tag} />
          ))}
        </>
      }
      onChange={handleAdd}
      onTokenDelete={handleDelete}
    />
  );
}
