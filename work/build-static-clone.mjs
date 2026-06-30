import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const shareId = "6a41d02a75d0275ef68a14aa";
const sourceBase = `https://modao.cc/agent-py/share/${shareId}/workspace/file/xiaojinli.html`;
const outputRoot = path.resolve("outputs/xiaojinli-static");

const pages = [
  "discover.html",
  "copytrade.html",
  "toolbox.html",
  "profile.html",
  "ai_assistant.html",
  "portfolio.html",
  "stock_detail.html"
];

const vendorAssets = [
  ["https://modao.cc/agent-py/static/source/js/tailwindcss.js", "assets/vendor/tailwindcss.js"],
  ["https://modao.cc/agent-py/static/source/js/iconify-icon.min.js", "assets/vendor/iconify-icon.min.js"],
  ["https://modao.cc/agent-py/static/source/js/echarts.min.js", "assets/vendor/echarts.min.js"]
];

const imageAssets = [
  ["https://modao.cc/agent-py/media/generated_images/2026-06-26/e44412605f474a7cab069882ae35d8db.jpg", "assets/images/profile-avatar.jpg"]
];

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

function localizeHtml(html) {
  return html
    .replaceAll("https://modao.cc/agent-py/static/source/js/tailwindcss.js", "assets/vendor/tailwindcss.js")
    .replaceAll("https://modao.cc/agent-py/static/source/js/iconify-icon.min.js", "assets/vendor/iconify-icon.min.js")
    .replaceAll("https://modao.cc/agent-py/static/source/js/echarts.min.js", "assets/vendor/echarts.min.js")
    .replaceAll("/agent-py/media/generated_images/2026-06-26/e44412605f474a7cab069882ae35d8db.jpg", "assets/images/profile-avatar.jpg")
    .replace(new RegExp(`${sourceBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([a-z_]+\\.html)(?:\\?[^\"'<>]*)?`, "g"), "$1")
    .replace(/(href|location\.href)=["']#["']/g, "$&")
    .replace(/(href=["'][^"']+\.html)\?render_html=true/g, "$1")
    .replace(/(href=["'][^"']+\.html)\?[^"']*render_html=true/g, "$1")
    .replace(/(location\.href=['"][^'"]+\.html)\?render_html=true/g, "$1")
    .replace(/(location\.href=['"][^'"]+\.html)\?[^'"]*render_html=true/g, "$1");
}

async function writeAsset(url, relativePath, binary = false) {
  const filePath = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, binary ? await fetchBytes(url) : await fetchText(url));
}

await mkdir(outputRoot, { recursive: true });

for (const [url, relativePath] of vendorAssets) {
  await writeAsset(url, relativePath);
}

for (const [url, relativePath] of imageAssets) {
  await writeAsset(url, relativePath, true);
}

for (const page of pages) {
  const html = localizeHtml(await fetchText(`${sourceBase}/${page}?render_html=true`));
  await writeFile(path.join(outputRoot, page), html);
}

const indexHtml = localizeHtml(await fetchText(`${sourceBase}/discover.html?render_html=true`));
await writeFile(path.join(outputRoot, "index.html"), indexHtml);

await writeFile(
  path.join(outputRoot, "README.md"),
  `# 小金鲤静态复刻\n\n这是从墨刀分享页本地化出来的静态 HTML 版本。\n\n## 打开方式\n\n直接打开 \`index.html\`，或用任意静态服务器指向本目录。\n\n## 页面\n\n- \`index.html\` / \`discover.html\`：发现\n- \`copytrade.html\`：抄作业\n- \`toolbox.html\`：工具箱\n- \`profile.html\`：我的\n- \`ai_assistant.html\`：AI 助手\n- \`portfolio.html\`：组合清单\n- \`stock_detail.html\`：股票详情\n\n## 修改入口\n\n每个页面都是独立 HTML，公共颜色在各页面头部的 Tailwind 配置里。底部导航和页面跳转已改成本地文件链接。\n`
);

console.log(`Built static clone at ${outputRoot}`);
