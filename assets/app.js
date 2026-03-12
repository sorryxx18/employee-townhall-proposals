    // ⚠️ 務必替換此網址為您的 GAS 部署網址
    const GAS_URL = "https://script.google.com/macros/s/AKfycbw1xL09BkHPxdFE8YVi7BJ9wukbqLbHLdx3bEVFg1VUndWm_x_Dc591fKI4h0EdSm8i/exec";
    
    document.getElementById('today').textContent = `📅 ${new Date().toLocaleDateString('zh-TW', {year:'numeric', month:'2-digit', day:'2-digit'})}`;

    function toggleId(s) { document.getElementById('identitySection').style.display = s ? 'block' : 'none'; }

    // 音效產生器：模擬真實消防車/救護車警笛 (Web Audio API)
    function playFireSiren() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth"; // 鋸齒波，聲音具穿透力
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      // 消防車音頻變化 (低->高->低)
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.5);
      osc.frequency.linearRampToValueAtTime(650, now + 1.0);
      
      gain.gain.setValueAtTime(0.2, now); // 設定適當音量
      osc.start(now);
      osc.stop(now + 1.0);
    }

    // 觸發紅藍閃爍與音效
    function triggerSirenSequence() {
      const overlay = document.getElementById('sirenOverlay');
      overlay.classList.add('siren-active');
      
      // 連續播放兩次警笛聲
      playFireSiren();
      setTimeout(playFireSiren, 1100);

      // 2.5秒後停止閃爍，彈出最終確認卡片
      setTimeout(() => {
        overlay.classList.remove('siren-active');
        document.getElementById('decisionZone').style.display = 'none';
        document.getElementById('finalConfirmCard').style.display = 'block';
        window.scrollTo({ top: document.getElementById('finalConfirmCard').offsetTop - 80, behavior: 'smooth' });
      }, 2500);
    }

    // 第一階段：送出比對
    async function handleInitialSubmit() {
      const q = document.getElementById('suggestion').value.trim();
      const e = document.getElementById('evidence').value.trim();
      if (!q || !e) return alert("「建議事項」與「具體事證」皆為必填項目喔！");

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
