export function tagColor(tag: string): string {
  let hash = 0;
  for (let index = 0; index < tag.length; index += 1) {
    hash = (hash * 31 + tag.charCodeAt(index)) % 360;
  }
  return `hsl(${hash}, 58%, 48%)`;
}
