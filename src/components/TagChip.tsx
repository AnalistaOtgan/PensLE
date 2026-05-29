import { tagColor } from '../services/tagColor';
import type { CSSProperties } from 'react';

interface TagChipProps {
  tag: string;
  active?: boolean;
  onClick?: () => void;
}

export function TagChip({ tag, active = false, onClick }: TagChipProps) {
  const style = {
    '--tag-color': tagColor(tag)
  } as CSSProperties;

  if (onClick) {
    return (
      <button className={`tag-chip ${active ? 'active' : ''}`} style={style} onClick={onClick}>
        {tag}
      </button>
    );
  }

  return (
    <span className={`tag-chip ${active ? 'active' : ''}`} style={style}>
      {tag}
    </span>
  );
}
