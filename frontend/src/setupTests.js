import '@testing-library/jest-dom/vitest';
import { TextDecoder, TextEncoder } from 'node:util';

global.TextDecoder = global.TextDecoder || TextDecoder;
global.TextEncoder = global.TextEncoder || TextEncoder;

vi.mock('@mui/material', async () => {
  const React = await import('react');
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    TextField: ({ inputRef, ...props }) =>
      React.createElement(actual.TextField, { ...props, autoFocus: false, inputRef }),
  };
});
