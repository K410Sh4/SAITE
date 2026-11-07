import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = [
  ['index.html', 'home'],
  ['sobre.html', 'sobre'],
  ['orcamento.html', 'orcamento'],
  ['orcamento-recebido.html', 'orcamento'],
  ['contato.html', 'contato'],
  ['pedidos.html', 'contato'],
];
const cssPath = path.join(root, 'saite.css');
assert.ok(existsSync(cssPath), 'A folha central saite.css deve existir');
const css = readFileSync(cssPath, 'utf8');
for (const page of new Set(pages.map(([, p]) => p))) {
  assert.ok(css.includes('body.saite-' + page), 'Faltam regras da página ' + page);
}
for (const [filename, page] of pages) {
  const html = readFileSync(path.join(root, filename), 'utf8');
  const links = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']\.\/([^"']+)["']/g)]
    .map(m => m[1]);
  assert.deepEqual(links, ['saite.css?v=20261107-css'], filename + ': CSS público deve usar somente saite.css');
  assert.ok(html.includes('class="saite-' + page + '"') || html.includes('class="saite-' + page + ' '), filename + ': classe da página ausente');
  assert.doesNotMatch(html, /\bstyle=["']|<style\b/i, filename + ': CSS inline não é permitido');
}
for (const old of ['home.css', 'sobre.css', 'orcamento.css', 'contato.css', 'styles.css']) {
  assert.equal(existsSync(path.join(root, old)), false, old + ': CSS antigo deve ser removido');
}
assert.ok(existsSync(path.join(root, 'inbox-worker/public/admin.css')),
  'O CSS administrativo deve permanecer no Worker, sem compartilhar a origem pública');
console.log('SAITE CSS: 6 páginas públicas validadas; 1 folha central; painel administrativo isolado.');
