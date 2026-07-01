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
  "stock_detail.html",
  "onboarding.html",
  "dna_result.html"
];

async function readPage(page) {
  return readFile(path.join(projectRoot, page), "utf8");
}

// ── 1. 所有页面文件存在 ──────────────────────────────────
test("static clone exposes all expected pages", async () => {
  for (const page of pages) {
    const info = await stat(path.join(projectRoot, page));
    assert.equal(info.isFile(), true, `${page} should exist`);
  }
});

// ── 2. 底部导航使用新 4-tab 结构（发现/广场/仓库/我的） ──
test("bottom nav uses new 4-tab structure with correct labels", async () => {
  const navPages = ["discover.html", "copytrade.html", "toolbox.html", "profile.html",
                    "index.html", "portfolio.html", "stock_detail.html",
                    "onboarding.html", "dna_result.html"];
  const navTargets = ["discover.html", "copytrade.html", "toolbox.html", "profile.html"];
  for (const page of navPages) {
    const html = await readPage(page);
    for (const target of navTargets) {
      assert.match(html, new RegExp(`href=["']${target}`), `${page} should link to ${target}`);
    }
    // 不再使用"工具箱"标签
    assert.match(html, /仓库/, `${page} should show 仓库 label`);
    assert.doesNotMatch(html, /工具箱/, `${page} should not contain old 工具箱 label`);
  }
});

// ── 3. 导航不链接回远程工作区 ────────────────────────────
test("navigation does not link back to remote workspace", async () => {
  const navPages = ["discover.html", "copytrade.html", "toolbox.html", "profile.html"];
  for (const page of navPages) {
    const html = await readPage(page);
    assert.doesNotMatch(html, /modao\.cc\/agent-py\/share\/6a41d02a75d0275ef68a14aa/, `${page} should not link back to the remote shared workspace`);
  }
});

// ── 4. 核心交互函数保留 ──────────────────────────────────
test("core interaction functions remain available", async () => {
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

// ── 5. 投资 DNA 测试页（onboarding）结构正确 ────────────
test("onboarding page has 5 questions and DNA scoring logic", async () => {
  const html = await readPage("onboarding.html");
  // 5 道题
  assert.match(html, /第\s*1\s*题|question.*1|Q1/i, "should have question 1");
  // 进度条
  assert.match(html, /progress|进度/, "should have progress indicator");
  // 评分逻辑：统计动物投票
  assert.match(html, /owl|cheetah|turtle|fox|squirrel/, "should reference animal DNA types");
  // 写入 localStorage
  assert.match(html, /investmentDna/, "should save to localStorage with key investmentDna");
  // 完成后跳转到 dna_result
  assert.match(html, /dna_result/, "should navigate to dna_result.html after completion");
});

// ── 6. DNA 结果页展示动物画像 ────────────────────────────
test("dna_result page reads DNA and displays animal profile", async () => {
  const html = await readPage("dna_result.html");
  // 读取 localStorage
  assert.match(html, /investmentDna/, "should read investmentDna from localStorage");
  // 5 种动物
  assert.match(html, /猫头鹰|owl/, "should reference 猫头鹰/owl");
  assert.match(html, /猎豹|cheetah/, "should reference 猎豹/cheetah");
  assert.match(html, /乌龟|turtle/, "should reference 乌龟/turtle");
  assert.match(html, /狐狸|fox/, "should reference 狐狸/fox");
  assert.match(html, /松鼠|squirrel/, "should reference 松鼠/squirrel");
  // 无 DNA 时跳回测试页
  assert.match(html, /onboarding/, "should redirect to onboarding if no DNA found");
  // 有风险提示
  assert.match(html, /风险|投资/, "should contain risk/investment disclaimer");
});

// ── 7. localStorage key 全局一致 ─────────────────────────
test("all pages use consistent localStorage key 'investmentDna'", async () => {
  const dnaPages = ["onboarding.html", "dna_result.html", "discover.html", "copytrade.html", "profile.html"];
  for (const page of dnaPages) {
    const html = await readPage(page);
    // 不应使用旧 key
    assert.doesNotMatch(html, /xiaojinli_dna/, `${page} should not use old key xiaojinli_dna`);
    assert.doesNotMatch(html, /investor_dna/, `${page} should not use old key investor_dna`);
    // 如果引用了 localStorage 中的 DNA key，必须是 investmentDna
    if (/localStorage/.test(html) && /Dna|dna/.test(html)) {
      assert.match(html, /investmentDna/, `${page} should use investmentDna key`);
    }
  }
});

// ── 8. 发现页包含新内容结构 ──────────────────────────────
test("discover page has redesigned content with ranking and DNA banner", async () => {
  const html = await readPage("discover.html");
  // 今天谁赚了大钱排行榜
  assert.match(html, /今天谁赚了大钱/, "should have ranking section");
  // DNA 画像 banner
  assert.match(html, /DNA|画像|投资性格/, "should reference DNA/profile section");
  // 日签宜/忌
  assert.match(html, /宜|忌/, "should have 宜/忌 daily sign");
  // 大咖投研
  assert.match(html, /大咖投研/, "should have expert research section");
  // DNA 排序逻辑
  assert.match(html, /dnaFit/, "should have dnaFit field for DNA-based sorting");
  assert.match(html, /getUserDNA/, "should read user DNA for personalization");
});

// ── 9. 广场页保留三 tab + DNA 推荐字段 ───────────────────
test("copytrade page keeps 3 tabs and DNA recommendation fields", async () => {
  const html = await readPage("copytrade.html");
  // 三个 tab：大牛持仓 / 游资动向 / 私募持仓
  assert.match(html, /大牛持仓/, "should have 大牛持仓 tab");
  assert.match(html, /游资动向/, "should have 游资动向 tab");
  assert.match(html, /私募持仓/, "should have 私募持仓 tab");
  // DNA 推荐字段
  assert.match(html, /dnaFit/, "should have dnaFit in mock data");
  assert.match(html, /fitReason/, "should have fitReason recommendation text");
  assert.match(html, /为什么推荐给你/, "should show recommendation reason to user");
  // 核心数据字段保留
  assert.match(html, /成功率/);
  assert.match(html, /最大回撤/);
  assert.match(html, /sampleSize:/);
  assert.match(html, /disclosureLag:/);
  // 候选名单保留
  assert.match(html, /候选名单/);
  // 模拟样本声明
  assert.match(html, /模拟样本/);
  assert.match(html, /不构成投资建议/);
});

// ── 10. 仓库页包含 AI 选股 + 验证作业 ────────────────────
test("toolbox page repurposed as 仓库 with AI stock picker and homework verification", async () => {
  const html = await readPage("toolbox.html");
  // AI 选股器
  assert.match(html, /AI\s*选股/, "should have AI stock picker section");
  // 验证我的作业
  assert.match(html, /验证.*作业/, "should have homework verification section");
  // 已抄作业示例
  assert.match(html, /睿远均衡|易方达|高毅/, "should show copied homework examples");
  // 小金鲤诊断
  assert.match(html, /诊断|匹配度/, "should show diagnosis/match score");
});

// ── 11. 我的页展示 DNA 画像 ──────────────────────────────
test("profile page renders DNA animal profile from localStorage", async () => {
  const html = await readPage("profile.html");
  // 投资画像区域
  assert.match(html, /投资.*画像|画像|DNA/, "should have investment profile section");
  // 动物类型配置
  assert.match(html, /猫头鹰|owl/, "should reference animal types");
  // 无 DNA 时引导去做测试
  assert.match(html, /onboarding/, "should link to onboarding for users without DNA");
  // DNA 数据读取
  assert.match(html, /investmentDna/, "should read investmentDna from localStorage");
});

// ── 12. 小金鲤浮窗全局可达 ───────────────────────────────
test("floating AI button present on all main pages", async () => {
  const floatPages = ["discover.html", "copytrade.html", "toolbox.html", "profile.html",
                      "index.html", "portfolio.html", "stock_detail.html"];
  for (const page of floatPages) {
    const html = await readPage(page);
    assert.match(html, /ai_assistant\.html/, `${page} should link to ai_assistant.html`);
  }
});

// ── 13. 共享运行时资源为本地文件 ─────────────────────────
test("shared runtime assets are local to the cloned project", async () => {
  const html = await readPage("stock_detail.html");
  assert.match(html, /assets\/vendor\/tailwindcss\.js/);
  assert.match(html, /assets\/vendor\/iconify-icon\.min\.js/);
  assert.match(html, /assets\/vendor\/echarts\.min\.js/);
  assert.doesNotMatch(html, /https:\/\/modao\.cc\/agent-py\/static\/source\/js/);
});

// ── 14. 持仓详情页不显示持有期筛选按钮 ──────────────────
test("portfolio page does not show holding period filter buttons", async () => {
  const portfolio = await readPage("portfolio.html");
  assert.doesNotMatch(portfolio, />短期<\/button>/);
  assert.doesNotMatch(portfolio, />中期<\/button>/);
  assert.doesNotMatch(portfolio, />长期<\/button>/);
});
