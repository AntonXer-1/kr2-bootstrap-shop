// Run: NODE_PATH=<directory containing playwright> node --test tests/site.test.cjs
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let server, browser, base;

before(async () => {
  server = http.createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      const data = await fs.readFile(file);
      const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': (mime[path.extname(file)] || 'text/plain') + '; charset=utf-8' }).end(data);
    } catch { res.writeHead(404).end('Not found'); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });

for (const file of ['index.html', 'catalog.html', 'catalog-page-2.html', 'product.html', 'order.html']) {
  test(`${file}: local dependencies, real links, responsive layout and sticky navigation`, async () => {
    const page = await browser.newPage();
    const errors = [], external = [], failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', req => { if (!req.url().startsWith(base)) external.push(req.url()); });
    page.on('response', res => { if (res.status() >= 400) failures.push(res.url()); });
    await page.goto(base + file);
    assert.equal(await page.locator('h1').count(), 1, 'page must contain its content');
    assert.equal(await page.locator('main').count(), 1);
    const paths = await page.locator('a[href],link[href],script[src],img[src]').evaluateAll(nodes => nodes.map(n => n.getAttribute('href') || n.getAttribute('src')));
    for (const href of paths) {
      const url = new URL(href, base + file);
      if (url.origin !== new URL(base).origin) continue;
      assert.equal((await page.request.get(url.href)).status(), 200, `broken asset/link: ${href}`);
    }
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 600 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
      await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
      assert.ok(Math.abs(await page.locator('.sticky-top').evaluate(el => el.getBoundingClientRect().top)) <= 1, 'menu leaves viewport');
      await page.evaluate(() => scrollTo(0, 0));
    }
    assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(failures, []);
    await page.close();
  });
}

test('pagination displays different products and returns to page one', async () => {
  const page = await browser.newPage(); await page.goto(base + 'catalog.html');
  assert.deepEqual(await page.locator('.card-title').allTextContents(), ['Клавиатура Quiet', 'Мышь Motion', 'Наушники Focus']);
  await page.getByRole('link', { name: 'Страница 2', exact: true }).click();
  assert.deepEqual(await page.locator('.card-title').allTextContents(), ['Веб-камера View', 'USB-концентратор Hub', 'Коврик Desk']);
  assert.equal(await page.locator('.pagination [aria-current="page"]').textContent(), '2');
  await page.getByRole('link', { name: 'Страница 1', exact: true }).click();
  assert.equal(await page.locator('.card-title').first().textContent(), 'Клавиатура Quiet');
  await page.close();
});

test('tabs switch content and support keyboard navigation', async () => {
  const page = await browser.newPage(); await page.goto(base + 'product.html');
  await page.getByRole('tab', { name: 'Характеристики' }).click();
  assert.equal(await page.locator('#specifications').isVisible(), true);
  assert.equal(await page.locator('#description').isVisible(), false);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.getByRole('tab', { name: 'Описание' }).getAttribute('aria-selected'), 'true');
  await page.close();
});

test('carousel changes the illustrated view without autoplay', async () => {
  const page = await browser.newPage(); await page.goto(base + 'product.html');
  const initial = await page.locator('.carousel-item.active img').getAttribute('src');
  await page.getByRole('button', { name: 'Следующее изображение' }).click();
  await page.waitForFunction(() => document.querySelector('.carousel-item.active img')?.getAttribute('src') === 'images/keyboard-side.svg');
  assert.notEqual(await page.locator('.carousel-item.active img').getAttribute('src'), initial);
  await page.close();
});

test('modal preserves chosen product, closes and restores focus', async () => {
  const page = await browser.newPage(); await page.goto(base + 'catalog-page-2.html');
  const trigger = page.getByRole('button', { name: 'Заказать Коврик Desk', exact: true });
  await trigger.click();
  await page.locator('#orderModal.show').waitFor();
  assert.equal(await page.locator('#selected-product').textContent(), 'Коврик Desk');
  // Класс show появляется до завершения анимации. Ждём готовности фокуса,
  // иначе Escape проверяет переходное состояние, а не открытый диалог.
  await page.waitForFunction(() => document.activeElement?.id === 'orderModal');
  await page.keyboard.press('Escape');
  await page.locator('#orderModal').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => !document.body.classList.contains('modal-open'));
  assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
  await trigger.click(); await page.locator('#orderModal.show').waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'orderModal');
  await page.locator('#order-link').click();
  assert.equal(await page.locator('[name=product]').inputValue(), 'Коврик Desk');
  await page.close();
});

test('form validates email and consent, shows demo result and never sends data', async () => {
  const page = await browser.newPage(); const sent = [];
  page.on('request', req => { if (req.method() !== 'GET') sent.push(req.url()); });
  await page.goto(base + 'order.html?product=UNKNOWN');
  assert.equal(await page.locator('[name=product]').inputValue(), '');
  await page.locator('[name=name]').fill('Антон');
  await page.locator('[name=email]').fill('wrong');
  await page.locator('[name=phone]').fill('9001234567');
  await page.locator('[name=product]').selectOption('Клавиатура Quiet');
  await page.getByRole('button', { name: 'Проверить заявку' }).click();
  assert.equal(await page.locator('[name=email]').evaluate(el => el.validity.typeMismatch), true);
  assert.equal(await page.locator('#form-result').isVisible(), false);
  await page.locator('[name=email]').fill('anton@example.com');
  await page.getByRole('button', { name: 'Проверить заявку' }).click();
  assert.equal(await page.locator('#form-result').isVisible(), false);
  await page.locator('[name=consent]').check();
  await page.getByRole('button', { name: 'Проверить заявку' }).click();
  assert.match(await page.locator('#form-result').textContent(), /не отправлены/);
  assert.deepEqual(sent, []);
  assert.equal(new URL(page.url()).searchParams.has('email'), false);
  await page.close();
});

test('mobile navbar opens links and catalog cards stack', async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 700 } });
  await page.goto(base + 'catalog.html');
  assert.equal(await page.locator('#shop-nav').isVisible(), false);
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await page.locator('#shop-nav.show').waitFor();
  assert.equal(await page.getByRole('link', { name: 'Каталог', exact: true }).isVisible(), true);
  const cards = await page.locator('.card').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().top));
  assert.ok(cards[1] > cards[0]);
  await page.close();
});

test('without JavaScript form submission stays disabled', async () => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto(base + 'order.html');
  assert.equal(await page.getByRole('button', { name: 'Проверить заявку' }).isDisabled(), true);
  assert.equal(await page.locator('noscript').isVisible(), true);
  await context.close();
});
