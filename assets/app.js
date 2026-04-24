    // ⚠️ 務必替換此網址為您的 GAS 部署網址
    const GAS_URL = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) ? window.APP_CONFIG.GAS_URL : "";
    if (!GAS_URL) {
      console.warn("APP_CONFIG.GAS_URL 未設定，請檢查 assets/config.js");
    }

    function getApiToken() {
      const token = (window.APP_CONFIG && window.APP_CONFIG.API_TOKEN) ? String(window.APP_CONFIG.API_TOKEN) : "";
      return token.trim();
    }

    function ensureApiTokenOrAlert() {
      const token = getApiToken();
      if (!token) {
        alert("系統尚未完成設定（API_TOKEN 未填寫）。\n\n請聯絡管理者協助設定後再使用。");
        return null;
      }
      return token;
    }
    
    document.getElementById('today').textContent = `📅 ${new Date().toLocaleDateString('zh-TW', {year:'numeric', month:'2-digit', day:'2-digit'})}`;

    // 首屏 CTA：平滑捲動到表單
    const startBtn = document.getElementById('startFillBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const el = document.getElementById('formSection');
        if (!el) return;
        const topbar = document.querySelector('.topbar');
        const offset = topbar ? topbar.offsetHeight + 12 : 12;
        const y = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }

    // ===== 進度條（依捲動高亮） =====
    function setupFormStepper() {
      const steps = Array.from(document.querySelectorAll('.form-stepper .step'));
      if (!steps.length) return;

      const map = {
        identity: document.getElementById('identitySection'),
        content: document.getElementById('contentSection'),
        attachments: document.getElementById('attachmentsSection'),
        confirm: document.getElementById('confirmSection'),
      };

      const targets = Object.entries(map).filter(([,el]) => !!el);
      if (!targets.length) return;

      const activate = (key) => {
        steps.forEach(s => s.classList.toggle('is-active', s.dataset.step === key));
      };

      // 點擊 step：捲到對應區塊（體驗加分）
      steps.forEach(sEl => {
        sEl.addEventListener('click', () => {
          const key = sEl.dataset.step;
          const el = map[key];
          if (!el) return;
          const topbar = document.querySelector('.topbar');
          const offset = topbar ? topbar.offsetHeight + 12 : 12;
          const y = el.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        });
      });

      const io = new IntersectionObserver((entries) => {
        // 找出目前最靠上的可視區塊
        const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const el = visible[0].target;
        const key = targets.find(([,t]) => t === el)?.[0];
        if (key) activate(key);
      }, {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65],
      });

      targets.forEach(([,el]) => io.observe(el));
    }

    setupFormStepper();

    function toggleId(s) { document.getElementById('identitySection').style.display = s ? 'block' : 'none'; }


    // ===== 表單驗證（中性文案） =====
    function setFieldError(inputEl, errorEl, message) {
      if (errorEl) errorEl.textContent = message || "";
      if (inputEl) {
        if (message) inputEl.classList.add('is-invalid');
        else inputEl.classList.remove('is-invalid');
      }
    }

    function clearAllErrors() {
      setFieldError(document.getElementById('suggestion'), document.getElementById('suggestionError'), '');
      setFieldError(document.getElementById('evidence'), document.getElementById('evidenceError'), '');
      setFieldError(document.getElementById('noveltyExplain'), document.getElementById('noveltyExplainError'), '');
      const idErr = document.getElementById('identityError');
      if (idErr) idErr.textContent = '';
      ['dept','jobTitle','userName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('is-invalid');
      });
    }

    function validateNoveltyExplain() {
      const section = document.getElementById('noveltyExplainSection');
      if (!section || section.style.display === 'none') return true;

      const noveltyExplain = document.getElementById('noveltyExplain');
      const value = (noveltyExplain?.value || '').trim();
      if (value) {
        setFieldError(noveltyExplain, document.getElementById('noveltyExplainError'), '');
        return true;
      }

      setFieldError(noveltyExplain, document.getElementById('noveltyExplainError'), '請補充說明本次與歷次提案相比的新增重點。');
      const topbar = document.querySelector('.topbar');
      const offset = topbar ? topbar.offsetHeight + 12 : 12;
      const y = noveltyExplain.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setTimeout(() => noveltyExplain.focus({ preventScroll: true }), 250);
      return false;
    }

    function validateForm() {
      clearAllErrors();

      const identityValue = document.querySelector('input[name="identity"]:checked')?.value;
      const isNamed = identityValue === 'named';

      const dept = document.getElementById('dept');
      const jobTitle = document.getElementById('jobTitle');
      const userName = document.getElementById('userName');
      const suggestion = document.getElementById('suggestion');
      const evidence = document.getElementById('evidence');

      let firstBad = null;

      if (isNamed) {
        const d = (dept?.value || '').trim();
        const j = (jobTitle?.value || '').trim();
        const u = (userName?.value || '').trim();
        const idErr = document.getElementById('identityError');
        if (!d || !j || !u) {
          if (idErr) idErr.textContent = '請完整填寫「單位 / 職稱 / 姓名」。';
          if (!d) dept?.classList.add('is-invalid');
          if (!j) jobTitle?.classList.add('is-invalid');
          if (!u) userName?.classList.add('is-invalid');
          firstBad = dept || jobTitle || userName;
        }
      }

      const q = (suggestion?.value || '').trim();
      const e = (evidence?.value || '').trim();
      if (!q) {
        setFieldError(suggestion, document.getElementById('suggestionError'), '請填寫「建議事項」。');
        firstBad = firstBad || suggestion;
      }
      if (!e) {
        setFieldError(evidence, document.getElementById('evidenceError'), '請填寫「具體事證 / 建議方案」。');
        firstBad = firstBad || evidence;
      }

      if (firstBad) {
        const topbar = document.querySelector('.topbar');
        const offset = topbar ? topbar.offsetHeight + 12 : 12;
        const y = firstBad.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setTimeout(() => firstBad.focus({ preventScroll: true }), 250);
        return false;
      }

      return true;
    }

    // 音效產生器：模擬真實消防車/救護車警笛 (Web Audio API)
    function playFireSiren() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      // 更浮誇：更大的頻率掃描 + 更明顯的音量包絡
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.45);
      osc.frequency.linearRampToValueAtTime(680, now + 0.9);
      osc.frequency.linearRampToValueAtTime(1320, now + 1.35);
      osc.frequency.linearRampToValueAtTime(520, now + 1.8);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.9);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 1.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

      osc.start(now);
      osc.stop(now + 1.95);
    }

    // 觸發紅藍閃爍與音效
    function triggerSirenSequence() {
      const overlay = document.getElementById('sirenOverlay');
      overlay.classList.add('siren-active');
      document.body.classList.add('siren-shake');
      
      // 連續播放多次警笛聲（更浮誇，但不加威嚇文案）
      const sirenTimes = [0, 650, 1300, 1950, 2600];
      sirenTimes.forEach((t) => setTimeout(playFireSiren, t));

      // 停止閃爍後，彈出最終確認卡片
      setTimeout(() => {
        overlay.classList.remove('siren-active');
        document.getElementById('decisionZone').style.display = 'none';
        document.getElementById('finalConfirmCard').style.display = 'block';
        window.scrollTo({ top: document.getElementById('finalConfirmCard').offsetTop - 80, behavior: 'smooth' });
              document.body.classList.remove('siren-shake');
      }, 3200);
    }

    // ===== GAS 呼叫（避免 CORS preflight + 防呆解析回應） =====
    async function postToGas(action, payload) {
      const res = await fetch(GAS_URL, {
        method: "POST",
        // 關鍵：用 text/plain 避免觸發 preflight（參照 facility-booking）
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { status: "error", message: "Non-JSON response", raw: text };
      }

      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}`);
        err.response = json;
        throw err;
      }

      return json;
    }

    function escapeHtml_(s) {
      return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderMatches_(matches) {
      const wrap = document.getElementById('historyTable');
      if (!wrap) return;

      if (!Array.isArray(matches) || matches.length === 0) {
        wrap.innerHTML = '<div style="color:var(--text-muted);">查無相近紀錄</div>';
        return;
      }

      wrap.innerHTML = matches.slice(0, 5).map(m => {
        const title = m.title || m.proposal || m.topic || '相近提案';
        const year = m.year || m.date || '未標示年度';
        const department = m.department || m.dept || m.unit || '未標示單位';
        const status = m.status || m.result || m.progress || '未標示辦理情形';
        const similarity = m.similarity || m.score || 'medium';
        const summary = escapeHtml_(m.summary || m.conclusion || m.detail || '');
        const id = m.id ? `｜編號 ${escapeHtml_(m.id)}` : '';

        return `
          <div style="padding:16px; border:1px solid var(--border); border-radius:16px; margin:12px 0; background:rgba(255,255,255,0.9); box-shadow:var(--shadow-sm);">
            <div style="font-weight:900; margin-bottom:8px; color:var(--deep-brown);">${escapeHtml_(title)}${id}</div>
            <div style="font-size:14px; color:var(--text-muted); margin-bottom:10px;">${escapeHtml_(year)}｜${escapeHtml_(department)}｜相似度 ${escapeHtml_(similarity)}｜${escapeHtml_(status)}</div>
            <div style="font-size:15px; line-height:1.75; color:var(--text-main);">${summary || '系統已判定為相近提案，但目前未提供摘要內容。'}</div>
          </div>
        `;
      }).join('');
    }

    function renderHistory_(history) {
      const wrap = document.getElementById('historyTable');
      if (!wrap) return;

      if (!Array.isArray(history) || history.length === 0) {
        wrap.innerHTML = '<div style="color:var(--text-muted);">查無相近紀錄</div>';
        return;
      }

      // 舊版格式：{date, proposal, conclusion}
      const rows = history.slice(0, 10).map(h => {
        return `
          <tr>
            <td style="padding:10px; border-bottom:1px solid var(--border); white-space:nowrap;">${escapeHtml_(h.date || '')}</td>
            <td style="padding:10px; border-bottom:1px solid var(--border);">${escapeHtml_(h.proposal || '')}</td>
            <td style="padding:10px; border-bottom:1px solid var(--border);">${escapeHtml_(h.conclusion || '')}</td>
          </tr>
        `;
      }).join('');

      wrap.innerHTML = `
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left; padding:10px; border-bottom:2px solid var(--border);">時間</th>
              <th style="text-align:left; padding:10px; border-bottom:2px solid var(--border);">相似提案</th>
              <th style="text-align:left; padding:10px; border-bottom:2px solid var(--border);">結論</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    let lastAnalysisResult = null;

    function setResultTagline(text) {
      const el = document.getElementById('resultTagline');
      if (!el) return;
      el.textContent = text || '';
      el.style.display = text ? 'block' : 'none';
    }

    function showNoveltySection(show) {
      const section = document.getElementById('noveltyExplainSection');
      if (!section) return;
      section.style.display = show ? 'block' : 'none';
      if (!show) {
        const field = document.getElementById('noveltyExplain');
        if (field) field.value = '';
        setFieldError(document.getElementById('noveltyExplain'), document.getElementById('noveltyExplainError'), '');
      }
    }

    function setDecisionButtons(buttons) {
      const zone = document.getElementById('decisionZone');
      if (!zone) return;
      zone.innerHTML = buttons.map(btn => `<button class="btn ${btn.className}" type="button" onclick="${btn.onclick}">${btn.label}</button>`).join('');
      zone.style.display = buttons.length ? 'grid' : 'none';
    }

    function openFinalConfirm(message) {
      document.getElementById('decisionZone').style.display = 'none';
      const text = document.getElementById('finalConfirmText');
      if (text && message) text.innerHTML = message;
      document.getElementById('finalConfirmCard').style.display = 'block';
      window.scrollTo({ top: document.getElementById('finalConfirmCard').offsetTop - 80, behavior: 'smooth' });
    }

    function proceedWithSupplementSubmit() {
      if (!validateNoveltyExplain()) return;
      const explain = (document.getElementById('noveltyExplain')?.value || '').trim();
      openFinalConfirm(`系統查得本次提案與歷次紀錄主題相近。<br>您已補充本次新增重點，若確認仍需反映，請繼續正式送出。`);
      if (lastAnalysisResult) lastAnalysisResult.noveltyExplain = explain;
    }

    function renderReviewOnly(data) {
      setResultTagline('系統判斷本次提案與歷次紀錄高度相近，建議先參考既有辦理情形。');
      showNoveltySection(false);
      setDecisionButtons([
        { label: '我已了解，先不送出', className: 'btnSuccess', onclick: 'window.location.reload()' },
        { label: '我有新增情況，繼續補充送出', className: 'btnDanger', onclick: 'showSupplementFlow()' }
      ]);
    }

    function renderSupplementAndSubmit(data) {
      setResultTagline('系統查得本次提案與歷次紀錄主題相近，但可能包含新的補充內容。');
      showNoveltySection(true);
      setDecisionButtons([
        { label: '補充完成，正式送出', className: 'btnDanger', onclick: 'proceedWithSupplementSubmit()' },
        { label: '我已了解，先不送出', className: 'btnSuccess', onclick: 'window.location.reload()' }
      ]);
    }

    function renderSubmitDirectly(data) {
      setResultTagline('系統未查得明顯相近提案，您可直接正式送出。');
      showNoveltySection(false);
      setDecisionButtons([
        { label: '正式送出', className: 'btnDanger', onclick: 'finalSave()' },
        { label: '返回修改', className: 'btnSuccess', onclick: 'window.scrollTo({ top: document.getElementById(\'formSection\').offsetTop - 80, behavior: \'smooth\' })' }
      ]);
    }

    function showSupplementFlow() {
      renderSupplementAndSubmit(lastAnalysisResult || {});
      const section = document.getElementById('noveltyExplainSection');
      if (section) {
        const topbar = document.querySelector('.topbar');
        const offset = topbar ? topbar.offsetHeight + 12 : 12;
        const y = section.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }

    window.showSupplementFlow = showSupplementFlow;
    window.proceedWithSupplementSubmit = proceedWithSupplementSubmit;

    function renderDecisionFlow(payload) {
      lastAnalysisResult = payload || {};
      const action = String(payload?.recommendedAction || '').trim();
      document.getElementById('finalConfirmCard').style.display = 'none';

      if (action === 'review_only') {
        renderReviewOnly(payload);
        return;
      }
      if (action === 'supplement_and_submit') {
        renderSupplementAndSubmit(payload);
        return;
      }
      renderSubmitDirectly(payload);
    }

    function scrollToResultCard() {
      const dupHint = document.getElementById('dupHint');
      if (!dupHint) return;
      const topbar = document.querySelector('.topbar');
      const offset = topbar ? topbar.offsetHeight + 16 : 16;
      const y = dupHint.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
    }

    // 第一階段：查詢歷次紀錄（顯示證據：問題/回答 + 來源列號），再由使用者決定是否送出
    async function handleInitialSubmit() {
      if (!validateForm()) return;

      const apiToken = ensureApiTokenOrAlert();
      if (!apiToken) return;

      // 暫存 token，供最終存檔使用
      window.__API_TOKEN__ = apiToken;

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;

      // 顯示 loading
      document.getElementById('loadingOverlay').style.display = 'flex';

      try {
        const suggestionText = String(document.getElementById('suggestion')?.value || '').trim();
        const evidenceText = String(document.getElementById('evidence')?.value || '').trim();
        const queryText = [suggestionText, evidenceText].filter(Boolean).join('\n\n');
        const resp = await postToGas('query', { token: apiToken, query: queryText });
        const payload = (resp && resp.data && typeof resp.data === 'object') ? resp.data : resp;

        // 隱藏 loading
        document.getElementById('loadingOverlay').style.display = 'none';

        // 顯示結果卡
        const dupHint = document.getElementById('dupHint');
        dupHint.style.display = 'block';

        document.getElementById('aiSummary').textContent = (payload && (payload.reason || payload.summary || payload.rawDetail)) ? String(payload.reason || payload.summary || payload.rawDetail) : '目前未取得摘要，請先參考下方比對結果。';

        // 新舊格式兼容：matches（新版）/ history（舊版）
        const matches = (payload && Array.isArray(payload.matches)) ? payload.matches : null;
        const history = (payload && Array.isArray(payload.history)) ? payload.history : null;

        if (matches) renderMatches_(matches);
        else renderHistory_(history || []);

        renderDecisionFlow(payload || {});

        requestAnimationFrame(() => {
          setTimeout(scrollToResultCard, 60);
        });
      } catch (err) {
        console.error(err);
        document.getElementById('loadingOverlay').style.display = 'none';
        btn.disabled = false;
        alert('查詢失敗，請稍後再試或聯絡管理者。');
      }
    }

    // 第二階段：最終存檔（改為 JSON fetch，支援附件）
    async function finalSave() {
      if (!validateNoveltyExplain()) return;
      const apiToken = (window.__API_TOKEN__ || '').trim();
      if (!apiToken) {
        alert("系統尚未完成設定（API_TOKEN 未填寫）。\n\n請聯絡管理者協助設定後再使用。");
        return;
      }

      document.getElementById('finalConfirmCard').style.display = 'none';
      document.getElementById('loadingOverlay').style.display = 'flex';

      try {
        const formData = {
          identity: document.querySelector('input[name="identity"]:checked')?.value || '',
          dept: document.getElementById('dept')?.value || '',
          jobTitle: document.getElementById('jobTitle')?.value || '',
          userName: document.getElementById('userName')?.value || '',
          suggestion: document.getElementById('suggestion')?.value || '',
          evidence: document.getElementById('evidence')?.value || '',
          noveltyExplain: document.getElementById('noveltyExplain')?.value || '',
          duplicateLevel: lastAnalysisResult?.duplicateLevel || '',
          noveltyLevel: lastAnalysisResult?.noveltyLevel || '',
          recommendedAction: lastAnalysisResult?.recommendedAction || ''
        };

        const attachments = await buildAttachmentPayloads(selectedFiles);
        const resp = await postToGas('save', {
          token: apiToken,
          formData,
          attachments
        });

        document.getElementById('loadingOverlay').style.display = 'none';

        if (!resp || resp.status !== 'success') {
          throw new Error((resp && resp.message) ? resp.message : '送出失敗');
        }

        const count = resp.data && typeof resp.data.attachmentCount === 'number'
          ? resp.data.attachmentCount
          : attachments.length;

        alert(count > 0 ? `提案已送出，附件 ${count} 件已上傳。` : '提案已送出。');
        window.location.reload();
      } catch (err) {
        console.error(err);
        document.getElementById('loadingOverlay').style.display = 'none';
        document.getElementById('finalConfirmCard').style.display = 'block';
        alert('送出失敗，請稍後再試。若有附件，請確認檔案大小與格式是否符合限制。');
      }
    }
    // --- 新增：檔案點擊與拖拉互動邏輯 ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    let selectedFiles = []; // 存放使用者選擇的檔案

    // 1. 點擊整個虛線框時，觸發隱藏的 input
    dropZone.addEventListener('click', () => fileInput.click());

    // 2. 透過點擊視窗選擇檔案後
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    // 3. 拖曳進入框內時的視覺變化
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    // 4. 拖曳離開框時恢復原狀
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    // 5. 放開滑鼠丟下檔案時
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleFiles(e.dataTransfer.files);
    });

    // 處理檔案的副程式
    function handleFiles(files) {
      if (files.length > 0) {
        Array.from(files).forEach(file => selectedFiles.push(file));
        updateFileList();
      }
    }

    // 更新下方檔案清單的畫面
    function updateFileList() {
      if (selectedFiles.length === 0) {
        fileList.innerHTML = "";
        document.getElementById('dropZoneText').innerText = "點擊或拖放檔案至此處上傳";
        return;
      }
      document.getElementById('dropZoneText').innerText = "可繼續點擊或拖放增加檔案";
      
      let html = '<ul style="list-style:none; padding:0;">';
      selectedFiles.forEach((f, index) => {
        html += `<li style="margin-bottom: 8px; background: rgba(255,255,255,0.6); padding: 10px 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border);">
                   <span>📄 ${f.name}</span>
                   <span style="color:var(--danger); cursor:pointer; font-size:16px;" onclick="removeFile(${index}, event)">✖ 移除</span>
                 </li>`;
      });
      html += '</ul>';
      fileList.innerHTML = html;
    }

    // 移除單一檔案 (加 event.stopPropagation() 防止點擊時又觸發上傳窗)
    function removeFile(index, event) {
      event.stopPropagation();
      selectedFiles.splice(index, 1);
      updateFileList();
    }

    async function buildAttachmentPayloads(files) {
      if (!Array.isArray(files) || files.length === 0) return [];
      const maxFiles = 5;
      const maxBytes = 5 * 1024 * 1024;

      if (files.length > maxFiles) {
        throw new Error(`附件最多只能上傳 ${maxFiles} 個`);
      }

      const allowedMimeTypes = new Set([
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]);

      return Promise.all(files.map(file => {
        if (file.size > maxBytes) {
          throw new Error(`${file.name} 超過 5MB 限制`);
        }
        if (file.type && !allowedMimeTypes.has(file.type)) {
          throw new Error(`${file.name} 檔案格式不支援`);
        }

        return fileToBase64Payload(file);
      }));
    }

    function fileToBase64Payload(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          const base64 = result.includes(',') ? result.split(',')[1] : result;
          resolve({
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64
          });
        };
        reader.onerror = () => reject(new Error(`讀取檔案失敗：${file.name}`));
        reader.readAsDataURL(file);
      });
    }
