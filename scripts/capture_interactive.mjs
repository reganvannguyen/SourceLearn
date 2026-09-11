import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ASSETS_DIR = "/home/regan-nguyen/Desktop/projects/SourceLearn/docs/assets";
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting interactive 16:9 capture (1280x720)...");

  const chromeProc = spawn("google-chrome", [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--remote-debugging-port=9226",
    "--window-size=1280,720",
    "http://localhost:3000"
  ]);

  await delay(2500);

  try {
    const listRes = await fetch("http://127.0.0.1:9226/json");
    const targets = await listRes.json();
    const target = targets.find((t) => t.type === "page") || targets[0];
    if (!target) throw new Error("No Chrome page target found");

    console.log("Connected to target:", target.title, target.url);
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let idCounter = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const { resolve, reject } = callbacks.get(data.id);
        callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = idCounter++;
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send("Page.enable");
    await send("Runtime.enable");

    // Force exact 16:9 widescreen device metrics (1280x720)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 720,
      deviceScaleFactor: 1,
      mobile: false
    });

    async function capture(filename) {
      const res = await send("Page.captureScreenshot", {
        format: "png",
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          scale: 1
        }
      });
      const buffer = Buffer.from(res.data, "base64");
      fs.writeFileSync(path.join(ASSETS_DIR, filename), buffer);
      console.log(`Saved 16:9 screenshot: ${filename}`);
    }

    async function evaluate(expression) {
      return await send("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
    }

    // 1. Dashboard Overview
    await evaluate("window.location.href = 'http://localhost:3000'");
    await delay(2000);
    await capture("step1_dashboard.png");

    // 2. Open Create Notebook Modal & Type Title
    await evaluate(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('+ New Notebook'));
      if (btn) btn.click();
    `);
    await delay(800);

    // Set input value using native setter for React
    await evaluate(`
      const input = document.querySelector('.create-modal__input, input[type="text"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, "Distributed Systems");
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await delay(800);
    await capture("step2_create_modal.png");

    // Close modal
    await evaluate(`
      const closeBtn = document.querySelector('.create-modal__cancel-btn, button.btn--secondary');
      if (closeBtn) closeBtn.click();
    `);
    await delay(600);

    // 3. Open Operating System notebook (/notebooks/1)
    await evaluate("window.location.href = 'http://localhost:3000/notebooks/1'");
    await delay(2500);
    await capture("step3_os_notebook.png");

    // 4. Type realistic question in the chat input bar (.chat-input__field)
    const questionText = "What is a kernel, and how do monolithic and microkernel architectures differ?";
    await evaluate(`
      const input = document.querySelector('.chat-input__field, input[type="text"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, ${JSON.stringify(questionText)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
      }
    `);
    await delay(1000);
    await capture("step4_ask_question.png");

    // Clear input to show clean state for grounded answer frame
    await evaluate(`
      const input = document.querySelector('.chat-input__field, input[type="text"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        setter.call(input, "");
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await delay(500);

    // 5. Scroll down to show grounded Q&A with citation pills
    await evaluate(`
      const scroller = document.querySelector('.study-chat-scroll');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    `);
    await delay(800);
    await capture("step5_grounded_answer.png");

    // 6. Click citation pill or first source document to open Split-Screen PDF Viewer
    await evaluate(`
      const pill = document.querySelector('.chat-inline-citation');
      if (pill) {
        pill.click();
      } else {
        const docItem = document.querySelector('.study-sidebar__doc-item');
        if (docItem) docItem.click();
      }
    `);
    await delay(3000); // Wait for canvas PDF page rendering
    await capture("step6_split_screen.png");

    ws.close();
    console.log("All interactive 16:9 frames captured successfully!");
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error("Error during capture:", err);
  process.exit(1);
});
