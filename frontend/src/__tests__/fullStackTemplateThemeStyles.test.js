import fs from 'node:fs';
import path from 'node:path';
const sourceDirectory = path.resolve('src');

describe('FullStackTemplate theme styles', () => {
  const globalCss = fs.readFileSync(path.join(sourceDirectory, 'index.css'), 'utf8');
  const readSource = (relativePath) =>
    fs.readFileSync(path.join(sourceDirectory, relativePath), 'utf8');

  test('keeps the exact Notoli yellow and gray theme tokens', () => {
    expect(globalCss).toContain('--background-color: #1a1a1a');
    expect(globalCss).toContain('--secondary-background-color: #f5e79e');
    expect(globalCss).toContain('--secondary-color: #555555');
    expect(globalCss).toContain('--text-color: #ffffff');
  });

  test('keeps MUI text field focus states gray instead of default blue', () => {
    expect(globalCss).toContain('.MuiInputLabel-root.Mui-focused');
    expect(globalCss).toContain(
      '.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline',
    );
    expect(globalCss).toContain('color: var(--secondary-color) !important');
    expect(globalCss).toContain('border-color: var(--secondary-color) !important');
    expect(globalCss).toContain('border-bottom-color: var(--secondary-color) !important');
  });

  test.each([
    'components/AppHeader.jsx',
    'components/AppNavigationDrawer.jsx',
    'components/AuthPageShell.jsx',
    'pages/HomePage.jsx',
  ])('%s uses the shared yellow and gray surfaces', (relativePath) => {
    const source = readSource(relativePath);

    expect(source).toContain('var(--secondary-background-color)');
    expect(source).toContain('var(--secondary-color)');
  });

  test.each([
    'pages/authentication/ForgotPassword.jsx',
    'pages/authentication/Login.jsx',
    'pages/authentication/Register.jsx',
    'pages/authentication/ResetPassword.jsx',
  ])('%s keeps actions and links on the shared gray treatment', (relativePath) => {
    expect(readSource(relativePath)).toContain('var(--secondary-color)');
  });

  test('keeps the drawer navigation surface free of a selected-row overlay', () => {
    const drawerSource = readSource('components/AppNavigationDrawer.jsx');

    expect(drawerSource).not.toContain('selected');
    expect(drawerSource).not.toContain('rgba(85, 85, 85');
  });
});
