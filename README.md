# 員工座談會提案平台（靜態版）

這個專案是一個可直接部署到 **GitHub Pages** 的靜態網站，用來收集「員工座談會/提案」並透過 Google Apps Script (GAS) 做後端儲存與相似紀錄比對。

> 備註：目前 repo 名稱仍是歷史遺跡 `Japanese-travel-`，但內容是「員工座談會提案平台」。之後若要改名我也可以一起處理。

## 專案結構

- `index.html`：頁面結構（已移除內嵌 style/script，改成外掛檔案）
- `assets/styles.css`：樣式
- `assets/app.js`：前端邏輯（表單、送出、GAS 呼叫等）
- `CNAME`：GitHub Pages 自訂網域（如果你有用）

## 重要設定：GAS_URL

在 `assets/app.js` 內有一行：

```js
const GAS_URL = "https://script.google.com/macros/s/.../exec";
```

請替換成你自己的 Google Apps Script 部署網址。

## 本機預覽

這是純靜態站，你可以用任何靜態伺服器預覽，例如：

```bash
python3 -m http.server 5173
```

然後打開 <http://localhost:5173>。

## 部署（GitHub Pages）

1. 到 GitHub repo → Settings → Pages
2. Source 選 `Deploy from a branch`
3. Branch 選 `main` / `(root)`
4. 若有自訂網域，維持 `CNAME` 內容與 DNS 設定一致

---

如果你想做的下一步改進我建議是：
- 把 `GAS_URL` 抽成 `assets/config.js`（避免不小心 commit 到不同環境）
- 加入基本表單驗證與更清楚的錯誤提示
- 把 `首頁` 那個歷史檔案整理/移除（確認無用再刪）
