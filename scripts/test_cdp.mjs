import { spawn } from 'child_process';
import fs from 'fs';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProcess = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1400,1050',
    'http://127.0.0.1:4173/',
  ]);

  try {
    let versionData = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        const res = await fetch('http://127.0.0.1:9222/json/version');
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch {
        // waiting
      }
    }

    if (!versionData) {
      throw new Error('Chrome CDP port did not become ready');
    }

    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    const send = (method, params = {}) => {
      const reqId = id++;
      return new Promise((resolve, reject) => {
        pending.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    };

    await send('Page.enable');
    await send('DOM.enable');
    await send('Runtime.enable');

    await sleep(1500);

    // 1. Initial State screenshot
    const shot1 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync('screenshots/01-initial-state-en.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved screenshots/01-initial-state-en.png');

    // 2. Click "Load Sample Pack"
    console.log('Clicking Load Sample Pack...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('load-sample-btn').click()`,
    });

    await sleep(2500);

    const shot2 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync('screenshots/02-sample-loaded-with-duplicates.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved screenshots/02-sample-loaded-with-duplicates.png');

    // 3. Click "Generate Tender Package PDF"
    console.log('Clicking Generate Tender Package PDF...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('generate-package-btn').click()`,
    });

    await sleep(2500);

    // Capture full page showing generate and download buttons
    const shot3 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync('screenshots/03-package-ready-and-generated.png', Buffer.from(shot3.data, 'base64'));
    console.log('Saved screenshots/03-package-ready-and-generated.png');

    // 4. Switch to Bengali
    console.log('Switching language to Bangla...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('lang-toggle-btn').click()`,
    });

    await sleep(1200);

    const shot4 = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    fs.writeFileSync('screenshots/04-bangla-interface.png', Buffer.from(shot4.data, 'base64'));
    console.log('Saved screenshots/04-bangla-interface.png');

    ws.close();
  } finally {
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error('CDP script error:', err);
  process.exit(1);
});
