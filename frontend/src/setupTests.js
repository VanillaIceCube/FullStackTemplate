import '@testing-library/jest-dom';

// Node 25 exposes an experimental global localStorage that has no usable
// backing file in Vitest. Use a deterministic browser-compatible store.
const localValues = new Map();
const testLocalStorage = {
  get length() {
    return localValues.size;
  },
  clear() {
    localValues.clear();
  },
  getItem(key) {
    return localValues.has(String(key)) ? localValues.get(String(key)) : null;
  },
  key(index) {
    return [...localValues.keys()][index] ?? null;
  },
  removeItem(key) {
    localValues.delete(String(key));
  },
  setItem(key, value) {
    localValues.set(String(key), String(value));
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
});
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: testLocalStorage,
});

vi.mock('@mui/material', async () => {
  const React = await import('react');
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Menu: ({ open, children }) =>
      open ? React.createElement('div', { 'data-testid': 'menu' }, children) : null,
    TextField: ({ inputRef, InputProps, inputProps, ...props }) =>
      React.createElement(actual.TextField, {
        ...props,
        autoFocus: false,
        inputRef,
        InputProps,
        inputProps,
      }),
  };
});
