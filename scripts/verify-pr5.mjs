import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
const exec = promisify(execFile);
const serverFile = new URL("../dist/server.js", import.meta.url);
const report = ["# ПР5: результати перевірки", "", "Звіт отримано скриптом `node scripts/verify-pr5.mjs` після `npm run build`. Усі запити виконано на порту 3000. Перед ручною перевіркою запустіть npm run dev в окремому терміналі. Перед автоматичною перевіркою зупиніть свій сервер: скрипт сам послідовно запускає два тестові процеси на порту 3000 і завершує їх.", ""];
async function start(port, max) {
  const child = spawn(process.execPath, [serverFile.pathname.replace(/^\/([A-Za-z]:)/, "$1")], {
    env: { ...process.env, PORT: String(port), MAX_EVENTS: String(max), NODE_ENV: "test", LOG_LEVEL: "error" },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true
  });
  let startupError = "";
  child.stderr.on("data", (data) => { startupError += data.toString(); });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server startup timeout")), 10000);
      child.once("error", (error) => { clearTimeout(timer); reject(error); });
      child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Server exited: ${code}. ${startupError.trim()}`)); });
      child.stdout.on("data", (data) => {
        if (data.toString().includes("CampusHub API running")) { clearTimeout(timer); resolve(); }
      });
    });
    return child;
  } catch (error) { child.kill(); throw error; }
}
async function stop(child) {
  if (child.exitCode !== null) return;
  await new Promise((resolve) => { child.once("exit", resolve); child.kill(); });
}
async function check(name, method, path, expected, body, port = 3000) {
  const args = ["-sS", "-i", "--max-time", "10", "-X", method, `http://localhost:${port}${path}`];
  if (body !== undefined) args.push("-H", "Content-Type: application/json", "--data-raw", typeof body === "string" ? body : JSON.stringify(body));
  const { stdout } = await exec("curl.exe", args, { windowsHide: true });
  const split = stdout.search(/\r?\n\r?\n/);
  const headers = stdout.slice(0, split);
  const raw = stdout.slice(split).trim();
  const status = Number(headers.match(/^HTTP\/\S+ (\d+)/)[1]);
  const requestId = headers.match(/^X-Request-Id:\s*(.+)$/im)?.[1].trim();
  const contentType = headers.match(/^Content-Type:\s*(.+)$/im)?.[1].trim();
  assert.equal(status, expected, name);
  assert.match(requestId, /^[0-9a-f-]{36}$/i);
  const response = raw ? JSON.parse(raw) : null;
  if (expected < 400 && expected !== 204) assert.match(contentType, /^application\/json/);
  if (expected === 204) { assert.equal(raw, ""); assert.equal(contentType, undefined); }
  if (expected >= 400) {
    assert.match(headers, /Content-Type: application\/problem\+json/i);
    assert.equal(response.status, expected);
    assert.equal(response.requestId, requestId);
    assert.ok(response.code && response.type && response.title && response.detail && response.instance);
    assert.equal(response.stack, undefined);
    if (expected === 500) assert.ok(!raw.includes("Test error"));
  }
  const request = `curl.exe -i -X ${method} "http://localhost:${port}${path}"`;
  // Pass JSON through stdin so these commands also work in Windows PowerShell 5.1.
  const cmd = body === undefined ? request :
    `'${(typeof body === "string" ? body : JSON.stringify(body)).replaceAll("'", "''")}' | ${request} -H "Content-Type: application/json" --data-binary '@-'`;
  report.push(`## ${name}`, "", "```powershell", cmd, "```", "", `HTTP status: **${status}**; X-Request-Id: \`${requestId}\`; Content-Type: \`${contentType ?? "(absent)"}\`.`, "", "```json", response ? JSON.stringify(response, null, 2) : "(empty body)", "```", "");
  return response;
}
const server = await start(3000, 100);
try {
  const body = { title: "Node.js Workshop", date: "2026-11-15", isOnline: true };
  const created = await check("1. Правильне створення", "POST", "/api/events", 201, body);
  await check("2. Закоротка назва", "POST", "/api/events", 400, { ...body, title: "JS" });
  await check("3. Неправильна дата", "POST", "/api/events", 400, { ...body, date: "15.11.2026" });
  await check("4. Невідоме поле", "POST", "/api/events", 400, { ...body, price: 500 });
  await check("5. Неправильний тип", "POST", "/api/events", 400, { ...body, isOnline: "yes" });
  await check("6. Порожній PATCH", "PATCH", "/api/events/1", 400, {});
  await check("7. Неправильний id", "GET", "/api/events/abc", 400);
  await check("8. Події немає", "GET", "/api/events/9999", 404);
  await check("9. Дубль події", "POST", "/api/events", 409, body);
  await check("10. Невідомий маршрут", "GET", "/api/unknown", 404);
  await check("11. Внутрішня помилка", "GET", "/api/events/error/test", 500);
  await check("12. Пошкоджений JSON", "POST", "/api/events", 400, '{"title":');
  await check("13. Query-фільтр", "GET", "/api/events?title=Node.js", 200);
  await check("14. Невідомий query", "GET", "/api/events?price=100", 400);
  await check("15. PATCH зберігає isOnline", "PATCH", "/api/events/" + created.id, 200, { title: "Updated workshop" });
  await check("16. Видалення", "DELETE", "/api/events/" + created.id, 204);
} finally { await stop(server); }
report.push("## Підготовка перевірки ліміту", "", "Для ручного виконання наступного запиту зупиніть сервер (Ctrl+C), встановіть MAX_EVENTS=1 у .env та запустіть npm run dev. Початкова подія вже займає єдине доступне місце. Після перевірки поверніть MAX_EVENTS=100 і перезапустіть сервер.", "");
const limited = await start(3000, 1);
try {
  await check("17. Ліміт подій MAX_EVENTS=1", "POST", "/api/events", 409, { title: "Limit workshop", date: "2026-11-15" }, 3000);
} finally { await stop(limited); }
report.push("## Перевірка конфігурації", "");
for (const overrides of [{ PORT: "hello" }, { PORT: "99999" }, { NODE_ENV: "local" }, { MAX_EVENTS: "0" }]) {
  let failed = false;
  try {
    await exec(process.execPath, ["--input-type=module", "-e", "import './src/config/env.js'"], {
      env: { ...process.env, PORT: "3000", NODE_ENV: "test", MAX_EVENTS: "100", ...overrides },
      windowsHide: true, timeout: 10000
    });
  } catch (error) {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Invalid environment configuration/);
    report.push(`- \`${JSON.stringify(overrides)}\`: exit code 1; Invalid environment configuration.`);
    failed = true;
  }
  assert.ok(failed, "Invalid configuration must stop startup");
}
console.log(report.join("\n"));
