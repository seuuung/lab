// ============================================================================
// 섀도우 퍼즐 (Shadow Puzzle) - 18개 레벨 및 모바일 UI 최적화 스크립트
// ============================================================================

// --- 1. 레벨 데이터 (18개 레벨 전수 정의 및 대칭성/정답 쿼터니언 매핑) ---
const levels = [
    {
        name: "하트 (Heart)",
        description: "사랑스럽고 포근한 하트 형상",
        grid: [
            [0, 1, 1, 0, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0]
        ],
        color: 0xf43f5e,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "고양이 (Cat)",
        description: "쫑긋 솟은 귀가 매력적인 고양이",
        grid: [
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
            [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1],
            [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0]
        ],
        color: 0x8b5cf6,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "나비 (Butterfly)",
        description: "우아하게 날갯짓하는 푸른 나비",
        grid: [
            [1, 1, 0, 0, 1, 0, 0, 1, 1],
            [1, 1, 1, 0, 1, 0, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 0, 1, 0, 1, 1, 1],
            [1, 1, 0, 0, 1, 0, 0, 1, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0]
        ],
        color: 0x06b6d4,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "오리 (Rubber Duck)",
        description: "귀여운 부리를 뽐내는 러버덕",
        grid: [
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 0, 0, 0]
        ],
        color: 0xfacc15,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "사과 (Apple)",
        description: "잎사귀가 돋아난 싱그러운 사과",
        grid: [
            [0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0, 0]
        ],
        color: 0x10b981,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "소나무 (Pine Tree)",
        description: "푸르고 웅장한 침엽수 나무",
        grid: [
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0]
        ],
        color: 0x22c55e,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "머그컵 (Mug)",
        description: "손잡이가 달린 따뜻한 머그잔",
        grid: [
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1],
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0]
        ],
        color: 0x38bdf8,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "열쇠 (Magic Key)",
        description: "비밀을 여는 앤틱 황금 열쇠",
        grid: [
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 1, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 1, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
            [0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 1]
        ],
        color: 0xeab308,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "우산 (Umbrella)",
        description: "비 오는 날을 지켜주는 클래식 우산",
        grid: [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0]
        ],
        color: 0xf43f5e,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "음표 (Music Note)",
        description: "경쾌한 멜로디의 8분 음표",
        grid: [
            [0, 0, 0, 0, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0]
        ],
        color: 0xec4899,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "모래시계 (Hourglass)",
        description: "시간의 흐름을 담은 모래시계",
        grid: [
            [1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1]
        ],
        color: 0xf59e0b,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "검 (Sword)",
        description: "날렵하고 웅장한 용사의 검",
        grid: [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0]
        ],
        color: 0x94a3b8,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "방패 (Shield)",
        description: "십자 문양이 새겨진 수호자의 방패",
        grid: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 0, 1, 0, 1, 1, 1],
            [1, 1, 0, 0, 1, 0, 0, 1, 1],
            [1, 1, 1, 0, 1, 0, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0]
        ],
        color: 0x6366f1,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "집 (Sweet Home)",
        description: "굴뚝에서 온기가 피어나는 집",
        grid: [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
            [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0]
        ],
        color: 0x84cc16,
        allowYFlip: false,
        allowQuarterTurn: false
    },
    {
        name: "비행기 (Airplane)",
        description: "하늘을 가르는 웅장한 비행기",
        grid: [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0]
        ],
        color: 0x38bdf8,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "로켓 (Space Rocket)",
        description: "우주로 날아오르는 탐사 로켓",
        grid: [
            [0, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1],
            [1, 0, 1, 1, 1, 0, 1],
            [1, 0, 0, 1, 0, 0, 1]
        ],
        color: 0xef4444,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "다이아몬드 (Diamond)",
        description: "영롱하게 빛나는 최고급 보석",
        grid: [
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 0, 0, 0]
        ],
        color: 0x06b6d4,
        allowYFlip: true,
        allowQuarterTurn: false
    },
    {
        name: "별 (Twinkle Star)",
        description: "밤하늘을 밝히는 빛나는 별",
        grid: [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 0],
            [0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1]
        ],
        color: 0xfbbf24,
        allowYFlip: true,
        allowQuarterTurn: false
    }
];

// --- 2. 사운드 신디사이저 (Web Audio API) ---
class SoundSynthesizer {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('shadow_puzzle_sound') !== 'false';
        this.lastTickTime = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('shadow_puzzle_sound', this.enabled.toString());
        return this.enabled;
    }

    playTick() {
        if (!this.enabled) return;
        const now = Date.now();
        if (now - this.lastTickTime < 70) return;
        this.lastTickTime = now;

        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.03);

        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.035);
    }

    playNearTone() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    playSnap() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime + idx * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.04 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + idx * 0.04);
            osc.stop(this.ctx.currentTime + idx * 0.04 + 0.36);
        });
    }

    playFanfare() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [
            { f: 523.25, d: 0.12, t: 0.0 },
            { f: 659.25, d: 0.12, t: 0.12 },
            { f: 783.99, d: 0.12, t: 0.24 },
            { f: 1046.50, d: 0.4, t: 0.36 }
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, this.ctx.currentTime + note.t);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + note.t);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + note.t + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + note.t);
            osc.stop(this.ctx.currentTime + note.t + note.d + 0.02);
        });
    }

    playHint() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.26);
    }
}

const sound = new SoundSynthesizer();

// --- 3. 로컬스토리지 진행도 관리 ---
class ProgressManager {
    constructor() {
        this.key = 'shadow_puzzle_cleared_levels';
        this.cleared = this.load();
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    save(levelIndex) {
        if (!this.cleared.includes(levelIndex)) {
            this.cleared.push(levelIndex);
            try {
                localStorage.setItem(this.key, JSON.stringify(this.cleared));
            } catch {}
        }
    }

    isCleared(levelIndex) {
        return this.cleared.includes(levelIndex);
    }

    reset() {
        this.cleared = [];
        try {
            localStorage.removeItem(this.key);
        } catch {}
    }
}

const progress = new ProgressManager();

// --- 4. 게임 상태 및 Three.js 씬 초기화 ---
let currentLevelIndex = 0;
let gameState = 'playing';
let currentTargetQuaternions = [];
let activeTargetQuaternion = null;
let correctStartTime = null;
let nearSoundPlayed = false;
let hintTimeoutId = null;

// 회전 관성 (Momentum Inertia)
let isDragging = false;
let previousPointerPos = { x: 0, y: 0 };
let angularVelocity = { x: 0, y: 0 };
const ROTATION_SPEED = 0.0065;
const FRICTION = 0.92;

const canvas = document.getElementById('game-canvas');
canvas.style.touchAction = 'none';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f19);
scene.fog = new THREE.Fog(0x0b0f19, 20, 70);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// 조명 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.35);
directionalLight.position.set(0, 0, 32);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -25;
directionalLight.shadow.camera.right = 25;
directionalLight.shadow.camera.top = 25;
directionalLight.shadow.camera.bottom = -25;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 65;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
fillLight.position.set(15, 12, 18);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xa855f7, 0.3);
rimLight.position.set(-15, -10, 10);
scene.add(rimLight);

// 배경 벽 및 바닥
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.15
});

const wallGeometry = new THREE.PlaneGeometry(140, 140);
const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.z = -15;
wall.receiveShadow = true;
scene.add(wall);

const floor = new THREE.Mesh(wallGeometry, wallMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -12;
floor.receiveShadow = true;
scene.add(floor);

// 퍼즐 및 파티클 그룹
const puzzleGroup = new THREE.Group();
scene.add(puzzleGroup);

const particleGroup = new THREE.Group();
scene.add(particleGroup);

// --- 5. 3D 폭죽 파티클 시스템 (Confetti FX) ---
class ParticleEmitter {
    constructor() {
        this.particles = [];
        this.colors = [0x38bdf8, 0x06b6d4, 0x10b981, 0xfbbf24, 0xf43f5e, 0xa855f7];
        this.geom = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    }

    explode(origin, count = 90) {
        this.clear();
        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                transparent: true,
                opacity: 1
            });
            const mesh = new THREE.Mesh(this.geom, mat);
            mesh.position.copy(origin);

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 4 + Math.random() * 8;

            const velocity = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed + 3,
                Math.cos(phi) * speed
            );

            const rotSpeed = new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            );

            particleGroup.add(mesh);
            this.particles.push({
                mesh,
                velocity,
                rotSpeed,
                life: 1.0,
                decay: 0.015 + Math.random() * 0.01
            });
        }
    }

    update(delta = 0.016) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= p.decay;

            p.mesh.position.addScaledVector(p.velocity, delta);
            p.velocity.y -= 9.8 * delta;
            p.mesh.rotation.x += p.rotSpeed.x * delta;
            p.mesh.rotation.y += p.rotSpeed.y * delta;
            p.mesh.rotation.z += p.rotSpeed.z * delta;

            p.mesh.material.opacity = Math.max(0, p.life);

            if (p.life <= 0) {
                particleGroup.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
                this.particles.splice(i, 1);
            }
        }
    }

    clear() {
        while (this.particles.length > 0) {
            const p = this.particles.pop();
            particleGroup.remove(p.mesh);
            p.mesh.geometry.dispose();
            p.mesh.material.dispose();
        }
    }
}

const confetti = new ParticleEmitter();

// --- 6. 뷰포트 레이아웃 및 반응형 카메라 보정 ---
function adjustLayoutForScreen() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const isMobile = width < 768 || aspect < 1.0;

    if (aspect < 1.0) {
        const baseFov = 46;
        camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 46, 64);
        camera.position.set(16, 15, 30);
        puzzleGroup.position.x = -2.2;
    } else if (isMobile) {
        camera.fov = 45;
        camera.position.set(18, 14, 27);
        puzzleGroup.position.x = -3.0;
    } else {
        camera.fov = 45;
        camera.position.set(17, 13, 24);
        puzzleGroup.position.x = -2.0;
    }

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
}

// --- 7. 레벨 로드 및 쿼터니언 정밀 매핑 ---
function loadLevel(index) {
    if (index >= levels.length) {
        gameState = 'ended';
        showEndingModal();
        return;
    }

    gameState = 'playing';
    correctStartTime = null;
    nearSoundPlayed = false;
    currentLevelIndex = index;
    angularVelocity = { x: 0, y: 0 };
    confetti.clear();
    hideHint();

    const levelData = levels[index];

    // UI 헤더 업데이트
    document.getElementById('level-text').innerText = `레벨 ${index + 1} / ${levels.length}`;
    const levelBadge = document.getElementById('level-badge');
    if (progress.isCleared(index)) {
        levelBadge.className = "w-2 h-2 rounded-full bg-emerald-400";
    } else {
        levelBadge.className = "w-2 h-2 rounded-full bg-cyan-400 animate-pulse";
    }

    // 하단 안내 배너
    const instruction = document.getElementById('instruction');
    instruction.innerHTML = `<span class="text-white font-bold">${levelData.name}</span> 그림자를 완성해보세요!`;
    document.getElementById('instruction-card').className = "pointer-events-auto glass-panel px-5 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-2xl transition-all duration-300 text-center max-w-md";

    // 일치율 HUD 초기화
    updateProximityHUD(0, false);

    // 다음 버튼 숨기기
    const nextContainer = document.getElementById('next-btn-container');
    nextContainer.classList.add('h-0', 'opacity-0');
    nextContainer.classList.remove('h-[46px]', 'opacity-100');

    // 정답 쿼터니언 정밀 매핑
    currentTargetQuaternions = [];

    const qIdentity = new THREE.Quaternion().identity();
    currentTargetQuaternions.push(qIdentity);

    if (levelData.allowYFlip) {
        const qYFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        currentTargetQuaternions.push(qYFlip);
    }

    if (levelData.allowQuarterTurn) {
        for (let i = 1; i < 4; i++) {
            const qZ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), i * Math.PI / 2);
            currentTargetQuaternions.push(qZ);
        }
    }

    // 기존 블록 제거
    while (puzzleGroup.children.length > 0) {
        const child = puzzleGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
        puzzleGroup.remove(child);
    }

    puzzleGroup.quaternion.identity();

    // 3D 블록 조립
    const grid = levelData.grid;
    const rows = grid.length;
    const cols = grid[0].length;
    const blockSize = 1.0;

    const blockMaterial = new THREE.MeshStandardMaterial({
        color: levelData.color,
        roughness: 0.25,
        metalness: 0.25
    });
    const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (grid[y][x] === 1) {
                const mesh = new THREE.Mesh(blockGeometry, blockMaterial);
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                const posX = (x - cols / 2 + 0.5) * blockSize;
                const posY = -(y - rows / 2 + 0.5) * blockSize;
                const posZ = (Math.random() - 0.5) * 8.5;

                mesh.position.set(posX, posY, posZ);
                puzzleGroup.add(mesh);
            }
        }
    }

    randomizeRotation();
}

function randomizeRotation() {
    const euler = new THREE.Euler(
        (Math.random() * 0.8 + 0.2) * Math.PI,
        (Math.random() * 0.8 + 0.2) * Math.PI,
        (Math.random() * 0.8 + 0.2) * Math.PI
    );
    puzzleGroup.quaternion.setFromEuler(euler);

    let tooClose = false;
    for (let tq of currentTargetQuaternions) {
        if (Math.abs(puzzleGroup.quaternion.dot(tq)) > 0.82) {
            tooClose = true;
            break;
        }
    }

    if (tooClose) {
        randomizeRotation();
    }
}

// --- 8. 포인터 입력 및 관성 모멘텀 (Momentum) 인터랙션 ---
window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('#level-modal') || e.target.closest('#ending-modal') || e.target.closest('#hint-card-panel')) {
        return;
    }

    if (gameState !== 'playing') return;

    sound.init();
    isDragging = true;
    previousPointerPos = { x: e.clientX, y: e.clientY };
    angularVelocity = { x: 0, y: 0 };

    if (canvas.setPointerCapture && e.pointerId) {
        try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
});

window.addEventListener('pointermove', (e) => {
    if (!isDragging || gameState !== 'playing') return;

    const deltaX = e.clientX - previousPointerPos.x;
    const deltaY = e.clientY - previousPointerPos.y;

    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        angularVelocity.x = deltaX * ROTATION_SPEED;
        angularVelocity.y = deltaY * ROTATION_SPEED;

        applyRotation(angularVelocity.x, angularVelocity.y);
        sound.playTick();
    }

    previousPointerPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener('pointerup', (e) => {
    isDragging = false;
    if (canvas.releasePointerCapture && e.pointerId) {
        try { canvas.releasePointerCapture(e.pointerId); } catch {}
    }
});

window.addEventListener('pointercancel', () => {
    isDragging = false;
});

function applyRotation(velX, velY) {
    const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const camUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

    const qX = new THREE.Quaternion().setFromAxisAngle(camUp, velX);
    const qY = new THREE.Quaternion().setFromAxisAngle(camRight, velY);

    const qTotal = new THREE.Quaternion().multiplyQuaternions(qX, qY);
    puzzleGroup.quaternion.premultiply(qTotal);
}

// --- 9. 실시간 승리 판정 & 자석 인력 & HUD 업데이트 ---
function updateProximityHUD(percentage, isHigh, isSnap = false) {
    const bar = document.getElementById('proximity-bar');
    const pctText = document.getElementById('proximity-pct');
    const dot = document.getElementById('proximity-dot');

    if (!bar || !pctText) return;

    pctText.innerText = `${Math.min(100, Math.max(0, percentage))}%`;
    bar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;

    if (isSnap) {
        bar.className = 'proximity-meter-bar snap';
        dot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping';
    } else if (isHigh) {
        bar.className = 'proximity-meter-bar high';
        dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse';
    } else {
        bar.className = 'proximity-meter-bar';
        dot.className = 'w-1.5 h-1.5 rounded-full bg-cyan-400';
    }
}

function checkWinCondition() {
    if (gameState !== 'playing') return;

    let maxDot = 0;
    let bestTarget = null;

    for (let tq of currentTargetQuaternions) {
        const dot = Math.abs(puzzleGroup.quaternion.dot(tq));
        if (dot > maxDot) {
            maxDot = dot;
            bestTarget = tq;
        }
    }

    const rawPct = (maxDot - 0.72) / (0.992 - 0.72);
    const proximityPct = Math.round(Math.max(0, Math.min(1, rawPct)) * 100);

    const isNear = proximityPct >= 90;
    const isReady = maxDot > 0.985 || proximityPct >= 96;

    updateProximityHUD(proximityPct, isNear, isReady);

    if (isNear && !isDragging) {
        puzzleGroup.quaternion.slerp(bestTarget, 0.045);
        if (!nearSoundPlayed) {
            sound.playNearTone();
            nearSoundPlayed = true;
        }
    } else if (!isNear) {
        nearSoundPlayed = false;
    }

    if (isReady) {
        if (correctStartTime === null) {
            correctStartTime = Date.now();
        } else if (Date.now() - correctStartTime >= 800) {
            gameState = 'snapping';
            activeTargetQuaternion = bestTarget;
            sound.playSnap();
        }
    } else {
        correctStartTime = null;
    }
}

// --- 10. 💡 힌트(Hint) 시스템 - 자동 회전 제거 및 독립 프리뷰 HUD 렌더링 ---
function drawHintPreview() {
    const hintCanvas = document.getElementById('hint-preview-canvas');
    if (!hintCanvas) return;

    const ctx = hintCanvas.getContext('2d');
    const width = hintCanvas.width;
    const height = hintCanvas.height;

    ctx.clearRect(0, 0, width, height);

    const levelData = levels[currentLevelIndex];
    const grid = levelData.grid;
    const rows = grid.length;
    const cols = grid[0].length;

    // 110x110 캔버스에 최적화된 콤팩트 패딩 및 셀 크기
    const cellSize = Math.min((width - 16) / cols, (height - 16) / rows);
    const startX = (width - cols * cellSize) / 2;
    const startY = (height - rows * cellSize) / 2;

    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#facc15';

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                ctx.beginPath();
                ctx.rect(startX + c * cellSize + 0.5, startY + r * cellSize + 0.5, cellSize - 1, cellSize - 1);
                ctx.fill();
            }
        }
    }
    ctx.restore();
}

function showHint() {
    if (gameState !== 'playing') return;

    sound.playHint();
    
    // 1. 현재 레벨명 업데이트 및 프리뷰 캔버스 드로잉
    const levelName = levels[currentLevelIndex].name;
    const nameEl = document.getElementById('hint-level-name');
    if (nameEl) nameEl.innerText = levelName;

    drawHintPreview();

    // 2. 힌트 프리뷰 카드 표시 (퍼즐 블록과 안 겹치며 또렷하게 보임)
    const hintPanel = document.getElementById('hint-card-panel');
    if (hintPanel) {
        hintPanel.classList.add('show');
    }

    // 3. 사용자 요청 반영: 퍼즐 블록을 자동으로 회전시키지 않음 (slerp 코드 삭제)

    // 4. 하단 안내 배너 갱신
    const instruction = document.getElementById('instruction');
    instruction.innerHTML = `💡 <span class="text-yellow-300 font-bold">'${levelName}'</span> 목표 그림자를 확인하세요!`;

    // 5. 4.5초 후 자동 닫기 (이전 타이머가 있다면 리셋)
    if (hintTimeoutId) clearTimeout(hintTimeoutId);
    hintTimeoutId = setTimeout(() => {
        hideHint();
    }, 4500);
}

function hideHint() {
    const hintPanel = document.getElementById('hint-card-panel');
    if (hintPanel) {
        hintPanel.classList.remove('show');
    }
    if (hintTimeoutId) {
        clearTimeout(hintTimeoutId);
        hintTimeoutId = null;
    }
}

// --- 11. 모달 및 레벨 선택기 UI 컨트롤 ---
function renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;

    grid.innerHTML = '';
    let clearedCount = 0;

    levels.forEach((lvl, idx) => {
        const isCleared = progress.isCleared(idx);
        const isCurrent = idx === currentLevelIndex;
        if (isCleared) clearedCount++;

        const card = document.createElement('button');
        card.className = `level-card rounded-2xl p-2.5 sm:p-3 flex flex-col items-center gap-1 text-left transition-all ${
            isCurrent ? 'current' : isCleared ? 'cleared' : ''
        }`;

        card.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <span class="text-[10px] sm:text-xs font-mono font-bold text-slate-400">#${idx + 1}</span>
                <span class="text-xs sm:text-sm">${isCleared ? '✅' : isCurrent ? '📍' : '🔒'}</span>
            </div>
            <div class="text-xs sm:text-sm font-bold text-white truncate w-full text-center">${lvl.name.split(' ')[0]}</div>
        `;

        card.addEventListener('click', () => {
            sound.init();
            closeLevelModal();
            loadLevel(idx);
        });

        grid.appendChild(card);
    });

    const clearedCountEl = document.getElementById('cleared-count');
    if (clearedCountEl) {
        clearedCountEl.innerText = `${clearedCount} / ${levels.length}`;
    }
}

function openLevelModal() {
    renderLevelGrid();
    const modal = document.getElementById('level-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeLevelModal() {
    const modal = document.getElementById('level-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

function showEndingModal() {
    const modal = document.getElementById('ending-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    confetti.explode(new THREE.Vector3(0, 0, 10), 140);
    sound.playFanfare();
}

// --- 12. 메인 애니메이션 루프 ---
let lastTime = performance.now();

function animate(currentTime) {
    requestAnimationFrame(animate);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (!isDragging && gameState === 'playing') {
        if (Math.abs(angularVelocity.x) > 0.0001 || Math.abs(angularVelocity.y) > 0.0001) {
            applyRotation(angularVelocity.x, angularVelocity.y);
            angularVelocity.x *= FRICTION;
            angularVelocity.y *= FRICTION;
        }
    }

    checkWinCondition();

    if (gameState === 'snapping' && activeTargetQuaternion) {
        puzzleGroup.quaternion.slerp(activeTargetQuaternion, 0.14);

        if (Math.abs(puzzleGroup.quaternion.dot(activeTargetQuaternion)) > 0.999) {
            puzzleGroup.quaternion.copy(activeTargetQuaternion);
            gameState = 'success';

            progress.save(currentLevelIndex);

            confetti.explode(puzzleGroup.position, 100);
            sound.playFanfare();

            const levelName = levels[currentLevelIndex].name;
            const instruction = document.getElementById('instruction');
            instruction.innerHTML = `🎉 정답입니다! <strong class="text-white ml-1">('${levelName}')</strong>`;
            document.getElementById('instruction-card').className = "pointer-events-auto glass-panel px-6 py-2.5 rounded-full shadow-2xl transition-all duration-300 text-center max-w-md border border-emerald-500/50 bg-emerald-950/70 text-emerald-300 font-bold";

            updateProximityHUD(100, true, true);

            const nextContainer = document.getElementById('next-btn-container');
            nextContainer.classList.remove('h-0', 'opacity-0');
            nextContainer.classList.add('h-[46px]', 'opacity-100');
        }
    }

    confetti.update(delta);
    puzzleGroup.position.y = Math.sin(currentTime * 0.002) * 0.25;

    renderer.render(scene, camera);
}

// --- 13. 이벤트 리스너 바인딩 ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    adjustLayoutForScreen();
});

document.getElementById('next-btn').addEventListener('click', () => {
    sound.init();
    currentLevelIndex++;
    loadLevel(currentLevelIndex);
});

document.getElementById('restart-btn').addEventListener('click', () => {
    sound.init();
    const endingModal = document.getElementById('ending-modal');
    endingModal.classList.remove('flex');
    endingModal.classList.add('hidden');

    currentLevelIndex = 0;
    loadLevel(currentLevelIndex);
});

document.getElementById('hint-btn').addEventListener('click', () => {
    sound.init();
    showHint();
});

document.getElementById('close-hint-btn').addEventListener('click', () => {
    hideHint();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    sound.init();
    randomizeRotation();
});

document.getElementById('sound-btn').addEventListener('click', () => {
    sound.init();
    const isEnabled = sound.toggle();
    document.getElementById('sound-icon').innerText = isEnabled ? '🔊' : '🔇';
});

document.getElementById('level-select-btn').addEventListener('click', () => {
    sound.init();
    openLevelModal();
});

document.getElementById('close-level-modal').addEventListener('click', () => {
    closeLevelModal();
});

document.getElementById('reset-progress-btn').addEventListener('click', () => {
    if (confirm('모든 레벨 클리어 진행도를 초기화하시겠습니까?')) {
        progress.reset();
        renderLevelGrid();
        loadLevel(currentLevelIndex);
    }
});

document.getElementById('sound-icon').innerText = sound.enabled ? '🔊' : '🔇';

adjustLayoutForScreen();
loadLevel(currentLevelIndex);
requestAnimationFrame(animate);
