export const deleteMessage = "delete_message";
export const voidMessage = "void";

export function wrapOn(rows: number, text?: string | string[]) {
  return (button: { text: string }, index: number) => {
    if (index % rows === 0) return true;
    if (!text) return false;
    if (Array.isArray(text)) return text.includes(button.text);
    return button.text === text;
  };
}

export function withSlots<T, R>(
  arr: T[],
  renderValue: (item: T, index: number) => R,
  renderFiller: R,
  rows = 3,
) {
  const remainder = arr.length % rows;
  const fillersNeeded = remainder === 0 ? 0 : rows - remainder;
  return arr
    .map(renderValue)
    .concat(new Array(fillersNeeded).fill(renderFiller));
}
