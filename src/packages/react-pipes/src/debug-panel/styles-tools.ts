export function css([part, ...parts]: TemplateStringsArray, ...args: any[]): string {
  return part + parts.map((part, index) => args[index] + part).join('');
}

export function round(value: number) {
  return Math.round(value * 100) / 100;
}
