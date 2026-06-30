import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const projectRoot = path.resolve("outputs/xiaojinli-static");
const pages = [
  "index.html",
  "discover.html",
  "copytrade.html",
  "toolbox.html",
  "profile.html",
  "ai_assistant.html",
  "portfolio.html",
  "stock_detail.html"
];

async function readPage(page) {
  return readFile(path.join(projectRoot, page), "utf8");
}

test("static clone exposes all expected pages", async () => {
  for (const page of pages) {
    const info = await stat(path.join(projectRoot, page));
    assert.equal(info.isFile(), true, `${page} should exist`);
  }
});

test("main navigation uses local page links", async () => {
  const navPages = ["discover.html", "copytrade.html", "toolbox.html", "profile.html"];
  for (const page of navPages) {
    const html = await readPage(page);
    for (const target of navPages) {
      assert.match(html, new RegExp(`href=["']${target}`), `${page} should link locally to ${target}`);
    }
    assert.doesNotMatch(html, /modao\.cc\/agent-py\/share\/6a41d02a75d0275ef68a14aa/, `${page} should not link back to the remote shared workspace`);
  }
});

test("basic interactions remain available after localization", async () => {
  const copytrade = await readPage("copytrade.html");
  assert.match(copytrade, /function switchTab\(type\)/);
  assert.match(copytrade, /function toggleFollow\(btn\)/);

  const toolbox = await readPage("toolbox.html");
  assert.match(toolbox, /function showResults\(\)/);

  const assistant = await readPage("ai_assistant.html");
  assert.match(assistant, /function sendMessage\(text\)/);
  assert.match(assistant, /function sendInput\(\)/);

  const portfolio = await readPage("portfolio.html");
  assert.match(portfolio, /function toggleDetail\(id\)/);
});

test("copytrade ranking uses success rate, max drawdown, and field descriptions", async () => {
  const copytrade = await readPage("copytrade.html");
  assert.match(copytrade, /成功率/);
  assert.match(copytrade, /最大回撤/);
  assert.match(copytrade, /字段说明/);
  assert.match(copytrade, /successRate:/);
  assert.match(copytrade, /maxDrawdown:/);
  assert.doesNotMatch(copytrade, /\byield:/);
});

test("copytrade page keeps useful comparison fields without decision-order copy", async () => {
  const copytrade = await readPage("copytrade.html");
  assert.match(copytrade, /候选名单/);
  assert.doesNotMatch(copytrade, /决策顺序/);
  assert.doesNotMatch(copytrade, /先判断能不能抄/);
  assert.doesNotMatch(copytrade, /先看成功率/);
  assert.doesNotMatch(copytrade, /再看最大回撤/);
  assert.doesNotMatch(copytrade, /最后看风格匹配/);
  assert.match(copytrade, /riskLevel:/);
  assert.match(copytrade, /fit:/);
});

test("portfolio page does not show holding period filter buttons", async () => {
  const portfolio = await readPage("portfolio.html");
  assert.doesNotMatch(portfolio, />短期<\/button>/);
  assert.doesNotMatch(portfolio, />中期<\/button>/);
  assert.doesNotMatch(portfolio, />长期<\/button>/);
});

test("copytrade sample data reads like realistic simulated market data", async () => {
  const copytrade = await readPage("copytrade.html");
  assert.match(copytrade, /模拟样本/);
  assert.match(copytrade, /不构成投资建议/);
  assert.match(copytrade, /睿远均衡/);
  assert.match(copytrade, /章盟主/);
  assert.match(copytrade, /景林资产/);
  assert.doesNotMatch(copytrade, /观察'/);
  assert.match(copytrade, /sampleSize:/);
  assert.match(copytrade, /disclosureLag:/);
});

test("shared runtime assets are local to the cloned project", async () => {
  const html = await readPage("stock_detail.html");
  assert.match(html, /assets\/vendor\/tailwindcss\.js/);
  assert.match(html, /assets\/vendor\/iconify-icon\.min\.js/);
  assert.match(html, /assets\/vendor\/echarts\.min\.js/);
  assert.doesNotMatch(html, /https:\/\/modao\.cc\/agent-py\/static\/source\/js/);
});
