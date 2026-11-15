import { ESLint } from 'eslint';

test('flat lint config parses JSX and rejects undefined application variables', async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(
    'export default function Probe() { return <button type="button">{missingName}</button>; }',
    { filePath: 'src/Probe.jsx' },
  );
  expect(result.messages.map(({ ruleId }) => ruleId)).toContain('no-undef');
  expect(result.messages.every(({ fatal }) => !fatal)).toBe(true);
});
