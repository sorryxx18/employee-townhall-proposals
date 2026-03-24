// --- 網頁初始化 ---
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    document.getElementById("today").innerText = `${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}`;

    // 點擊開始填寫滾動到表單
    document.getElementById("startFillBtn").addEventListener("click", () => {
        document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
        updateStepper(1); // 切換到「提案內容」步驟
    });

    setupDragAndDrop();
    
    // 監聽輸入框，使用者輸入時清除紅字錯誤
    document.getElementById("suggestion").addEventListener("input", () => {
        document.getElementById("suggestionError").innerText = "";
    });
    document.getElementById("evidence").addEventListener("input", () => {
        document.getElementById("evidenceError").innerText = "";
    });
});

// --- UI 互動邏輯 ---
function toggleId(isNamed) {
    const section = document.getElementById("identitySection");
    if (isNamed) {
        section.style.display = "block";
    } else {
        section.style.display = "none";
        document.getElementById("dept").value = "";
        document.getElementById("jobTitle").value = "";
        document.getElementById("userName").value = "";
    }
}

function updateStepper(stepIndex) {
    const steps = document.querySelectorAll(".form-stepper .step");
    steps.forEach((step, index) => {
        if (index <= stepIndex) {
            step.classList.add("is-active");
        } else {
            step.classList.remove("is-active");
        }
    });
}

// --- 拖放上傳邏輯 ---
function setupDragAndDrop() {
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const fileList = document.getElementById("fileList");

    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener("change", (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;
        let fileNames = Array.from(files).map(f => `📄 ${f.name}`).join("<br>");
        fileList.innerHTML = `<strong>已選取 ${files.length} 個檔案：</strong><br>${fileNames}`;
        document.getElementById("dropZoneText").innerText = "點擊或拖放可重新選擇檔案";
        updateStepper(2); // 有選檔案，推至附件步驟
    }
}

// --- 表單防呆與 AI 模擬查詢 ---
function handleInitialSubmit() {
    const suggestion = document.getElementById("suggestion").value.trim();
    const evidence = document.getElementById("evidence").value.trim();
    
    // 1. 防呆檢查與紅字提示
    let hasError = false;
    if (!suggestion) {
        document.getElementById("suggestionError").innerText = "⚠️ 請詳細填寫建議事項，此為必填欄位。";
        hasError = true;
    }
    if (!evidence) {
        document.getElementById("evidenceError").innerText = "⚠️ 請列出具體事證或方案，此為必填欄位。";
        hasError = true;
    }

    if (hasError) {
        // 如果有錯，滾動回填寫區
        document.getElementById("suggestion").scrollIntoView({ behavior: "smooth", block: "center" });
        return; 
    }

    // 2. 通過檢查，隱藏輸入區塊與按鈕
    document.getElementById("submitBtn").style.display = "none";
    document.getElementById("formFields").style.display = "none";

    // 3. 顯示 AI 查詢動畫
    const overlay = document.getElementById("loadingOverlay");
    overlay.style.display = "flex";

    // 模擬 3 秒後顯示結果
    setTimeout(() => {
        overlay.style.display = "none";
        showDuplicateHint();
        updateStepper(3); // 推至「確認送出」步驟
    }, 3000);
}

function showDuplicateHint() {
    const dupHint = document.getElementById("dupHint");
    dupHint.style.display = "block";
    
    // 渲染假資料
    document.getElementById("aiSummary").innerHTML = `
        <strong>🤖 系統智慧分析：</strong><br>
        您的提案內容已分析完畢。系統發現過去 3 年內，已有 <strong>2 筆</strong> 高度相關的座談會紀錄，請參考以下辦理情形：
    `;

    document.getElementById("historyTable").innerHTML = `
        <table style="width:100%; border-collapse: collapse; text-align: left;">
            <tr style="border-bottom: 2px solid #ddd; background: #f8f9fa;">
                <th style="padding:10px;">年份</th>
                <th style="padding:10px;">提案摘要</th>
                <th style="padding:10px;">辦理結果</th>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding:10px;">111年</td>
                <td style="padding:10px;">建議爭取外勤消防衣第二套預算</td>
                <td style="padding:10px; color:var(--success); font-weight:bold;">✅ 已獲專案預算，預計年底配發完畢。</td>
            </tr>
            <tr>
                <td style="padding:10px;">112年</td>
                <td style="padding:10px;">反映勤休制度未落實補休</td>
                <td style="padding:10px; color:var(--text-muted);">📝 已函發各分隊，授權主管彈性調度。</td>
            </tr>
        </table>
    `;
    
    dupHint.scrollIntoView({ behavior: "smooth", block: "center" });
}

// --- 消防警報彩蛋特效 (Web Audio API) ---
let audioCtx;
let sirenOscillator;
let sirenGain;

function triggerSirenSequence() {
    // 隱藏查詢結果
    document.getElementById("dupHint").style.display = "none";
    
    // 啟動紅色閃爍
    const sirenOverlay = document.getElementById("sirenOverlay");
    sirenOverlay.style.display = "block";
    sirenOverlay.classList.add("siren-active");

    // 啟動音效
    playSirenAudio();

    // 顯示最終警告框
    const finalCard = document.getElementById("finalConfirmCard");
    finalCard.style.display = "block";
    finalCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

function playSirenAudio() {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        sirenOscillator = audioCtx.createOscillator();
        sirenGain = audioCtx.createGain();

        sirenOscillator.connect(sirenGain);
        sirenGain.connect(audioCtx.destination);

        sirenOscillator.type = 'square';
        sirenGain.gain.value = 0.1; // 音量控制 (避免太大聲)

        const now = audioCtx.currentTime;
        sirenOscillator.frequency.setValueAtTime(800, now);
        
        // 產生 Hi-Lo 交替警報聲
        for (let i = 0; i < 15; i++) {
            sirenOscillator.frequency.setValueAtTime(800, now + i);
            sirenOscillator.frequency.setValueAtTime(600, now + i + 0.5);
        }

        sirenOscillator.start(now);
        sirenOscillator.stop(now + 8); // 8 秒後停止
    } catch (e) {
        console.warn("瀏覽器阻擋了音效播放或不支援 Web Audio API", e);
    }
}

function stopSiren() {
    const sirenOverlay = document.getElementById("sirenOverlay");
    sirenOverlay.style.display = "none";
    sirenOverlay.classList.remove("siren-active");
    if (sirenOscillator) {
        try { sirenOscillator.stop(); } catch(e) {}
    }
}

// --- 最終送出 ---
function finalSave() {
    stopSiren(); // 停止警報
    
    // 隱藏所有不需要的區塊
    document.getElementById("formSection").style.display = "none";
    document.getElementById("introSection").style.display = "none";
    document.getElementById("heroSection").style.display = "none";

    // 顯示成功畫面
    const successBox = document.getElementById("successBox");
    successBox.style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}
