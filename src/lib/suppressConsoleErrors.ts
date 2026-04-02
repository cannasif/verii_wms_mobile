const SKIP_PATTERNS = [
  /key.*prop.*spread|spread.*key|key.*spread/i,
  /React keys must be passed directly/i,
  /SafeAreaView has been deprecated/i,
  /Path.*stroke|Circle.*stroke|d:.*stroke|fill:.*Path/i,
  /props object containing a .key. prop/i,
];

function shouldSuppress(args: unknown[]): boolean {
  const message = args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' ');
  return SKIP_PATTERNS.some((pattern) => pattern.test(message));
}

const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: unknown[]): void => {
  if (shouldSuppress(args)) return;
  originalError.apply(console, args);
};

console.warn = (...args: unknown[]): void => {
  if (shouldSuppress(args)) return;
  originalWarn.apply(console, args);
};
