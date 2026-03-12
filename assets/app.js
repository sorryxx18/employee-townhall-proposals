    // ⚠️ 務必替換此網址為您的 GAS 部署網址
    const GAS_URL = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) ? window.APP_CONFIG.GAS_URL : "";
    if (!GAS_URL) {
      console.warn("APP_CONFIG.GAS_URL 未設定，請檢查 assets/config.js");
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
      const idErr = document.getElementById('identityError');
      if (idErr) idErr.textContent = '';
      ['dept','jobTitle','userName'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('is-invalid');
      });
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

    // 第一階段：送出比對
    async function handleInitialSubmit() {
      if (!validateForm()) return;

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      document.getElementById('loadingOverlay').style.display = 'flex';

      try {
        const res = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "query", query: q }) });
        const json = await res.json();
        document.getElementById('loadingOverlay').style.display = 'none';

        if (json.status === "success") {
          if (json.data.history && json.data.history.length > 0) {
            document.getElementById('dupHint').style.display = 'block';
            document.getElementById('aiSummary').innerText = json.data.summary;
            let h = '<table class="history-table"><thead><tr><th style="width:18%">會議日期</th><th style="width:35%">訴求摘要</th><th style="width:47%">辦理結果</th></tr></thead><tbody>';
            json.data.history.forEach(item => {
              h += `<tr><td><b>${item.date}</b></td><td>${item.proposal}</td><td>${item.conclusion}</td></tr>`;
            });
            document.getElementById('historyTable').innerHTML = h + '</tbody></table>';
            
            btn.style.display = 'none';
            window.scrollTo({ top: document.getElementById('dupHint').offsetTop - 80, behavior: 'smooth' });
          } else {
            // 無重複，直接存檔
            await finalSave();
          }
        }
      } catch (err) {
        document.getElementById('loadingOverlay').style.display = 'none';
        alert("連線異常，請重試");
        btn.disabled = false;
      }
    }

    // 第二階段：最終存檔
    async function finalSave() {
      document.getElementById('finalConfirmCard').style.display = 'none';
      document.getElementById('loadingOverlay').style.display = 'flex';

      const formData = {
        identity: document.querySelector('input[name="identity"]:checked').value,
        dept: document.getElementById('dept').value,
        jobTitle: document.getElementById('jobTitle').value,
        userName: document.getElementById('userName').value,
        suggestion: document.getElementById('suggestion').value,
        evidence: document.getElementById('evidence').value
      };

      try {
        const res = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "save", formData: formData }) });
        const json = await res.json();
        document.getElementById('loadingOverlay').style.display = 'none';
        
        if (json.status === "success") {
          document.getElementById('formSection').style.display = 'none';
          document.querySelector('.intro-grid').style.display = 'none';
          document.getElementById('successBox').style.display = 'block';
          window.scrollTo(0,0);
        }
      } catch (e) {
        document.getElementById('loadingOverlay').style.display = 'none';
        alert("存檔失敗，請檢查網路連線。");
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
