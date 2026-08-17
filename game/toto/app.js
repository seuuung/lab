// app.js - 삼척 날씨 기상 토토 인터랙션 및 상태 관리 스크립트

// 1. 베팅 데이터 상태 정의
const initialMarkets = [
    {
        id: "market-1",
        category: "main",
        title: "☀️ 7월 17일 삼척 기상 상태 (주요 형태)",
        description: "삼척 기상청 공식 발표 상 가장 지배적인 기상 아이콘 결정",
        odds: [
            { id: "opt-1-sunny", name: "☀️ 맑음 (Sunny)", value: 2.15, key: "sunny" },
            { id: "opt-1-cloudy", name: "☁️ 흐림 (Cloudy)", value: 3.10, key: "cloudy" },
            { id: "opt-1-rainy", name: "🌧️ 비 (Rainy)", value: 1.85, key: "rainy" },
            { id: "opt-1-storm", name: "⛈️ 폭우/천둥번개 (Storm)", value: 8.50, key: "storm" }
        ]
    },
    {
        id: "market-2",
        category: "temp",
        title: "🌡️ 최고 기온 핸디캡 오버/언더 (O/U 29.0°C)",
        description: "7월 17일 삼척 최고 기온이 29.0°C 기준을 넘는지의 여부",
        odds: [
            { id: "opt-2-over", name: "🔥 오버 [29.1°C 이상]", value: 1.90, key: "over29" },
            { id: "opt-2-under", name: "❄️ 언더 [29.0°C 이하]", value: 1.90, key: "under29" }
        ]
    },
    {
        id: "market-3",
        category: "rain",
        title: "🌧️ 삼척 기상청 공식 일 누적 강수량 예측",
        description: "삼척 관측지점 일 누적 강수량의 최종 구간 판정",
        odds: [
            { id: "opt-3-norain", name: "💧 비 안옴 [0 mm]", value: 2.40, key: "norain" },
            { id: "opt-3-under10", name: "🌧️ 이슬비 [0.1~10.0 mm 이하]", value: 1.70, key: "under10" },
            { id: "opt-3-over10", name: "🌊 장마급 폭우 [10.1 mm 이상]", value: 4.50, key: "over10" }
        ]
    },
    {
        id: "market-4",
        category: "wind",
        title: "💨 맹방해변 최대 풍속 오버/언더 (O/U 5.0m/s)",
        description: "관측소 측정 순간 최대 풍속이 5.0m/s를 초과하는가?",
        odds: [
            { id: "opt-4-over", name: "🌬️ 오버 [5.1 m/s 이상 강풍]", value: 2.10, key: "over5" },
            { id: "opt-4-under", name: "🍃 언더 [5.0 m/s 이하 순풍]", value: 1.65, key: "under5" }
        ]
    }
];

let state = {
    isLoggedIn: false,
    wallet: 1000000, 
    activeTab: "all", 
    betSlip: null, // { marketId, optionId, name, oddValue, optionKey, marketTitle }
    stake: 0, 
    myBets: [], 
    friends: [],
    markets: JSON.parse(JSON.stringify(initialMarkets)),
    txType: null, // 'deposit' 또는 'withdraw'
    txAmount: 0
};

// 2. 사운드 메이커 (Web Audio API)
const soundEffects = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playClick() {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {}
    },
    playSuccess() {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.setValueAtTime(554, this.ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(659, this.ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.35);
        } catch (e) {}
    },
    playFail() {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(250, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch (e) {}
    },
    playTick() {
        try {
            this.init();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch (e) {}
    }
};

// 3. 로컬 스토리지 데이터 동기화
function saveState() {
    localStorage.setItem("samcheok_weather_totto_v3", JSON.stringify({
        isLoggedIn: state.isLoggedIn,
        wallet: state.wallet,
        myBets: state.myBets,
        friends: state.friends,
        markets: state.markets
    }));
}

function loadState() {
    const saved = localStorage.getItem("samcheok_weather_totto_v3");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.isLoggedIn = parsed.isLoggedIn ?? false;
            state.wallet = parsed.wallet ?? 1000000;
            state.myBets = parsed.myBets ?? [];
            state.friends = parsed.friends ?? state.friends;
            state.markets = parsed.markets ?? state.markets;
            
            const userIdx = state.friends.findIndex(f => f.isUser);
            if (userIdx !== -1) {
                state.friends[userIdx].score = state.wallet;
            }
        } catch (e) {
            console.error("데이터 로드 실패", e);
        }
    }
}

// 4. 보안 게이트웨이 로그인 검증 (로컬 스토리지 DB 연계)
function attemptLogin() {
    const codeInput = document.getElementById("gate-code-input");
    const nickInput = document.getElementById("gate-nick-input");
    const passInput = document.getElementById("gate-password-input");

    const nickname = nickInput ? nickInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";
    const code = codeInput ? codeInput.value.trim().toUpperCase() : "";

    if (!nickname) {
        showToast("닉네임을 설정해 주세요.", "error");
        soundEffects.playFail();
        return;
    }
    if (!password) {
        showToast("보안 비밀번호를 입력해 주세요.", "error");
        soundEffects.playFail();
        return;
    }

    // 로컬 유저 데이터베이스 가져오기
    let localUsers = {};
    const savedUsers = localStorage.getItem("weather_toto_local_users");
    if (savedUsers) {
        try {
            localUsers = JSON.parse(savedUsers);
        } catch (e) {
            localUsers = {};
        }
    }

    const existingUser = localUsers[nickname];

    if (existingUser) {
        // 기존 회원 로그인 검증
        if (existingUser.password !== password) {
            showToast("이미 사용 중인 닉네임이거나 비밀번호가 일치하지 않습니다.", "error");
            soundEffects.playFail();
            return;
        }
        // 기존 자산 동기화
        state.wallet = existingUser.score || 0;
        showToast(`[보안 승인] 보안 로그인 성공! 환영합니다, ${nickname} 배터님.`, "success");
    } else {
        // 신규 가입 절차 진행
        if (code !== "SAMCHEOK" && code !== "WEATHER" && code !== "717") {
            showToast("가입 코드가 일치하지 않습니다. 추천인 코드를 재확인하십시오.", "error");
            soundEffects.playFail();
            return;
        }
        
        // 신규 회원 기본 포인트 지급
        state.wallet = 1000000;
        localUsers[nickname] = {
            name: nickname,
            password: password,
            score: state.wallet,
            registeredAt: new Date().toISOString()
        };
        localStorage.setItem("weather_toto_local_users", JSON.stringify(localUsers));
        showToast(`[가입 승인] 회원가입 성공! 가입 지원금 1,000,000 ₩ 무상 충전 완료!`, "success");
    }

    soundEffects.playSuccess();
    state.isLoggedIn = true;
    state.username = nickname;

    // 세션 정보 로컬 백업
    localStorage.setItem("weather_toto_session_username", nickname);
    
    document.getElementById("gate-overlay").style.display = "none";
    
    // 리더보드 순위표 갱신
    updateLocalLeaderboard();

    updateWalletUI();
    renderMarkets();
    saveState();
}

function checkLoginState() {
    const overlay = document.getElementById("gate-overlay");
    const loginBtn = document.getElementById("header-login-btn");
    const userInfo = document.getElementById("header-user-info");

    if (state.isLoggedIn) {
        if (overlay) overlay.style.display = "none";
        if (loginBtn) loginBtn.classList.add("hidden");
        if (userInfo) userInfo.classList.remove("hidden");
        
        // 새로고침 시 세션이 있으면 리스너 복구
        const savedUser = localStorage.getItem("weather_toto_session_username");
        if (savedUser && !state.username) {
            state.username = savedUser;
        }
        updateLocalLeaderboard();
    } else {
        if (overlay) overlay.style.display = "none"; // 강제 노출 해제
        if (loginBtn) loginBtn.classList.remove("hidden");
        if (userInfo) userInfo.classList.add("hidden");
    }
}

function openGateOverlay() {
    soundEffects.playClick();
    const overlay = document.getElementById("gate-overlay");
    if (overlay) overlay.style.display = "flex";
}

function closeGateOverlay() {
    soundEffects.playClick();
    const overlay = document.getElementById("gate-overlay");
    if (overlay) overlay.style.display = "none";
}

// 4-1. 로컬 유저 데이터베이스 기반의 리더보드 동기화 함수
function updateLocalLeaderboard() {
    let localUsers = {};
    const savedUsers = localStorage.getItem("weather_toto_local_users");
    if (savedUsers) {
        try {
            localUsers = JSON.parse(savedUsers);
        } catch (e) {
            localUsers = {};
        }
    }
    
    if (state.username) {
        if (!localUsers[state.username]) {
            localUsers[state.username] = {
                name: state.username,
                score: state.wallet
            };
        } else {
            localUsers[state.username].score = state.wallet;
        }
        localStorage.setItem("weather_toto_local_users", JSON.stringify(localUsers));
    }

    const dbUsers = [];
    for (const key in localUsers) {
        const u = localUsers[key];
        const isMe = u.name === state.username;
        dbUsers.push({
            name: isMe ? `나 (${u.name})` : u.name,
            score: u.score || 0,
            isUser: isMe
        });
    }

    if (dbUsers.length === 0 && state.username) {
        dbUsers.push({
            name: `나 (${state.username})`,
            score: state.wallet,
            isUser: true
        });
    }

    state.friends = dbUsers;
    renderLeaderboard();
}

// 4-2. 로컬에 저장되어 있는 pending 베팅 내역을 클라우드 정산 조건에 맞춰 즉시 정산 처리
function resolvePendingBetsLocally(correctKeys) {
    let userWinAmount = 0;
    let userWinCount = 0;
    let totalPendingBets = state.myBets.filter(b => b.status === "pending").length;

    state.myBets.forEach(bet => {
        if (bet.status !== "pending") return;

        if (correctKeys.includes(bet.optionKey)) {
            bet.status = "win";
            const prize = Math.floor(bet.stake * bet.oddValue);
            state.wallet += prize;
            userWinAmount += prize;
            userWinCount++;
        } else {
            bet.status = "loss";
        }
    });

    updateWalletUI();
    renderMyBets();
    syncWalletToCloud();

    if (totalPendingBets > 0) {
        if (userWinCount > 0) {
            showToast(`[실시간 정산 완료] 공식 관측 결과 정산 완료! +${userWinAmount.toLocaleString()} ₩ 지급!`, "success");
            soundEffects.playSuccess();
        } else {
            showToast(`[실시간 정산 완료] 공식 관측 결과가 발표되어 낙첨 정산 처리되었습니다.`, "error");
            soundEffects.playFail();
        }
    }
}

// 4-3. 지갑 스코어 Firestore 클라우드 동기화
async function syncWalletToCloud() {
    if (!window.db || !state.username) return;
    const { doc, updateDoc } = window.firestoreRefs;
    const userDocRef = doc(window.db, "users", state.username);
    try {
        await updateDoc(userDocRef, { score: state.wallet });
    } catch (e) {
        console.error("지갑 데이터 백업 실패", e);
    }
}

// 5. 충/환전 신청 프로세스 시뮬레이터
function openTransactionModal(type) {
    if (type === 'deposit') {
        showToast("충전 기능은 비활성화 상태입니다.", "error");
        return;
    }
    if (!state.isLoggedIn) {
        showToast("보안 로그인이 필요한 서비스입니다.", "error");
        openGateOverlay();
        soundEffects.playFail();
        return;
    }
    soundEffects.playClick();
    state.txType = type;
    state.txAmount = 0;

    const modal = document.getElementById("transaction-modal");
    const title = document.getElementById("tx-modal-title");
    const currentMoneyText = document.getElementById("tx-modal-current");
    const labelAmount = document.getElementById("tx-label-amount");
    const amountInput = document.getElementById("tx-amount-input");
    const btnSubmit = document.getElementById("btn-tx-submit");

    currentMoneyText.textContent = state.wallet.toLocaleString() + " ₩";
    amountInput.value = "";

    if (type === 'deposit') {
        title.innerHTML = '<i class="fa-solid fa-arrow-down-long text-emerald-400 mr-1.5"></i> 포인트 충전 신청';
        labelAmount.textContent = "충전 신청 포인트";
        btnSubmit.innerHTML = '충전 신청 완료 (DEPOSIT)';
        btnSubmit.className = "w-2/3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs transition flex items-center justify-center";
    } else {
        title.innerHTML = '<i class="fa-solid fa-arrow-up-long text-rose-400 mr-1.5"></i> 포인트 환전 신청';
        labelAmount.textContent = "환전 신청 포인트";
        btnSubmit.innerHTML = '환전 신청 완료 (WITHDRAW)';
        btnSubmit.className = "w-2/3 bg-rose-500 hover:bg-rose-400 text-white font-black py-2.5 rounded-xl text-xs transition flex items-center justify-center";
    }

    modal.classList.remove("hidden");
}

function closeTransactionModal() {
    soundEffects.playClick();
    document.getElementById("transaction-modal").classList.add("hidden");
}

function adjustTxAmount(amount) {
    soundEffects.playTick();
    const input = document.getElementById("tx-amount-input");
    let current = parseInt(input.value) || 0;
    current += amount;
    input.value = current;
    state.txAmount = current;
}

async function submitTransaction() {
    const input = document.getElementById("tx-amount-input");
    const amount = parseInt(input.value) || 0;

    if (amount < 10000) {
        showToast("최소 신청 가능 단위는 10,000 ₩ 입니다.", "error");
        soundEffects.playFail();
        return;
    }

    if (state.txType === 'withdraw' && amount > state.wallet) {
        showToast("보유 포인트 한도를 초과하여 환전 신청할 수 없습니다.", "error");
        soundEffects.playFail();
        return;
    }

    const btnSubmit = document.getElementById("btn-tx-submit");
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fa-solid fa-spinner animate-spin mr-1.5"></i> 승인 대기 중...';
    soundEffects.playTick();

    setTimeout(async () => {
        btnSubmit.disabled = false;
        
        if (state.txType === 'deposit') {
            state.wallet += amount;
            showToast(`[충전승인] 관리자 승인 완료! +${amount.toLocaleString()} ₩이 지갑에 입금되었습니다.`, "success");
            
            // Firestore transactions 컬렉션 기록 연계
            if (window.db && state.username) {
                try {
                    const { collection, addDoc } = window.firestoreRefs;
                    await addDoc(collection(window.db, "transactions"), {
                        user: state.username,
                        amount: amount,
                        type: 'deposit',
                        timestamp: new Date().getTime()
                    });
                } catch (e) {
                    console.error("거래 내역 클라우드 기록 실패", e);
                }
            }

            soundEffects.playSuccess();
            updateWalletUI();
            closeTransactionModal();
            saveState();
            syncWalletToCloud();
        } else {
            // 환전 신청 시 정직하게 환전 처리해주는 척 하다가 팝업으로 조롱하기
            closeTransactionModal();
            openMockModal();
        }
    }, 2500);
}

function openMockModal() {
    soundEffects.playFail();
    const mockModal = document.getElementById("mock-modal");
    if (mockModal) mockModal.classList.remove("hidden");
}

function closeMockModal() {
    soundEffects.playClick();
    const mockModal = document.getElementById("mock-modal");
    if (mockModal) mockModal.classList.add("hidden");
}


// 7. 윙 광고 배너 최소화 토글 기믹
function toggleBanner(side, minimize) {
    soundEffects.playClick();
    const wing = document.getElementById(`wing-${side}`);
    const toggleBtn = document.getElementById(`toggle-btn-${side}`);
    
    if (wing) {
        if (minimize) {
            wing.classList.add("minimized");
            if (toggleBtn) toggleBtn.style.display = "block";
        } else {
            wing.classList.remove("minimized");
            if (toggleBtn) toggleBtn.style.display = "none";
        }
    }
}

// 8. 모바일 플로팅 슬립 바 및 바텀 시트 토글
function openMobileSlipSheet() {
    if (!state.betSlip) return;
    soundEffects.playClick();
    
    const backdrop = document.getElementById("mobile-slip-backdrop");
    const sheet = document.getElementById("mobile-slip-sheet");
    
    if (backdrop) backdrop.style.display = "block";
    if (sheet) sheet.classList.add("active");
}

function closeMobileSlipSheet() {
    soundEffects.playClick();
    
    const backdrop = document.getElementById("mobile-slip-backdrop");
    const sheet = document.getElementById("mobile-slip-sheet");
    
    if (backdrop) backdrop.style.display = "none";
    if (sheet) sheet.classList.remove("active");
}

// 모바일 베팅 입력 조작 시 데스크탑 인풋 동기화
function syncMobileInputs() {
    const mobileInput = document.getElementById("m-bet-stake-input");
    const desktopInput = document.getElementById("bet-stake-input");
    
    if (mobileInput && desktopInput) {
        desktopInput.value = mobileInput.value;
    }
    calculatePayout();
}

function calculatePayoutMobile() {
    const mobileInput = document.getElementById("m-bet-stake-input");
    if (mobileInput) {
        let val = parseInt(mobileInput.value);
        if (isNaN(val) || val < 0) val = 0;
        state.stake = val;
    }
    
    const payoutText = document.getElementById("m-slip-estimated-payout");
    if (payoutText && state.betSlip) {
        const est = Math.floor(state.stake * state.betSlip.oddValue);
        payoutText.textContent = est.toLocaleString() + " ₩";
    }

    // 데스크탑 인풋 동기화
    const desktopInput = document.getElementById("bet-stake-input");
    if (desktopInput) desktopInput.value = state.stake;
}

// 9. 기상 사다리 미니게임 (Canvas & Loop Engine - 반응형 비례 연산 적용)
let ladderGame = {
    canvas: null,
    ctx: null,
    timer: 30,
    timerInterval: null,
    isAnimating: false,
    bets: [], 
    ladderData: null,
    init() {
        this.canvas = document.getElementById("ladderCanvas");
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext("2d");
        
        // 반응형 해상도 대응을 위한 Canvas 실제 픽셀 스케일 리사이즈
        this.resizeCanvas();
        this.startTimer();
        this.drawEmpty();
    },
    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timer = 30;
        const timerText = document.getElementById("ladder-timer-sec");
        if (timerText) timerText.textContent = this.timer;

        this.timerInterval = setInterval(() => {
            if (state.activeTab !== 'ladder') return;
            
            this.timer--;
            if (timerText) timerText.textContent = this.timer;

            if (this.timer <= 0) {
                this.runLadder();
                this.timer = 30;
            }
        }, 1000);
    },
    // 축척 비율 상수들
    getDimensions() {
        const w = this.canvas.width / window.devicePixelRatio;
        const h = this.canvas.height / window.devicePixelRatio;
        
        return {
            width: w,
            height: h,
            leftCol: w * 0.25,
            rightCol: w * 0.75,
            startY: h * 0.13,
            endY: h * 0.87,
            nodeRadius: Math.min(w, h) * 0.05,
            lineWidth: Math.max(2, Math.min(w, h) * 0.015)
        };
    },
    drawEmpty() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const d = this.getDimensions();

        ctx.clearRect(0, 0, d.width, d.height);

        // 뒷배경 모눈선
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.lineWidth = 1;
        for (let i = 20; i < d.width; i += 20) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, d.height); ctx.stroke();
        }
        for (let i = 20; i < d.height; i += 20) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(d.width, i); ctx.stroke();
        }

        // 세로 지탱 기둥 그리기
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = d.lineWidth * 1.5;
        ctx.lineCap = "round";

        ctx.beginPath(); ctx.moveTo(d.leftCol, d.startY); ctx.lineTo(d.leftCol, d.endY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(d.rightCol, d.startY); ctx.lineTo(d.rightCol, d.endY); ctx.stroke();

        // 출발 탑 노드
        ctx.fillStyle = "#1e293b";
        ctx.beginPath(); ctx.arc(d.leftCol, d.startY, d.nodeRadius, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(d.rightCol, d.startY, d.nodeRadius, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#94a3b8";
        ctx.font = `bold ${Math.max(10, d.nodeRadius * 0.65)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("좌", d.leftCol, d.startY);
        ctx.fillText("우", d.rightCol, d.startY);

        // 도착 하부 결과 구체
        ctx.fillStyle = "#1e293b";
        ctx.beginPath(); ctx.arc(d.leftCol, d.endY, d.nodeRadius, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(d.rightCol, d.endY, d.nodeRadius, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#ef4444"; // 짝
        ctx.beginPath(); ctx.arc(d.leftCol, d.endY, d.nodeRadius * 0.9, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#10b981"; // 홀
        ctx.beginPath(); ctx.arc(d.rightCol, d.endY, d.nodeRadius * 0.9, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle = "#000";
        ctx.fillText("짝", d.leftCol, d.endY);
        ctx.fillText("홀", d.rightCol, d.endY);
    },
    runLadder() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const start = Math.random() < 0.5 ? 'left' : 'right';
        const lines = Math.random() < 0.5 ? 3 : 4;

        let endSide = '';
        if (start === 'left') {
            endSide = lines === 3 ? 'right' : 'left';
        } else {
            endSide = lines === 3 ? 'left' : 'right';
        }
        const result = endSide === 'right' ? 'odd' : 'even';

        this.ladderData = { start, lines, result, endSide };
        
        let progress = 0;
        const steps = 180; 

        const animate = () => {
            progress += 2;
            this.drawAnimation(progress, steps);

            if (progress < steps) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.settleBets();
            }
        };

        soundEffects.playClick();
        animate();
    },
    drawAnimation(progress, steps) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const d = this.getDimensions();
        this.drawEmpty();

        // 가로줄 높이 비율 분할
        const unitHeight = (d.endY - d.startY);
        const lineHeights = this.ladderData.lines === 3 
            ? [d.startY + unitHeight * 0.25, d.startY + unitHeight * 0.5, d.startY + unitHeight * 0.75] 
            : [d.startY + unitHeight * 0.2, d.startY + unitHeight * 0.4, d.startY + unitHeight * 0.6, d.startY + unitHeight * 0.8];

        ctx.strokeStyle = "#475569";
        ctx.lineWidth = d.lineWidth;
        lineHeights.forEach(y => {
            ctx.beginPath();
            ctx.moveTo(d.leftCol, y);
            ctx.lineTo(d.rightCol, y);
            ctx.stroke();
        });

        // 진행 연적 추적 라인
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = d.lineWidth * 1.25;
        ctx.lineJoin = "round";
        ctx.beginPath();

        let currentX = this.ladderData.start === 'left' ? d.leftCol : d.rightCol;
        let currentY = d.startY;
        ctx.moveTo(currentX, currentY);

        let pathNodes = [{x: currentX, y: currentY}];
        lineHeights.forEach(y => {
            pathNodes.push({x: currentX, y: y});
            currentX = currentX === d.leftCol ? d.rightCol : d.leftCol;
            pathNodes.push({x: currentX, y: y});
        });
        pathNodes.push({x: currentX, y: d.endY});

        const totalPathLength = pathNodes.length - 1;
        const currentSegment = Math.floor((progress / steps) * totalPathLength);
        const segmentProgress = ((progress / steps) * totalPathLength) - currentSegment;

        for (let i = 0; i <= currentSegment; i++) {
            ctx.lineTo(pathNodes[i].x, pathNodes[i].y);
        }

        if (currentSegment < totalPathLength) {
            const nextNode = pathNodes[currentSegment + 1];
            const prevNode = pathNodes[currentSegment];
            const interpX = prevNode.x + (nextNode.x - prevNode.x) * segmentProgress;
            const interpY = prevNode.y + (nextNode.y - prevNode.y) * segmentProgress;
            ctx.lineTo(interpX, interpY);

            ctx.fillStyle = "#eab308";
            ctx.beginPath();
            ctx.arc(interpX, interpY, d.nodeRadius * 0.5, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowColor = "#eab308";
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.lineTo(pathNodes[totalPathLength].x, pathNodes[totalPathLength].y);
            ctx.stroke();

            // 적중 발광 원형
            ctx.fillStyle = this.ladderData.result === 'odd' ? "#10b981" : "#ef4444";
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(currentX, d.endY, d.nodeRadius * 1.1, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = "#000";
            ctx.font = `bold ${Math.max(11, d.nodeRadius * 0.7)}px Noto Sans KR`;
            ctx.fillText(this.ladderData.result === 'odd' ? "홀" : "짝", currentX, d.endY);
        }
        ctx.stroke();
    },
    settleBets() {
        const data = this.ladderData;
        const resultText = `[사다리 정산] 출발: ${data.start === 'left' ? '좌' : '우'} | 줄수: ${data.lines}줄 | 결과: ${data.result === 'odd' ? '홀' : '짝'}`;

        let totalWin = 0;
        this.bets.forEach(b => {
            let isWin = false;
            if (b.choice === data.start) isWin = true;
            else if (b.choice === `line${data.lines}`) isWin = true;
            else if (b.choice === data.result) isWin = true;

            if (isWin) {
                const prize = Math.floor(b.stake * 1.95);
                state.wallet += prize;
                totalWin += prize;
            }
        });

        if (this.bets.length > 0) {
            if (totalWin > 0) {
                showToast(`${resultText} -> 축하합니다! 총 +${totalWin.toLocaleString()} ₩ 획득!`, "success");
                soundEffects.playSuccess();
            } else {
                showToast(`${resultText} -> 아쉽게도 낙첨되었습니다.`, "error");
                soundEffects.playFail();
            }
        } else {
            showToast(`${resultText} (참여한 베팅 없음)`, "info");
        }

        this.bets = [];
        updateWalletUI();
        renderLeaderboard();
        saveState();

        setTimeout(() => {
            if (state.activeTab === 'ladder') {
                this.drawEmpty();
            }
        }, 2000);
    },
    placeLadderBet(choice, stake) {
        if (!state.isLoggedIn) {
            showToast("보안 로그인이 필요한 서비스입니다.", "error");
            openGateOverlay();
            soundEffects.playFail();
            return;
        }
        if (state.wallet < stake) {
            showToast("보유 포인트가 부족합니다.", "error");
            soundEffects.playFail();
            return;
        }

        state.wallet -= stake;
        this.bets.push({ choice, stake });
        
        updateWalletUI();
        renderLeaderboard();
        showToast(`사다리 미니게임 [${choice === 'left'?'좌출':choice === 'right'?'우출':choice === 'line3'?'3줄':choice === 'line4'?'4줄':choice==='odd'?'홀':'짝'}] 에 ${stake.toLocaleString()}₩ 베팅 완료!`, "success");
        soundEffects.playClick();
        saveState();
    }
};

// 10. 기상 사다리 탭 렌더링 오버라이드
function renderLadderUI() {
    const container = document.getElementById("markets-container");
    if (!container) return;

    container.innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-5 shadow-lg">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
                <div class="space-y-1">
                    <h3 class="font-extrabold text-base text-slate-100 flex items-center">
                        <i class="fa-solid fa-cloud-showers-heavy text-cyan-400 mr-2 animate-bounce"></i> 
                        🔥 [초고속 수익 마켓] 삼척 30초 구름 사다리 (실시간 1.95배)
                    </h3>
                    <p class="text-xs text-slate-500 font-semibold font-mono text-rose-500">💥 단 30초 만에 2배 수익 달성 찬스! 롤링 제재 없음 / 마틴·루틴 무제한</p>
                </div>
                <div class="bg-red-950 border border-red-800 text-rose-400 font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 self-stretch sm:self-auto justify-center">
                    <i class="fa-solid fa-hourglass-half animate-spin"></i>
                    <span>배팅마감: </span>
                    <span id="ladder-timer-sec" class="w-6 text-center font-mono">30</span>초
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <!-- 사다리 Canvas 영역 -->
                <div class="ladder-canvas-container">
                    <canvas id="ladderCanvas"></canvas>
                </div>

                <!-- 사다리 베팅 옵션 보드 -->
                <div class="space-y-4">
                    <div class="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs leading-relaxed text-slate-400 font-mono">
                        <span class="font-extrabold text-yellow-500"><i class="fa-solid fa-coins mr-1"></i> [수익 찬스]:</span><br>
                        30초마다 즉시 추첨되어 고속으로 자금을 복리 불릴 수 있는 최고 효율의 핵심 수익 수단.
                    </div>

                    <div class="space-y-2.5">
                        <span class="text-xs font-bold text-slate-400 block"><i class="fa-solid fa-play text-red-500 mr-1"></i> 출발선 (1.95배)</span>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="selectLadderBetOption('left')" class="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl text-slate-300 active:scale-95 transition min-h-[44px] flex items-center justify-center">
                                👈 좌출발 (LEFT)
                            </button>
                            <button onclick="selectLadderBetOption('right')" class="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl text-slate-300 active:scale-95 transition min-h-[44px] flex items-center justify-center">
                                👉 우출발 (RIGHT)
                            </button>
                        </div>

                        <span class="text-xs font-bold text-slate-400 block pt-1"><i class="fa-solid fa-list-ol text-cyan-500 mr-1"></i> 줄 개수 (1.95배)</span>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="selectLadderBetOption('line3')" class="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl text-slate-300 active:scale-95 transition min-h-[44px] flex items-center justify-center">
                                ☰ 3줄 다리 (3 LINES)
                            </button>
                            <button onclick="selectLadderBetOption('line4')" class="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-bold rounded-xl text-slate-300 active:scale-95 transition min-h-[44px] flex items-center justify-center">
                                ☷ 4줄 다리 (4 LINES)
                            </button>
                        </div>

                        <span class="text-xs font-bold text-slate-400 block pt-1"><i class="fa-solid fa-trophy text-yellow-500 mr-1"></i> 최종결과 홀짝 (1.95배)</span>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="selectLadderBetOption('odd')" class="p-3 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-800 text-xs font-extrabold rounded-xl text-emerald-400 active:scale-95 transition min-h-[44px] flex items-center justify-center">
                                🟢 홀 (ODD)
                            </button>
                            <button onclick="selectLadderBetOption('even')" class="p-3 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-800 text-xs font-extrabold rounded-xl text-rose-400 active:scale-95 transition min-h-[44px] flex items-center justify-center">
                                🔴 짝 (EVEN)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        ladderGame.init();
    }, 50);
}

function selectLadderBetOption(choice) {
    soundEffects.playClick();
    
    let optionName = "";
    if (choice === 'left') optionName = "👈 좌출발 (LEFT)";
    else if (choice === 'right') optionName = "👉 우출발 (RIGHT)";
    else if (choice === 'line3') optionName = "☰ 3줄 다리 (3 LINES)";
    else if (choice === 'line4') optionName = "☷ 4줄 다리 (4 LINES)";
    else if (choice === 'odd') optionName = "🟢 홀 (ODD)";
    else if (choice === 'even') optionName = "🔴 짝 (EVEN)";

    state.betSlip = {
        marketId: "ladder-minigame",
        optionId: choice,
        name: optionName,
        oddValue: 1.95,
        optionKey: choice,
        marketTitle: "삼척 구름 사다리 미니게임"
    };

    state.stake = 10000;
    updateBetSlipUI();
}

function switchMarketTab(tabId) {
    soundEffects.playClick();
    state.activeTab = tabId;

    document.querySelectorAll(".market-tab").forEach(btn => {
        const id = btn.id;
        if (id === `tab-${tabId}`) {
            btn.className = "market-tab px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-emerald-500 text-slate-950 transition";
        } else {
            btn.className = "market-tab px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition";
        }
    });

    if (tabId === 'ladder') {
        renderLadderUI();
    } else {
        renderMarkets();
    }
}

// 11. 슬립 업데이트 (PC 및 모바일 양방향 지원)
function updateBetSlipUI() {
    const emptySlip = document.getElementById("bet-slip-empty");
    const footerSlip = document.getElementById("bet-slip-footer");
    const content = document.getElementById("bet-slip-content");
    const slipCount = document.getElementById("slip-count");
    
    // 모바일 슬립 바 및 모달 시트 바인딩
    const mBar = document.getElementById("mobile-slip-bar");
    const mCount = document.getElementById("m-slip-count");
    const mTitle = document.getElementById("m-slip-title");
    const mOdd = document.getElementById("m-slip-odd");
    const mContent = document.getElementById("m-slip-content");

    if (!state.betSlip) {
        // PC 리셋
        if (emptySlip) emptySlip.style.display = "block";
        if (footerSlip) footerSlip.classList.add("hidden");
        if (slipCount) slipCount.textContent = "0";
        if (content) {
            content.innerHTML = "";
            if (emptySlip) content.appendChild(emptySlip);
        }

        // 모바일 리셋
        if (mBar) mBar.classList.remove("visible");
        if (mCount) mCount.textContent = "0";
        if (mTitle) mTitle.textContent = "선택된 예측 항목이 없습니다";
        if (mOdd) mOdd.textContent = "0.00 배";
        if (mContent) mContent.innerHTML = '<p class="text-xs text-slate-500 text-center py-6">선택된 예측이 없습니다.</p>';

        syncSelectedClass();
        return;
    }

    // PC 슬립 드로잉
    if (emptySlip) emptySlip.style.display = "none";
    if (footerSlip) footerSlip.classList.remove("hidden");
    if (slipCount) slipCount.textContent = "1";

    if (content) {
        content.innerHTML = `
            <div class="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center relative">
                <div class="space-y-1">
                    <span class="text-[9px] font-bold text-slate-500 uppercase">${state.betSlip.marketTitle}</span>
                    <div class="font-extrabold text-xs text-white">${state.betSlip.name}</div>
                </div>
                <div class="text-right pr-4">
                    <span class="text-xs text-slate-500 block">적용배당</span>
                    <span class="font-black text-sm text-emerald-400">${state.betSlip.oddValue.toFixed(2)}</span>
                </div>
                <button onclick="clearBetSlip()" class="absolute top-2 right-2 text-slate-600 hover:text-rose-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <i class="fa-solid fa-xmark text-xs"></i>
                </button>
            </div>
        `;
    }

    const stakeInput = document.getElementById("bet-stake-input");
    if (stakeInput) stakeInput.value = state.stake;
    const finalOdd = document.getElementById("slip-final-odd");
    if (finalOdd) finalOdd.textContent = state.betSlip.oddValue.toFixed(2);

    // 모바일 슬립 바 드로잉
    if (mBar) mBar.classList.add("visible");
    if (mCount) mCount.textContent = "1";
    if (mTitle) mTitle.textContent = state.betSlip.name;
    if (mOdd) mOdd.textContent = state.betSlip.oddValue.toFixed(2) + " 배";

    // 모바일 시트 컨텐츠 렌더링
    if (mContent) {
        mContent.innerHTML = `
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center relative">
                <div class="space-y-1">
                    <span class="text-[9px] font-bold text-slate-500 uppercase">${state.betSlip.marketTitle}</span>
                    <div class="font-extrabold text-xs text-white">${state.betSlip.name}</div>
                </div>
                <div class="text-right">
                    <span class="text-xs text-slate-500 block">적용배당</span>
                    <span class="font-black text-sm text-emerald-400">${state.betSlip.oddValue.toFixed(2)}</span>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <div class="flex justify-between items-center text-xs text-slate-400 mb-1.5">
                        <span>베팅 포인트 입력</span>
                        <span class="text-slate-500">최소 1,000₩ | <button onclick="setStakeMax(); syncMobileInputs();" class="text-emerald-400 font-bold hover:underline min-h-[44px] min-w-[44px] inline-flex items-center justify-center">올인</button></span>
                    </div>
                    <div class="relative bg-slate-950 border border-slate-850 rounded-xl p-2 flex items-center justify-between focus-within:border-emerald-500 transition">
                        <input type="number" id="m-bet-stake-input" oninput="calculatePayoutMobile()" class="bg-transparent border-0 outline-none text-right font-extrabold text-lg text-emerald-400 w-full pr-2 min-h-[44px]" value="${state.stake}">
                        <span class="text-sm font-bold text-slate-400 pl-1 border-l border-slate-850">₩</span>
                    </div>
                    <div class="grid grid-cols-4 gap-1 mt-2">
                        <button onclick="adjustStake(10000); syncMobileInputs();" class="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] font-bold py-2 rounded-lg transition min-h-[44px] flex items-center justify-center">+1만</button>
                        <button onclick="adjustStake(50000); syncMobileInputs();" class="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] font-bold py-2 rounded-lg transition min-h-[44px] flex items-center justify-center">+5만</button>
                        <button onclick="adjustStake(100000); syncMobileInputs();" class="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] font-bold py-2 rounded-lg transition min-h-[44px] flex items-center justify-center">+10만</button>
                        <button onclick="adjustStake(500000); syncMobileInputs();" class="bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] font-bold py-2 rounded-lg transition min-h-[44px] flex items-center justify-center">+50만</button>
                    </div>
                </div>
                <div class="bg-slate-950 rounded-xl p-3 border border-slate-850 space-y-2">
                    <div class="flex justify-between items-center text-xs text-slate-400">
                        <span>적용 배당률</span>
                        <span class="font-bold text-white text-base">${state.betSlip.oddValue.toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-slate-400">
                        <span>예상 배당금 (적중 시)</span>
                        <span id="m-slip-estimated-payout" class="font-extrabold text-emerald-400 text-lg">${Math.floor(state.stake * state.betSlip.oddValue).toLocaleString()} ₩</span>
                    </div>
                </div>
                <button onclick="placeBet(); closeMobileSlipSheet();" class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-950/30 transition transform duration-150 active:scale-[0.98] flex items-center justify-center space-x-2 min-h-[44px]">
                    <i class="fa-solid fa-signature"></i> <span>베팅 완료 (PLACE BET)</span>
                </button>
            </div>
        `;
    }

    calculatePayout();
    syncSelectedClass();
}

function syncSelectedClass() {
    document.querySelectorAll('[id^="btn-opt-"]').forEach(btn => {
        const optId = btn.id.replace('btn-', '');
        if (state.betSlip && state.betSlip.optionId === optId) {
            btn.className = "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition duration-200 active:scale-95 bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20";
            const numSpan = btn.querySelector('span:last-child');
            if (numSpan) {
                numSpan.classList.remove('text-emerald-400');
                numSpan.classList.add('text-slate-950');
            }
        } else {
            btn.className = "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition duration-200 active:scale-95 bg-slate-950/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300";
            const numSpan = btn.querySelector('span:last-child');
            if (numSpan) {
                numSpan.classList.remove('text-slate-950');
                numSpan.classList.add('text-emerald-400');
            }
        }
    });
}

function placeBet() {
    if (!state.isLoggedIn) {
        showToast("보안 로그인이 필요한 서비스입니다.", "error");
        openGateOverlay();
        soundEffects.playFail();
        return;
    }
    if (!state.betSlip) return;

    if (state.stake < 1000) {
        showToast("최소 베팅 금액은 1,000 ₩ 입니다.", "error");
        soundEffects.playFail();
        return;
    }

    if (state.stake > state.wallet) {
        showToast("포인트가 부족하여 베팅을 완료할 수 없습니다.", "error");
        soundEffects.playFail();
        return;
    }

    if (state.betSlip.marketId === "ladder-minigame") {
        ladderGame.placeLadderBet(state.betSlip.optionId, state.stake);
        state.betSlip = null;
        state.stake = 0;
        updateBetSlipUI();
        return;
    }

    state.wallet -= state.stake;
    const newBet = {
        id: "bet_" + Date.now(),
        marketId: state.betSlip.marketId,
        optionId: state.betSlip.optionId,
        marketTitle: state.betSlip.marketTitle,
        optionName: state.betSlip.name,
        optionKey: state.betSlip.optionKey,
        oddValue: state.betSlip.oddValue,
        stake: state.stake,
        status: "pending"
    };

    state.myBets.push(newBet);
    
    updateWalletUI();
    renderLeaderboard();
    renderMyBets();
    showToast(`베팅 완료! [${newBet.optionName}] 에 ${newBet.stake.toLocaleString()} ₩ 베팅되었습니다.`, "success");
    soundEffects.playSuccess();

    state.betSlip = null;
    state.stake = 0;
    
    renderMarkets();
    updateBetSlipUI();
    saveState();
    syncWalletToCloud();
}

// 12. 기존 나머지 비즈니스 로직 유지

function updateWalletUI() {
    const balText = document.getElementById("user-balance");
    if (balText) balText.textContent = state.wallet.toLocaleString() + " ₩";
    
    const userIdx = state.friends.findIndex(f => f.isUser);
    if (userIdx !== -1) {
        state.friends[userIdx].score = state.wallet;
    }
}

function renderLeaderboard() {
    const leaderboardList = document.getElementById("leaderboard-list");
    if (!leaderboardList) return;

    const sortedFriends = [...state.friends].sort((a, b) => b.score - a.score);
    leaderboardList.innerHTML = "";

    sortedFriends.forEach((friend, idx) => {
        const item = document.createElement("div");
        const isMe = friend.isUser;
        item.className = `flex items-center justify-between p-2.5 rounded-xl border text-xs transition duration-200 ${
            isMe 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold" 
            : "bg-slate-950/60 border-slate-800 text-slate-300"
        }`;

        let medal = "";
        if (idx === 0) medal = "🥇";
        else if (idx === 1) medal = "🥈";
        else if (idx === 2) medal = "🥉";
        else medal = `<span class="text-slate-500 font-extrabold w-4 text-center">${idx + 1}</span>`;

        item.innerHTML = `
            <div class="flex items-center space-x-2">
                ${medal}
                <span>${friend.name}</span>
            </div>
            <span class="font-extrabold text-slate-100">${friend.score.toLocaleString()} ₩</span>
        `;
        leaderboardList.appendChild(item);
    });
}

function renderMarkets() {
    const container = document.getElementById("markets-container");
    if (!container) return;

    container.innerHTML = "";
    const filtered = state.markets.filter(m => state.activeTab === "all" || m.category === state.activeTab);

    filtered.forEach(market => {
        const card = document.createElement("div");
        card.className = "bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-lg";

        const header = document.createElement("div");
        header.className = "flex justify-between items-start";
        header.innerHTML = `
            <div class="space-y-1">
                <h3 class="font-extrabold text-sm md:text-base text-slate-200">${market.title}</h3>
                <p class="text-xs text-slate-500 font-medium">${market.description}</p>
            </div>
            <span class="bg-slate-950 border border-slate-800 text-slate-400 font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase">
                ${market.category === 'main' ? '기상상태' : market.category === 'temp' ? '기온' : market.category === 'rain' ? '강수량' : '풍속'}
            </span>
        `;
        card.appendChild(header);

        const optionsGrid = document.createElement("div");
        optionsGrid.className = "grid grid-cols-2 sm:grid-cols-4 gap-2";

        market.odds.forEach(opt => {
            const isSelected = state.betSlip && state.betSlip.optionId === opt.id;
            const btn = document.createElement("button");
            btn.id = `btn-${opt.id}`;
            btn.onclick = () => selectBetOption(market.id, opt.id);
            btn.className = `flex flex-col items-center justify-center p-3 rounded-xl border text-center transition duration-200 active:scale-95 min-h-[44px] ${
                isSelected 
                ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20" 
                : "bg-slate-950/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-slate-300"
            }`;

            btn.innerHTML = `
                <span class="text-[10px] font-bold block mb-1 opacity-70">${opt.name}</span>
                <span class="font-black text-sm tracking-wider ${isSelected ? 'text-slate-950' : 'text-emerald-400'}">${opt.value.toFixed(2)}</span>
            `;
            optionsGrid.appendChild(btn);
        });

        card.appendChild(optionsGrid);
        container.appendChild(card);
    });
}

function renderMyBets() {
    const container = document.getElementById("my-bets-container");
    const emptyView = document.getElementById("my-bets-empty");
    const countBadge = document.getElementById("my-bets-count");

    if (!container) return;

    const pendingCount = state.myBets.filter(b => b.status === "pending").length;
    if (countBadge) countBadge.textContent = pendingCount;

    if (state.myBets.length === 0) {
        if (emptyView) emptyView.style.display = "block";
        container.innerHTML = "";
        if (emptyView) container.appendChild(emptyView);
        return;
    }

    if (emptyView) emptyView.style.display = "none";
    container.innerHTML = "";

    [...state.myBets].reverse().forEach(bet => {
        const item = document.createElement("div");
        item.className = `bg-slate-950 border p-3 rounded-xl flex flex-col space-y-2 text-xs border-slate-800`;

        let statusBadge = "";
        if (bet.status === "pending") {
            statusBadge = `<span class="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold px-1.5 py-0.5 rounded text-[10px]">판정대기</span>`;
        } else if (bet.status === "win") {
            statusBadge = `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.5 rounded text-[10px]">적중 [당첨]</span>`;
        } else {
            statusBadge = `<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-1.5 py-0.5 rounded text-[10px]">낙첨</span>`;
        }

        const payoutText = bet.status === "win" 
            ? `<span class="font-extrabold text-emerald-400">+${Math.floor(bet.stake * bet.oddValue).toLocaleString()} ₩</span>`
            : bet.status === "loss" ? `<span class="font-bold text-slate-500">0 ₩</span>`
            : `<span class="font-bold text-slate-300">${Math.floor(bet.stake * bet.oddValue).toLocaleString()} ₩ (예상)</span>`;

        item.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-black text-slate-200 text-[11px] truncate max-w-[180px]">${bet.marketTitle}</span>
                ${statusBadge}
            </div>
            <div class="flex justify-between text-[11px] text-slate-400">
                <span>예측: <span class="font-bold text-white">${bet.optionName}</span></span>
                <span>배당률: <span class="font-bold text-emerald-400">${bet.oddValue.toFixed(2)}</span></span>
            </div>
            <div class="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-900">
                <span class="text-slate-500">베팅액: <span class="font-bold text-slate-300">${bet.stake.toLocaleString()} ₩</span></span>
                <span>지급액: ${payoutText}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

function selectBetOption(marketId, optionId) {
    soundEffects.playClick();
    const market = state.markets.find(m => m.id === marketId);
    const option = market.odds.find(o => o.id === optionId);

    if (state.betSlip && state.betSlip.optionId === optionId) {
        state.betSlip = null;
    } else {
        state.betSlip = {
            marketId: marketId,
            optionId: optionId,
            name: option.name,
            oddValue: option.value,
            optionKey: option.key,
            marketTitle: market.title.split(') ')[1] || market.title
        };
        state.stake = 10000;
    }

    renderMarkets();
    updateBetSlipUI();
}

function adjustStake(amount) {
    soundEffects.playTick();
    state.stake += amount;
    if (state.wallet > 0 && state.stake > state.wallet) {
        state.stake = state.wallet;
    }
    
    const stakeInput = document.getElementById("bet-stake-input");
    if (stakeInput) stakeInput.value = state.stake;
    calculatePayout();
}

function setStakeMax() {
    soundEffects.playTick();
    state.stake = state.wallet;
    const stakeInput = document.getElementById("bet-stake-input");
    if (stakeInput) stakeInput.value = state.stake;
    calculatePayout();
}

function calculatePayout() {
    const stakeInput = document.getElementById("bet-stake-input");
    if (stakeInput) {
        let val = parseInt(stakeInput.value);
        if (isNaN(val) || val < 0) val = 0;
        state.stake = val;
    }

    const estimatedPayout = document.getElementById("slip-estimated-payout");
    if (estimatedPayout && state.betSlip) {
        const est = Math.floor(state.stake * state.betSlip.oddValue);
        estimatedPayout.textContent = est.toLocaleString() + " ₩";
    }
}

function clearBetSlip() {
    soundEffects.playClick();
    state.betSlip = null;
    state.stake = 0;
    
    if (state.activeTab === 'ladder') {
        renderLadderUI();
    } else {
        renderMarkets();
    }
    updateBetSlipUI();
}

function resolveSimulationBets() {
    soundEffects.playClick();

    const outWeather = document.getElementById("sim-weather").value;
    const outTemp = document.getElementById("sim-temp").value;
    const outRain = document.getElementById("sim-rain").value;
    const outWind = document.getElementById("sim-wind").value;

    const correctKeys = [outWeather, outTemp, outRain, outWind];

    let userWinAmount = 0;
    let userWinCount = 0;
    let totalPendingBets = state.myBets.filter(b => b.status === "pending").length;

    state.myBets.forEach(bet => {
        if (bet.status !== "pending") return;

        if (correctKeys.includes(bet.optionKey)) {
            bet.status = "win";
            const prize = Math.floor(bet.stake * bet.oddValue);
            state.wallet += prize;
            userWinAmount += prize;
            userWinCount++;
        } else {
            bet.status = "loss";
        }
    });

    updateWalletUI();
    renderLeaderboard();
    renderMyBets();

    if (totalPendingBets > 0) {
        if (userWinCount > 0) {
            showToast(`[정산 완료] 기상청 정산 발표! 총 ${totalPendingBets}건 중 ${userWinCount}건 적중! +${userWinAmount.toLocaleString()} ₩ 지급!`, "success");
            soundEffects.playSuccess();
        } else {
            showToast(`[정산 완료] 7월 17일 삼척 기상 이변 발생! 모든 베팅이 낙첨되었습니다. (미적중)`, "error");
            soundEffects.playFail();
        }
    } else {
        showToast("정산이 완료되었습니다. (참여한 베팅 없음)", "info");
    }

    saveState();
    syncWalletToCloud();

    if (window.db) {
        const { doc, setDoc } = window.firestoreRefs;
        setDoc(doc(window.db, "system", "state"), {
            correctKeys: correctKeys,
            resolvedId: "res_" + Date.now()
        }).catch(err => console.error("공식 정산 클라우드 배포 에러", err));
    }
}

function updateOddsPeriodically() {
    if (state.activeTab === 'ladder') return;

    const market = state.markets[Math.floor(Math.random() * state.markets.length)];
    const option = market.odds[Math.floor(Math.random() * market.odds.length)];

    const isUp = Math.random() < 0.5;
    const delta = isUp ? 0.05 + Math.random() * 0.15 : -(0.05 + Math.random() * 0.10);

    const oldVal = option.value;
    let newVal = oldVal + delta;

    if (newVal < 1.1) newVal = 1.1;
    if (newVal > 25.0) newVal = 25.0;

    option.value = parseFloat(newVal.toFixed(2));

    renderMarkets();

    const btn = document.getElementById(`btn-${option.id}`);
    if (btn) {
        const flashClass = isUp ? "odd-up-flash" : "odd-down-flash";
        btn.classList.add(flashClass);
        setTimeout(() => {
            btn.classList.remove(flashClass);
        }, 800);
    }

    if (state.betSlip && state.betSlip.optionId === option.id) {
        state.betSlip.oddValue = option.value;
        updateBetSlipUI();
    }
}

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `flex items-center space-x-3 bg-slate-900 border text-xs px-4 py-3 rounded-xl shadow-2xl transition duration-300 transform translate-y-4 opacity-0 pointer-events-auto ${
        type === "success" 
        ? "border-emerald-500/40 text-emerald-400 bg-slate-900/90" 
        : type === "error" 
        ? "border-rose-500/40 text-rose-400 bg-slate-900/90" 
        : "border-slate-800 text-slate-200 bg-slate-900/90"
    }`;

    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === "success") icon = '<i class="fa-solid fa-circle-check text-emerald-400"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-exclamation text-rose-400"></i>';

    toast.innerHTML = `
        ${icon}
        <span class="font-bold">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove("translate-y-4", "opacity-0");
    }, 10);

    setTimeout(() => {
        toast.classList.add("translate-y-4", "opacity-0");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// 13. 초기화 프로세스
window.addEventListener("DOMContentLoaded", () => {
    loadState();
    checkLoginState();

    if (state.isLoggedIn) {
        updateWalletUI();
        renderLeaderboard();
        renderMarkets();
        renderMyBets();
        fetchRealSamcheokWeather(); // 실제 기상 데이터 최초 연동
    }

    setInterval(updateOddsPeriodically, 4000);

    // 모바일 윈도우 크기 변경 시 Canvas 리사이즈 리스너 연동
    window.addEventListener("resize", () => {
        if (state.activeTab === 'ladder' && ladderGame.canvas) {
            ladderGame.resizeCanvas();
            ladderGame.drawEmpty();
        }
    });
});

// 14. 실제 기상청 관측 데이터(Open-Meteo API Key-free) 실시간 연동 로직
let cachedRealWeatherData = null;

async function fetchRealSamcheokWeather() {
    const tempEl = document.getElementById("real-temp");
    const rainEl = document.getElementById("real-rain");
    const windEl = document.getElementById("real-wind");
    const summaryEl = document.getElementById("real-summary");

    if (summaryEl) summaryEl.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> 로딩';

    try {
        const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=37.449&longitude=129.165&daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max,weather_code&timezone=Asia%2FSeoul&start_date=2026-07-17&end_date=2026-07-17");
        if (!response.ok) throw new Error("Weather API Network error");
        
        const data = await response.json();
        const daily = data.daily;
        
        const temp = daily.temperature_2m_max[0];
        const rain = daily.precipitation_sum[0];
        const windKmh = daily.wind_speed_10m_max[0];
        const wind = parseFloat((windKmh / 3.6).toFixed(1)); // m/s 단위로 튜닝
        const code = daily.weather_code[0];

        // WMO 날씨 코드 규격 연동
        let statusText = "맑음";
        let statusKey = "sunny";

        if (code === 0) {
            statusText = "맑음";
            statusKey = "sunny";
        } else if (code >= 1 && code <= 3) {
            statusText = "흐림";
            statusKey = "cloudy";
        } else if (code >= 51 && code <= 67) {
            statusText = "비";
            statusKey = "rainy";
        } else if (code >= 71 && code <= 86) {
            statusText = "흐림";
            statusKey = "cloudy";
        } else if (code >= 95 && code <= 99) {
            statusText = "폭우/낙뢰";
            statusKey = "storm";
        } else {
            statusText = "흐림";
            statusKey = "cloudy";
        }

        if (tempEl) tempEl.textContent = `${temp.toFixed(1)}°C`;
        if (rainEl) rainEl.textContent = `${rain.toFixed(1)}mm`;
        if (windEl) windEl.textContent = `${wind}m/s`;
        if (summaryEl) summaryEl.textContent = statusText;

        cachedRealWeatherData = { temp, rain, wind, statusKey, statusText };
    } catch (e) {
        console.error(e);
        if (summaryEl) summaryEl.textContent = "연동 실패";
    }
}

async function resolveRealWeatherBets() {
    soundEffects.playClick();
    
    if (!cachedRealWeatherData) {
        showToast("실시간 삼척 기상 API 데이터를 조회하는 중...", "info");
        await fetchRealSamcheokWeather();
    }

    if (!cachedRealWeatherData) {
        showToast("기상 API 수신 실패. 정산을 진행할 수 없습니다.", "error");
        soundEffects.playFail();
        return;
    }

    const weather = cachedRealWeatherData;

    // 기온 기준: 29.0°C 초과 시 over29, 이하면 under29
    const tempKey = weather.temp > 29.0 ? "over29" : "under29";
    
    // 강수량 기준: 비 안옴 norain, 10mm 이하 under10, 10mm 초과 over10
    let rainKey = "norain";
    if (weather.rain > 0.0 && weather.rain <= 10.0) {
        rainKey = "under10";
    } else if (weather.rain > 10.0) {
        rainKey = "over10";
    }

    // 풍속 기준: 5.0m/s 초과 시 over5, 이하면 under5
    const windKey = weather.wind > 5.0 ? "over5" : "under5";

    const correctKeys = [weather.statusKey, tempKey, rainKey, windKey];

    let userWinAmount = 0;
    let userWinCount = 0;
    let totalPendingBets = state.myBets.filter(b => b.status === "pending").length;

    state.myBets.forEach(bet => {
        if (bet.status !== "pending") return;

        if (correctKeys.includes(bet.optionKey)) {
            bet.status = "win";
            const prize = Math.floor(bet.stake * bet.oddValue);
            state.wallet += prize;
            userWinAmount += prize;
            userWinCount++;
        } else {
            bet.status = "loss";
        }
    });

    updateWalletUI();
    renderLeaderboard();
    renderMyBets();

    if (totalPendingBets > 0) {
        if (userWinCount > 0) {
            showToast(`[실제 정산] 기상청 API 정산 완료! ${totalPendingBets}건 중 ${userWinCount}건 적중! +${userWinAmount.toLocaleString()} ₩ 지급!`, "success");
            soundEffects.playSuccess();
        } else {
            showToast(`[실제 정산] 기상 관측 결과 미적중. (실제 기온: ${weather.temp}°C / 강수: ${weather.rain}mm / 풍속: ${weather.wind}m/s)`, "error");
            soundEffects.playFail();
        }
    } else {
        showToast(`[실제 정산 완료] API 정정 완료. (삼척 기온: ${weather.temp}°C / 강수: ${weather.rain}mm / 풍속: ${weather.wind}m/s)`, "info");
    }

    saveState();
    syncWalletToCloud();

    if (window.db) {
        const { doc, setDoc } = window.firestoreRefs;
        setDoc(doc(window.db, "system", "state"), {
            correctKeys: correctKeys,
            resolvedId: "res_" + Date.now()
        }).catch(err => console.error("공식 정산 클라우드 배포 에러", err));
    }
}

// 15. 실시간 라이브 채팅 제어 함수
async function sendChatMessage() {
    const input = document.getElementById("chat-input");
    if (!input) return;
    const txt = input.value.trim();
    if (!txt) return;

    if (!state.isLoggedIn || !state.username) {
        showToast("보안 접속 로그인 완료 후 이용 가능합니다.", "error");
        return;
    }

    if (window.db) {
        const { collection, addDoc } = window.firestoreRefs;
        try {
            await addDoc(collection(window.db, "chats"), {
                user: state.username,
                message: txt,
                timestamp: new Date().getTime(),
                timeStr: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
            });
            input.value = "";
        } catch (e) {
            console.error("채팅 메시지 클라우드 발송 실패", e);
            showToast("채팅 전송 실패.", "error");
        }
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// 16. 보안 세션 로그아웃 해제 함수
function logout() {
    soundEffects.playClick();
    localStorage.removeItem("weather_toto_session_username");
    state.isLoggedIn = false;
    state.username = null;
    
    // 로컬 베팅 및 지갑 캐시 데이터 초기화
    localStorage.removeItem("weather_toto_state");
    
    showToast("보안 세션이 해제되었습니다. 1초 후 새로고침됩니다.", "success");
    
    setTimeout(() => {
        window.location.reload();
    }, 1200);
}
