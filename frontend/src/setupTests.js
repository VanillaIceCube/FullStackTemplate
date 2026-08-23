import '@testing-library/jest-dom';

const { TextDecoder, TextEncoder } = require('util');

global.TextDecoder = global.TextDecoder || TextDecoder;
global.TextEncoder = global.TextEncoder || TextEncoder;

jest.mock('@mui/material', () => {
  const React = require('react');
  const actual = jest.requireActual('@mui/material');
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
