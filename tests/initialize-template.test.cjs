const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function sample(t) {
  const destination = fs.mkdtempSync(path.join(os.tmpdir(), 'template-initializer-'));
  assert.ok(fs.realpathSync(destination).startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
  t.after(() => fs.rmSync(destination, { recursive: true, force: true }));
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root,
    encoding: 'utf8',
  }).split('\0').filter(Boolean);
  for (const name of files) {
    const source = path.join(root, name);
    if (!fs.existsSync(source)) continue;
    const target = path.join(destination, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
  return destination;
}

function initialize(destination, extra = [], branding = {
  name: 'SampleAtlas', slug: 'sample-atlas', host: 'sample-atlas.example.net', owner: 'ExampleOwner',
}) {
  return execFileSync('pwsh', [
    '-NoProfile', '-File', path.join(destination, 'scripts/initialize-template.ps1'),
    '-ApplicationName', branding.name, '-ApplicationSlug', branding.slug,
    '-ProductionHost', branding.host, '-GitHubOwner', branding.owner,
    ...extra,
  ], { encoding: 'utf8' });
}

test('initializes Vite/flat ESLint files, runtime assets, package metadata and Docker API settings', (t) => {
  const destination = sample(t);
  initialize(destination);
  const read = (name) => fs.readFileSync(path.join(destination, name), 'utf8');
  assert.equal(JSON.parse(read('frontend/package.json')).name, 'sample-atlas-frontend');
  assert.match(read('frontend/vite.config.mjs'), /sample-atlas\.localhost/);
  assert.match(read('frontend/index.html'), /sample-atlas-mark\.svg/);
  assert.doesNotMatch(read('frontend/index.html'), /Full Stack Template/);
  assert.match(read('frontend/Dockerfile'), /ARG VITE_API_BASE_URL/);
  assert.match(read('frontend/Dockerfile'), /\/frontend\/dist/);
  assert.match(read('deploy/docker-compose.dev.yml'), /VITE_API_BASE_URL:/);
  const productionLine = read('AGENTS.md').split(/\r?\n/)
    .find((line) => line.startsWith('Production is designed for'));
  assert.equal(new URL(productionLine.split('`')[1]).origin, 'https://sample-atlas.example.net');
  assert.equal(fs.existsSync(path.join(destination, 'frontend/public/sample-atlas-mark.svg')), true);
  assert.equal(fs.existsSync(path.join(destination, 'frontend/src/__tests__/SampleAtlasThemeStyles.test.js')), true);
  assert.equal(JSON.parse(read('frontend/package.json')).dependencies['react-scripts'], undefined);
});

test('WhatIf leaves the template and Vite configuration unchanged', (t) => {
  const destination = sample(t);
  const filename = path.join(destination, 'frontend/vite.config.mjs');
  const before = fs.readFileSync(filename);
  initialize(destination, ['-WhatIf']);
  assert.deepEqual(fs.readFileSync(filename), before);
  assert.equal(fs.existsSync(path.join(destination, 'frontend/public/fullstacktemplate-mark.svg')), true);
});

test('initialization changes app policy while preserving canonical shared source bytes', (t) => {
  const destination = sample(t);
  const files = [
    'deploy/shared-source.json', 'deploy/check_parity.py',
    'deploy/production/release.py', 'deploy/production/build_bundle.py',
    ...fs.readdirSync(path.join(destination, 'deploy/tests'))
      .filter((name) => name.endsWith('.py')).map((name) => `deploy/tests/${name}`),
  ];
  const digest = (name) => createHash('sha256')
    .update(fs.readFileSync(path.join(destination, name))).digest('hex');
  const before = files.map(digest);
  initialize(destination);
  assert.deepEqual(files.map(digest), before);
  const config = JSON.parse(fs.readFileSync(path.join(destination, 'deploy/production/app.json')));
  assert.equal(config.app, 'sample-atlas');
  assert.equal(config.domain, 'sample-atlas.example.net');
  assert.equal(config.root_hint, '/opt/apps/sample-atlas');
  assert.deepEqual(config.containers, { backend: 'sample-atlas-backend', frontend: 'sample-atlas-frontend' });
  assert.equal(config.workflow.frontend_build_arg, 'VITE_API_BASE_URL');
  assert.equal(config.environment.required.includes('MACROMAPPER_OPENAI_API_KEY'), false);
  assert.equal(config.environment.fixed.DJANGO_MCP_BASE_URL, undefined);
  const pin = JSON.parse(fs.readFileSync(path.join(destination, 'deploy/shared-source.json')));
  assert.equal(pin.repository, 'VanillaIceCube/JudeAndrewAlabaInfrastructure');
  execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['deploy/check_parity.py'], {
    cwd: destination, stdio: 'pipe',
  });
});

test('retained initializer checks pass after branding a repository with a slug-prefixed host', (t) => {
  const destination = sample(t);
  initialize(destination, [], {
    name: 'ExampleApplication', slug: 'example-application',
    host: 'example-application.example.com', owner: 'ExampleOwner',
  });
  execFileSync('git', ['init', '-q'], { cwd: destination });
  execFileSync('git', ['add', '-A'], { cwd: destination, stdio: 'pipe' });
  // Run the retained smoke/WhatIf checks without recursively invoking this test.
  const childEnv = { ...process.env };
  delete childEnv.NODE_TEST_CONTEXT;
  const output = execFileSync(process.execPath, [
    '--test', '--test-name-pattern', '^(initializes Vite|WhatIf)',
    path.join(destination, 'tests/initialize-template.test.cjs'),
  ], { cwd: destination, env: childEnv, encoding: 'utf8', stdio: 'pipe' });
  assert.match(output, /pass 2\b/);
});

test('inserts overlapping application names and production hosts only once', (t) => {
  const destination = sample(t);
  const branding = {
    name: 'FullStackTemplatePlus', slug: 'fullstacktemplate-plus',
    host: 'fullstacktemplate.example.com', owner: 'ExampleOwner',
  };
  initialize(destination, [], branding);
  const read = (name) => fs.readFileSync(path.join(destination, name), 'utf8');
  const productionLine = read('AGENTS.md').split(/\r?\n/)
    .find((line) => line.startsWith('Production is designed for'));
  assert.equal(new URL(productionLine.split('`')[1]).origin, `https://${branding.host}`);
  assert.equal(JSON.parse(read('frontend/package.json')).name, `${branding.slug}-frontend`);
  assert.ok(read('frontend/index.html').includes(`<title>${branding.name}</title>`));
});
