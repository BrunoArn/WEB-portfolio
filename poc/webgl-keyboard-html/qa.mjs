import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const runtime = process.env.POC_PLAYWRIGHT_PATH || path.join(process.env.USERPROFILE || os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {chromium} = require(runtime);
const executablePath = process.env.POC_BROWSER || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const output = path.resolve(process.env.POC_QA_OUTPUT || path.join(os.tmpdir(), 'webgl-keyboard-html-qa'));
const origin = process.env.POC_HARNESS_ORIGIN || 'http://127.0.0.1:43180';
const report = {at: new Date().toISOString(), executablePath, origin, variants: []};
await mkdir(output, {recursive: true});
const browser = await chromium.launch({executablePath, headless: true});

async function active(page, frame) {
  return {
    parent: await page.evaluate(() => ({tag: document.activeElement?.tagName, id: document.activeElement?.id})),
    child: await frame.evaluate(() => ({tag: document.activeElement?.tagName, id: document.activeElement?.id})),
  };
}

try {
  report.browser = await browser.version();
  for (const variant of ['original', 'poc']) {
    const context = await browser.newContext({viewport: {width: 1280, height: 1000}});
    const page = await context.newPage();
    const row = {variant, checks: [], pageErrors: [], consoleErrors: [], warnings: [], httpErrors: [], engineStarts: 0, captures: []};
    report.variants.push(row);
    page.on('pageerror', error => row.pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') row.consoleErrors.push(message.text());
      if (message.type() === 'warning') row.warnings.push(message.text());
      if (message.text().includes('Initialize engine version')) row.engineStarts++;
    });
    page.on('response', response => {
      if (response.status() >= 400) row.httpErrors.push({url: response.url(), status: response.status()});
    });
    page.on('dialog', async dialog => { row.pageErrors.push('Dialog: ' + dialog.message()); await dialog.dismiss(); });
    page.setDefaultTimeout(12000);
    const toggle = page.locator('#toggle');
    let frame;
    async function check(name, run) {
      try { row.checks.push({name, status: 'PASS', details: await run()}); }
      catch (error) { row.checks.push({name, status: 'FAIL', error: error.message}); }
      await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
    }
    async function start() {
      await toggle.click();
      await page.locator('iframe').contentFrame().locator('canvas').waitFor();
      const gameSource = await page.locator('iframe').getAttribute('src');
      frame = page.frames().find(candidate => candidate.url() === gameSource);
      assert(frame, 'Missing game frame');
      await frame.waitForFunction(() => ['.data.br', '.wasm.br'].every(suffix => performance.getEntriesByType('resource').some(entry => entry.name.includes(suffix) && entry.responseEnd > 0)), {}, {timeout: 45000});
      // Resource completion is not the end of Unity's splash/scene transition.
      await page.waitForTimeout(5000);
      assert(row.engineStarts > 0, 'Unity engine not observed');
    }
    async function capture(name) {
      const filename = variant + '-' + name + '.png';
      const buffer = await frame.locator('canvas').screenshot();
      await writeFile(path.join(output, filename), buffer);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      row.captures.push({filename, sha256: hash});
      return hash;
    }
    try {
      await page.goto(origin + '/?variant=' + variant);
      await check('Unity fully initializes over cross-origin local HTTP', async () => {
        assert.equal(await page.locator('iframe').count(), 0);
        await start();
        const crossOrigin = await frame.evaluate(() => {
          try { return Boolean(window.parent.document); } catch (error) { return error.name; }
        });
        assert.equal(crossOrigin, 'SecurityError');
        const canvas = await frame.locator('canvas').evaluate(element => ({width: element.width, height: element.height, tabindex: element.tabIndex}));
        await capture('initial');
        return {crossOrigin, canvas, engineStarts: row.engineStarts};
      });
      await check('Forward and backward native keyboard entry/exit', async () => {
        await toggle.focus();
        const trail = [];
        for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
          await page.keyboard.press(key); trail.push({key, focus: await active(page, frame)});
        }
        if (variant === 'poc') {
          assert.equal(trail[0].focus.child.id, 'unity-canvas');
          assert.equal(trail[1].focus.parent.id, 'after');
          assert.equal(trail[2].focus.child.id, 'unity-canvas');
          assert.equal(trail[3].focus.parent.id, 'toggle');
        } else assert(trail.every(item => item.focus.parent.tag === 'IFRAME'), 'Original no longer reproduces retention');
        return trail;
      });
      await check('Mouse entry followed by Tab and Shift+Tab', async () => {
        const trail = [];
        for (const key of ['Tab', 'Shift+Tab']) {
          await frame.locator('canvas').click(); await page.keyboard.press(key);
          const focus = await active(page, frame); trail.push({key, focus});
          assert.equal(focus.parent.id, variant === 'poc' ? key === 'Tab' ? 'after' : 'toggle' : '');
        }
        return trail;
      });
      if (variant === 'poc') await check('Ten repeated forward/backward exits retain the same live frame', async () => {
        const initial = frame;
        for (let i = 0; i < 10; i++) {
          await toggle.focus(); await page.keyboard.press('Tab');
          assert.equal((await active(page, frame)).child.id, 'unity-canvas');
          await page.keyboard.press('Tab'); assert.equal((await active(page, frame)).parent.id, 'after');
          await page.keyboard.press('Shift+Tab'); assert.equal((await active(page, frame)).child.id, 'unity-canvas');
          await page.keyboard.press('Shift+Tab'); assert.equal((await active(page, frame)).parent.id, 'toggle');
        }
        assert.equal(initial.isDetached(), false); assert.equal(row.engineStarts, 1);
        return {cycles: 10, engineStarts: row.engineStarts};
      });
      await check('Focus departure while a movement key is held (fresh tutorial)', async () => {
        await frame.locator('canvas').click();
        await page.keyboard.down('KeyW'); await page.waitForTimeout(200);
        if (variant === 'poc') await page.keyboard.press('Tab');
        else await page.locator('#after').click();
        assert.equal((await active(page, frame)).parent.id, 'after');
        await page.keyboard.up('KeyW');
        if (variant === 'poc') await page.keyboard.press('Shift+Tab');
        else await frame.locator('canvas').click();
        await page.waitForTimeout(150); await capture('return-idle-a');
        await page.waitForTimeout(500); await capture('return-idle-b');
        // Diagnostic reset, not a POC behavior change: compare stationary state after W is pressed/released inside the game.
        await page.keyboard.press('KeyW');
        await page.waitForTimeout(150); await capture('reset-idle-a');
        await page.waitForTimeout(500); await capture('reset-idle-b');
        return {sameFrameAlive: !frame.isDetached(), note: 'Compare original mouse focus departure with POC keyboard departure. Inspect player position; screenshots are not an automatic input-state assertion.'};
      });
      await check('Gameplay and ESC observation captures (visual review still required)', async () => {
        await frame.locator('canvas').click();
        const captures = [];
        for (const [key, duration] of [['KeyW', 500], ['KeyD', 400], ['KeyA', 250], ['KeyS', 250], ['ArrowRight', 600]]) {
          await page.keyboard.down(key); await page.waitForTimeout(duration);
          if (key === 'ArrowRight') await capture('during-ArrowRight');
          await page.keyboard.up(key); await page.waitForTimeout(120);
          captures.push({key, hash: await capture('after-' + key)});
        }
        await page.keyboard.press('Escape'); await capture('after-Escape');
        assert.equal(await page.locator('iframe').count(), 1, 'ESC removed game unexpectedly');
        return {captures, sameFrameAlive: !frame.isDetached(), note: 'Hash differences alone are not proof of gameplay; inspect screenshots.'};
      });
      await check('Close and recreate iframe', async () => {
        const old = frame;
        await toggle.click(); assert.equal(await page.locator('iframe').count(), 0); assert(old.isDetached());
        await start(); assert.notEqual(frame, old);
        await toggle.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
        if (variant === 'poc') assert.equal((await active(page, frame)).parent.id, 'toggle');
        await toggle.click(); assert.equal(await page.locator('iframe').count(), 0);
        return {oldDetached: true, newFrameCreated: true, engineStarts: row.engineStarts};
      });
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({output, browser: report.browser, variants: report.variants.map(({captures, warnings, ...row}) => ({...row, captureCount: captures.length, warningCount: warnings.length}))}));
if (report.variants.some(row => row.checks.some(check => check.status === 'FAIL') || row.pageErrors.length || row.consoleErrors.length || row.httpErrors.length)) process.exitCode = 1;
