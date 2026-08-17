// ============================================================================
// 섀도우 퍼즐 (Shadow Puzzle) - 13개 단계 & SPTI 유형 검사 결과 화면 스크립트
// ============================================================================

// --- 1. 단계 데이터 (13개 엄선 단계 - 사용자 경험 중심의 대칭/반전 최적화) ---
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
        allowXFlip: false
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
        allowXFlip: false
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
        allowXFlip: false
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
        allowYFlip: true,
        allowXFlip: false
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
        allowXFlip: false
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
        allowYFlip: true,
        allowXFlip: false
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
        allowYFlip: true,
        allowXFlip: false
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
        allowYFlip: true,
        allowXFlip: false
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
        allowYFlip: true,
        allowXFlip: false
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
        allowXFlip: true
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
        allowXFlip: false
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
        allowYFlip: true,
        allowXFlip: false
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
        allowXFlip: false
    }
];

// --- 2. 8대 상징 동물 공간 지각 유형 데이터 (SPTI) ---
const animalTypes = [
    {
        id: 'cheetah',
        emoji: '🐆',
        name: '번개 치타형',
        engName: 'Flash Cheetah',
        summary: '고민할 시간에 이미 손이 정답을 완성하는 본능적 감각의 소유자',
        badgeColor: '#facc15',
        stats: { speed: 98, spatial: 95, precision: 86, focus: 92 },
        traits: [
            '복잡한 계산보다는 손이 먼저 반응해 직관적으로 정답을 찾습니다.',
            '3D 블록을 머릿속에서 시각화하는 회전 반사 신경이 뛰어납니다.',
            '한 번 감을 잡으면 거침없는 스피드로 연속 클리어를 이어갑니다.'
        ],
        goodMatch: '🦉 지혜로운 올빼미형',
        badMatch: '🐢 우직한 거북이형'
    },
    {
        id: 'owl',
        emoji: '🦉',
        name: '지혜로운 올빼미형',
        engName: 'Wise Owl',
        summary: '최소한의 회전으로 핵심 각도를 정확히 꿰뚫는 완벽주의 설계자',
        badgeColor: '#38bdf8',
        stats: { speed: 85, spatial: 98, precision: 99, focus: 96 },
        traits: [
            '불필요한 조작 없이 물체의 구조적 축을 빠르게 파악합니다.',
            '공간 왜곡 속에서도 숨겨진 정답 각도를 차분하게 짚어냅니다.',
            '체계적이고 오차 없는 플레이로 최고의 조작 효율을 보여줍니다.'
        ],
        goodMatch: '🐆 번개 치타형',
        badMatch: '🦊 임기응변 여우형'
    },
    {
        id: 'hawk',
        emoji: '🦅',
        name: '날카로운 매형',
        engName: 'Sharp Hawk',
        summary: '3D 왜곡 속에서도 숨은 각도를 단숨에 포착하는 매서운 시야의 탐색가',
        badgeColor: '#818cf8',
        stats: { speed: 94, spatial: 96, precision: 90, focus: 93 },
        traits: [
            '원거리에서 입체 전체를 조망하듯 넓은 공간 지각 시야를 가집니다.',
            '복잡한 형상일수록 핵심 랜드마크 도트를 빠르게 식별합니다.',
            '목표가 확실해지면 단번에 정확한 방향으로 스냅을 이끌어냅니다.'
        ],
        goodMatch: '🐺 냉철한 늑대형',
        badMatch: '🐬 자유로운 돌고래형'
    },
    {
        id: 'fox',
        emoji: '🦊',
        name: '임기응변 여우형',
        engName: 'Clever Fox',
        summary: '막힘없이 유연하고 기발한 각도로 길을 찾아내는 공간 전략가',
        badgeColor: '#fb923c',
        stats: { speed: 92, spatial: 91, precision: 89, focus: 90 },
        traits: [
            '틀에 갇히지 않고 여러 축을 자유롭게 비틀어보며 해법을 찾습니다.',
            '예상치 못한 방향에서 정답 그림자를 찾아내는 창의성이 돋보입니다.',
            '어려운 단계를 만나도 당황하지 않고 요령 있게 해결합니다.'
        ],
        goodMatch: '🐬 자유로운 돌고래형',
        badMatch: '🦉 지혜로운 올빼미형'
    },
    {
        id: 'turtle',
        emoji: '🐢',
        name: '우직한 거북이형',
        engName: 'Steadfast Turtle',
        summary: '흔들리지 않는 끈기와 깊은 집중력으로 13코스를 정복한 집념의 마스터',
        badgeColor: '#4ade80',
        stats: { speed: 76, spatial: 90, precision: 94, focus: 99 },
        traits: [
            '서두르지 않고 침착하게 모든 각도를 꼼꼼히 확인하며 맞춥니다.',
            '실수해도 흔들리지 않고 끝까지 물고 늘어지는 놀라운 집중력의 소유자입니다.',
            '어려운 3D 퍼즐도 꾸준한 탐색으로 결국 완성해냅니다.'
        ],
        goodMatch: '🦁 당당한 사자형',
        badMatch: '🐆 번개 치타형'
    },
    {
        id: 'dolphin',
        emoji: '🐬',
        name: '자유로운 돌고래형',
        engName: 'Playful Dolphin',
        summary: '즐거운 감각과 리듬감으로 3차원 공간을 유영하는 감각파',
        badgeColor: '#22d3ee',
        stats: { speed: 90, spatial: 93, precision: 84, focus: 88 },
        traits: [
            '물 흐르듯 자연스러운 터치 제스처로 퍼즐을 감각적으로 다룹니다.',
            '정형화된 방식보다 직관적인 느낌을 믿고 시도하는 플레이 스타일입니다.',
            '게임 자체를 온전히 즐기며 자연스럽게 높은 지각력을 발휘합니다.'
        ],
        goodMatch: '🦊 임기응변 여우형',
        badMatch: '🦅 날카로운 매형'
    },
    {
        id: 'wolf',
        emoji: '🐺',
        name: '냉철한 늑대형',
        engName: 'Lone Wolf',
        summary: '오차 없는 냉철한 판단력과 깊은 몰입감의 입체 지각 통찰가',
        badgeColor: '#c084fc',
        stats: { speed: 91, spatial: 94, precision: 95, focus: 97 },
        traits: [
            '주변 방해에 흔들리지 않고 퍼즐의 입체 축에 깊이 몰입합니다.',
            '정확한 쿼터니언 각도를 본능적으로 파악해 오차 없이 스냅시킵니다.',
            '군더더기 없는 깔끔한 조작으로 안정적인 고득점을 달성합니다.'
        ],
        goodMatch: '🦅 날카로운 매형',
        badMatch: '🦁 당당한 사자형'
    },
    {
        id: 'lion',
        emoji: '🦁',
        name: '당당한 사자형',
        engName: 'Brave Lion',
        summary: '과감하고 거침없는 조작으로 빠르게 정답을 쟁취하는 공간의 승부사',
        badgeColor: '#f87171',
        stats: { speed: 96, spatial: 92, precision: 88, focus: 94 },
        traits: [
            '망설임 없이 대담하게 블록을 회전시켜 정답 구역을 빠르게 좁힙니다.',
            '도전적인 난이도일수록 더욱 높은 승부욕과 집중력을 발휘합니다.',
            '기록 경신과 라이벌 승부에 특히 강한 면모를 보입니다.'
        ],
        goodMatch: '🐢 우직한 거북이형',
        badMatch: '🐺 냉철한 늑대형'
    }
];

// --- 🌟 8분면 직교 매트릭스 기반 공정 유형 판정 엔진 ---
function determineAnimalType(totalSec, totalRot) {
    const avgSec = (totalSec || 135) / levels.length;
    const avgRot = (totalRot || 88) / levels.length;

    // 1. 속도 3분할 (Fast < 7.0s / Normal 7.0~14.0s / Deep >= 14.0s)
    const isFast = avgSec < 7.0;
    const isDeep = avgSec >= 14.0;
    const isNormalSpeed = !isFast && !isDeep;

    // 2. 조작 회전수 3분할 (Low < 9.0회 / Med 9.0~14.0회 / High >= 14.0회)
    const isLowRot = avgRot < 9.0;
    const isHighRot = avgRot >= 14.0;
    const isMedRot = !isLowRot && !isHighRot;

    // 3. 중복 및 누락 없는 8분면 1:1 직교 매핑
    if (isFast) {
        if (isLowRot) return animalTypes[0];  // 🐆 치타 (Fast + LowRot: 직관적 스피드 스타)
        if (isMedRot) return animalTypes[7];  // 🦁 사자 (Fast + MedRot: 과감한 승부사)
        return animalTypes[2];               // 🦅 매   (Fast + HighRot: 빠르고 다채로운 시야)
    } else if (isNormalSpeed) {
        if (isLowRot) return animalTypes[1];  // 🦉 올빼미 (Normal + LowRot: 완벽한 최소 조작)
        if (isMedRot) return animalTypes[6];  // 🐺 늑대   (Normal + MedRot: 냉철하고 균형 잡힌 플레이)
        return animalTypes[3];               // 🦊 여우   (Normal + HighRot: 유연한 임기응변)
    } else { // isDeep (신중/몰입 플레이어)
        if (isLowRot || isMedRot) {
            return animalTypes[4];           // 🐢 거북이 (Deep + Low/MedRot: 우직한 집중력)
        } else {
            return animalTypes[5];           // 🐬 돌고래 (Deep + HighRot: 여유로운 공간 유희)
        }
    }
}

// --- 3. 사운드 신디사이저 (Web Audio API) ---
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

// --- 4. 로컬스토리지 진행도 및 통계 매니저 ---
class ProgressManager {
    constructor() {
        this.key = 'shadow_puzzle_cleared_levels';
        this.statsKey = 'shadow_puzzle_stats';
        this.cleared = this.load();
        this.stats = this.loadStats();
    }

    load() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    loadStats() {
        try {
            const data = localStorage.getItem(this.statsKey);
            return data ? JSON.parse(data) : {
                totalTime: 0,
                totalRotations: 0,
                levelStats: {}
            };
        } catch {
            return { totalTime: 0, totalRotations: 0, levelStats: {} };
        }
    }

    saveLevelResult(levelIndex, timeSec, rotations) {
        if (!this.cleared.includes(levelIndex)) {
            this.cleared.push(levelIndex);
            try { localStorage.setItem(this.key, JSON.stringify(this.cleared)); } catch {}
        }

        this.stats.levelStats[levelIndex] = {
            time: Math.round(timeSec * 10) / 10,
            rotations: rotations,
            date: new Date().toISOString()
        };

        let sumTime = 0;
        let sumRot = 0;
        Object.values(this.stats.levelStats).forEach(s => {
            sumTime += s.time || 0;
            sumRot += s.rotations || 0;
        });
        this.stats.totalTime = Math.round(sumTime * 10) / 10;
        this.stats.totalRotations = sumRot;

        try { localStorage.setItem(this.statsKey, JSON.stringify(this.stats)); } catch {}
    }

    isCleared(levelIndex) {
        return this.cleared.includes(levelIndex);
    }

    isAllCleared() {
        return this.cleared.length >= levels.length;
    }

    reset() {
        this.cleared = [];
        this.stats = { totalTime: 0, totalRotations: 0, levelStats: {} };
        try {
            localStorage.removeItem(this.key);
            localStorage.removeItem(this.statsKey);
        } catch {}
    }
}

const progress = new ProgressManager();

// --- 4-1. GA4 이벤트 안전 추적 유틸리티 ---
function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
        try {
            window.gtag('event', eventName, params);
        } catch (e) {
            console.debug('GA4 tracking error:', e);
        }
    }
}

// --- 5. 게임 상태 및 Three.js 씬 초기화 ---
let currentLevelIndex = 0;
let gameState = 'intro';
let isIntroActive = true;

let currentTargetQuaternions = [];
let activeTargetQuaternion = null;
let correctStartTime = null;
let nearSoundPlayed = false;
let hintTimeoutId = null;

// 플레이어 단계별 기록 트래커
let levelStartTime = Date.now();
let levelRotationCount = 0;

// 회전 관성
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

// 조명 설정 (Z축 수직 투영으로 3D 블록 깊이 차이에 의한 그림자 찌그러짐 원천 차단 + 적정 밝기)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.10);
directionalLight.position.set(0, 0, 32);
directionalLight.target.position.set(0, 0, 0);
scene.add(directionalLight.target);

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

const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.90);
fillLight.position.set(15, 12, 18);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xa855f7, 0.75);
rimLight.position.set(-15, -10, 10);
scene.add(rimLight);

// 배경 벽 및 바닥 (은은하고 세련된 딥 네이비 슬레이트)
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x24324a,
    roughness: 0.55,
    metalness: 0.10
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

let basePuzzlePos = { x: -4.8, y: -0.8, z: 0 };

const particleGroup = new THREE.Group();
scene.add(particleGroup);

// --- 6. 3D 폭죽 파티클 시스템 (Confetti FX) ---
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

// --- 7. 뷰포트 레이아웃 및 반응형 카메라 보정 ---
function adjustLayoutForScreen() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    const isMobile = width < 768 || aspect < 1.0;

    if (aspect < 1.0) {
        // 모바일 세로 화면: 웅장한 대각선 3D 쿼터뷰 황금비 (화사한 조명 + 적정 크기 + 여백 40px+)
        const baseFov = 49;
        camera.fov = THREE.MathUtils.clamp(baseFov / Math.sqrt(aspect), 46, 58);
        camera.position.set(16, 12, 30);
        basePuzzlePos = { x: -0.8, y: -0.8, z: 0 };
        camera.lookAt(0, 0, -3);
    } else if (isMobile) {
        // 모바일 가로 화면
        camera.fov = 42;
        camera.position.set(16, 12, 30);
        basePuzzlePos = { x: -2.0, y: -0.8, z: 0 };
        camera.lookAt(0, 0, -3);
    } else {
        // 데스크톱: 쾌적한 3D 쿼터뷰
        camera.fov = 42;
        camera.position.set(16, 12, 28);
        basePuzzlePos = { x: -1.6, y: -0.8, z: 0 };
        camera.lookAt(0, 0, -3);
    }

    puzzleGroup.position.set(basePuzzlePos.x, basePuzzlePos.y, basePuzzlePos.z);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
}

// --- 8. 레벨 로드 및 쿼터니언 정밀 대칭 매핑 ---
function loadLevel(index) {
    if (index >= levels.length) {
        gameState = 'ended';
        showEndingModal();
        return;
    }

    if (!isIntroActive) {
        gameState = 'playing';
    }
    correctStartTime = null;
    nearSoundPlayed = false;
    currentLevelIndex = index;
    levelStartTime = Date.now();
    levelRotationCount = 0;
    angularVelocity = { x: 0, y: 0 };
    confetti.clear();
    hideHint();

    const levelData = levels[index];

    // UI 헤더 업데이트
    document.getElementById('level-text').innerText = `단계 ${index + 1} / ${levels.length}`;
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

    // 정답 쿼터니언 정밀 매핑 (시각적 대칭/반전 형상 전수 등록)
    currentTargetQuaternions = [];

    // 1. 정면 기준 (0도)
    const qIdentity = new THREE.Quaternion().identity();
    currentTargetQuaternions.push(qIdentity);

    // 2. Y축 180도 플립 (좌우 반전 - 모든 단계 허용)
    if (levelData.allowYFlip !== false) {
        const qYFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        currentTargetQuaternions.push(qYFlip);
    }

    // 3. X축 / Z축 180도 플립 (상하 완전 대칭 형상 - 모래시계 등)
    if (levelData.allowXFlip) {
        const qXFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI);
        const qZFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
        currentTargetQuaternions.push(qXFlip);
        currentTargetQuaternions.push(qZFlip);
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
    const blockSize = 0.82;

    const blockMaterial = new THREE.MeshStandardMaterial({
        color: levelData.color,
        roughness: 0.20,
        metalness: 0.20
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
                const posZ = (Math.random() - 0.5) * 5.5;

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
        if (Math.abs(puzzleGroup.quaternion.dot(tq)) > 0.80) {
            tooClose = true;
            break;
        }
    }

    if (tooClose) {
        randomizeRotation();
    }
}

// --- 9. 포인터 입력 및 관성 모멘텀 (Momentum) 인터랙션 ---
window.addEventListener('pointerdown', (e) => {
    if (isIntroActive || e.target.closest('button') || e.target.closest('a') || e.target.closest('#intro-modal') || e.target.closest('#level-modal') || e.target.closest('#ending-modal') || e.target.closest('#hint-card-panel')) {
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
    if (isIntroActive || !isDragging || gameState !== 'playing') return;

    const deltaX = e.clientX - previousPointerPos.x;
    const deltaY = e.clientY - previousPointerPos.y;

    if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
        angularVelocity.x = deltaX * ROTATION_SPEED;
        angularVelocity.y = deltaY * ROTATION_SPEED;

        levelRotationCount++;
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

// --- 10. 실시간 승리 판정 & HUD 업데이트 ---
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
    if (gameState !== 'playing' || isIntroActive) return;

    let maxDot = 0;
    let bestTarget = null;

    for (let tq of currentTargetQuaternions) {
        const dot = Math.abs(puzzleGroup.quaternion.dot(tq));
        if (dot > maxDot) {
            maxDot = dot;
            bestTarget = tq;
        }
    }

    const rawPct = (maxDot - 0.72) / (0.990 - 0.72);
    const proximityPct = Math.round(Math.max(0, Math.min(1, rawPct)) * 100);

    const isNear = proximityPct >= 90;
    const isReady = maxDot > 0.980 || proximityPct >= 95;

    updateProximityHUD(proximityPct, isNear, isReady);

    if (isNear && !isDragging) {
        puzzleGroup.quaternion.slerp(bestTarget, 0.055);
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

// --- 11. 💡 힌트(Hint) 시스템 ---
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
    if (gameState !== 'playing' || isIntroActive) return;

    sound.playHint();
    
    const levelName = levels[currentLevelIndex].name;
    const nameEl = document.getElementById('hint-level-name');
    if (nameEl) nameEl.innerText = levelName;

    drawHintPreview();

    // GA4 힌트 사용 이벤트 로깅
    trackEvent('hint_view', {
        level_index: currentLevelIndex + 1,
        level_name: levelName
    });

    const hintPanel = document.getElementById('hint-card-panel');
    if (hintPanel) {
        hintPanel.classList.add('show');
    }

    const instruction = document.getElementById('instruction');
    instruction.innerHTML = `💡 <span class="text-yellow-300 font-bold">'${levelName}'</span> 목표 그림자를 확인하세요!`;

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



// --- 13. 📸 SPTI 결과 화면 렌더링 & 백그라운드 HD 인스타 카드 생성기 ---
let cachedMasterCanvas = null;

function renderResultScreen() {
    const totalSec = progress.stats.totalTime || 135;
    const totalRot = progress.stats.totalRotations || 88;
    const minutes = Math.floor(totalSec / 60);
    const seconds = Math.floor(totalSec % 60);
    const timeFormatted = `${minutes < 10 ? '0' : ''}${minutes}분 ${seconds < 10 ? '0' : ''}${seconds}초`;

    // 8대 동물 성향 판정
    const myType = determineAnimalType(totalSec, totalRot);

    // 1. 캐릭터 메인 섹션 주입
    const iconEl = document.getElementById('final-type-icon');
    const titleEl = document.getElementById('final-type-title');
    const engEl = document.getElementById('final-type-eng');
    const descEl = document.getElementById('final-type-desc');

    if (iconEl) {
        iconEl.innerText = myType.emoji;
        iconEl.style.borderColor = myType.badgeColor;
    }
    if (titleEl) {
        titleEl.innerText = myType.name;
        titleEl.style.color = myType.badgeColor;
    }
    if (engEl) engEl.innerText = myType.engName.toUpperCase();
    if (descEl) descEl.innerText = `"${myType.summary}"`;

    // 2. 4대 능력치 주입
    const setStat = (valId, barId, score) => {
        const valEl = document.getElementById(valId);
        const barEl = document.getElementById(barId);
        if (valEl) valEl.innerText = `${score}점`;
        if (barEl) {
            barEl.style.width = '0%';
            setTimeout(() => {
                barEl.style.width = `${score}%`;
            }, 50);
        }
    };

    setStat('stat-speed-val', 'stat-speed-bar', myType.stats.speed);
    setStat('stat-spatial-val', 'stat-spatial-bar', myType.stats.spatial);
    setStat('stat-precision-val', 'stat-precision-bar', myType.stats.precision);
    setStat('stat-focus-val', 'stat-focus-bar', myType.stats.focus);

    // 3. 특징 3줄 리스트 주입
    const traitsListEl = document.getElementById('final-traits-list');
    if (traitsListEl) {
        traitsListEl.innerHTML = '';
        myType.traits.forEach(t => {
            const li = document.createElement('li');
            li.innerText = t;
            traitsListEl.appendChild(li);
        });
    }

    // 4. 유형 궁합 주입 및 클릭 연결
    const goodEl = document.getElementById('final-match-good');
    const badEl = document.getElementById('final-match-bad');
    if (goodEl) {
        goodEl.innerText = myType.goodMatch;
        const goodBox = goodEl.parentElement;
        goodBox.style.cursor = 'pointer';
        goodBox.onclick = () => {
            const target = animalTypes.find(a => myType.goodMatch.includes(a.emoji));
            if (target) openTypeDetail(target);
        };
    }
    if (badEl) {
        badEl.innerText = myType.badMatch;
        const badBox = badEl.parentElement;
        badBox.style.cursor = 'pointer';
        badBox.onclick = () => {
            const target = animalTypes.find(a => myType.badMatch.includes(a.emoji));
            if (target) openTypeDetail(target);
        };
    }

    // 5. 완주 기록 주입
    const timeEl = document.getElementById('final-time-text');
    const rotEl = document.getElementById('final-rot-text');
    if (timeEl) timeEl.innerText = timeFormatted;
    if (rotEl) rotEl.innerText = `${totalRot}회`;

    // 6. 백그라운드 고화질 1080x1920 카드 렌더링 (이름 없이 초기 캐시)
    generateBackgroundMasterCanvas(myType, timeFormatted, totalRot, '');

    // 🌟 GA4 13코스 완주 및 SPTI 유형 진단 이벤트 로깅
    trackEvent('spti_complete', {
        spti_id: myType.id,
        spti_name: myType.name,
        total_time_sec: Math.round(totalSec * 10) / 10,
        total_rotations: totalRot
    });
}

function generateBackgroundMasterCanvas(myType, timeFormatted, totalRot, playerName = '') {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1080;
    offCanvas.height = 1920;
    const ctx = offCanvas.getContext('2d');

    // 1. 모던 파스텔 & 클린 미니멀 다크 배경 그라데이션
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.4, '#0f172a');
    bgGrad.addColorStop(1, '#060911');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. 부드러운 앰비언트 글로우 오브
    const drawGlowOrb = (x, y, radius, color, alpha) => {
        const radGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        radGrad.addColorStop(0, color);
        radGrad.addColorStop(1, 'transparent');
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    drawGlowOrb(240, 320, 480, myType.badgeColor, 0.22);
    drawGlowOrb(860, 1200, 520, '#38bdf8', 0.18);
    drawGlowOrb(540, 1650, 450, '#818cf8', 0.15);

    // 3. 카드 외곽 프레임
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, 960, 1800);

    ctx.strokeStyle = myType.badgeColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(72, 72, 936, 1776);
    ctx.globalAlpha = 1.0;

    // 4. 상단 헤더
    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 28px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEUNGMIN\'S LAB • 3D SPATIAL TYPE INDICATOR', 540, 150);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '900 52px "Noto Sans KR", Outfit, sans-serif';
    const titleName = (playerName && playerName.trim()) ? playerName.trim() : '나';
    ctx.fillText(`${titleName}의 공간 지각력 유형 진단서`, 540, 220);

    // 5. 메인 유형 캐릭터 카드 박스
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(110, 280, 860, 440, 32);
    ctx.fill();
    ctx.stroke();

    // 동물 캐릭터 이모지
    ctx.save();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.strokeStyle = myType.badgeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(540, 390, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '80px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(myType.emoji, 540, 418);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.fillStyle = myType.badgeColor;
    ctx.font = '900 52px "Noto Sans KR", sans-serif';
    ctx.fillText(myType.name, 540, 535);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 26px Outfit, sans-serif';
    ctx.fillText(myType.engName.toUpperCase(), 540, 580);

    ctx.fillStyle = '#f1f5f9';
    ctx.font = '600 28px "Noto Sans KR", sans-serif';
    ctx.fillText(`"${myType.summary}"`, 540, 655);

    // 6. 4대 능력치 막대 그래프
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(110, 750, 860, 370, 32);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 32px "Noto Sans KR", sans-serif';
    ctx.fillText('📊 4대 공간 지각 능력치', 160, 810);

    const statList = [
        { label: '⚡ 순발력 (Speed)', score: myType.stats.speed, color: '#facc15' },
        { label: '🧭 공간 지각력 (Spatial)', score: myType.stats.spatial, color: '#38bdf8' },
        { label: '🎯 조작 정밀도 (Precision)', score: myType.stats.precision, color: '#4ade80' },
        { label: '🧠 몰입 집중도 (Focus)', score: myType.stats.focus, color: '#c084fc' }
    ];

    statList.forEach((st, idx) => {
        const rowY = 865 + idx * 56;

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 24px "Noto Sans KR", sans-serif';
        ctx.fillText(st.label, 160, rowY);

        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.beginPath();
        ctx.roundRect(510, rowY - 18, 350, 20, 10);
        ctx.fill();

        ctx.fillStyle = st.color;
        ctx.beginPath();
        ctx.roundRect(510, rowY - 18, (350 * st.score) / 100, 20, 10);
        ctx.fill();

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 24px Outfit, sans-serif';
        ctx.fillText(`${st.score}점`, 920, rowY);
        ctx.textAlign = 'left';
    });

    // 7. 팩트 폭격 특징 3가지
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(110, 1150, 860, 280, 32);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 32px "Noto Sans KR", sans-serif';
    ctx.fillText('💡 유형 핵심 특징', 160, 1210);

    myType.traits.forEach((trait, idx) => {
        const tY = 1265 + idx * 48;
        ctx.fillStyle = myType.badgeColor;
        ctx.font = '700 24px "Noto Sans KR", sans-serif';
        ctx.fillText('•', 160, tY);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '500 24px "Noto Sans KR", sans-serif';
        ctx.fillText(trait, 190, tY);
    });

    // 8. 유형 궁합
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(110, 1460, 860, 170, 28);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px "Noto Sans KR", sans-serif';
    ctx.fillText('🤝 환상의 짝꿍', 320, 1515);
    ctx.fillText('💔 환장의 짝꿍', 750, 1515);

    ctx.fillStyle = '#4ade80';
    ctx.font = '800 30px "Noto Sans KR", sans-serif';
    ctx.fillText(myType.goodMatch, 320, 1575);

    ctx.fillStyle = '#f87171';
    ctx.font = '800 30px "Noto Sans KR", sans-serif';
    ctx.fillText(myType.badMatch, 750, 1575);

    // 9. 푸터
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 26px "Noto Sans KR", Outfit, sans-serif';
    ctx.fillText(`13코스 완주 기록: ${timeFormatted} (${totalRot}회 조작)`, 540, 1690);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 28px Outfit, sans-serif';
    ctx.fillText('https://seuuung.github.io/lab', 540, 1758);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 22px "Noto Sans KR", sans-serif';
    ctx.fillText('© 2026 Seungmin\'s Lab • Shadow Puzzle SPTI', 540, 1810);

    cachedMasterCanvas = offCanvas;
}

function showEndingModal() {
    const modal = document.getElementById('ending-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // 플로팅 공유 바 표시
    const floatBar = document.getElementById('result-float-bar');
    if (floatBar) floatBar.classList.remove('hidden');

    // 결과지 내부 패널에 플로팅 바 높이만큼 하단 패딩 부여
    const panel = modal.querySelector('.glass-panel');
    if (panel) panel.style.paddingBottom = '120px';

    renderResultScreen();
    renderExploreTypes();
    confetti.explode(new THREE.Vector3(0, 0, 10), 160);
    sound.playFanfare();
}

// --- 다른 유형 살펴보기 기능 ---
function renderExploreTypes() {
    const grid = document.getElementById('explore-types-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const myType = determineAnimalType(
        progress.stats.totalTime || 0,
        progress.stats.totalRotations || 0
    );

    animalTypes.forEach(t => {
        const card = document.createElement('button');
        card.className = 'type-mini-card' + (t.id === myType.id ? ' is-my-type' : '');
        card.setAttribute('data-type-id', t.id);
        card.style.borderColor = t.id === myType.id ? t.badgeColor + '80' : '';

        card.innerHTML = `
            <div class="type-mini-emoji" style="border-color:${t.badgeColor}60">${t.emoji}</div>
            <div class="type-mini-name">${t.name}${t.id === myType.id ? '<br><span style="color:#22d3ee;font-size:9px">✦ 내 유형</span>' : ''}</div>
        `;
        card.addEventListener('click', () => openTypeDetail(t));
        grid.appendChild(card);
    });
}

function openTypeDetail(t) {
    const overlay = document.getElementById('type-detail-overlay');
    if (!overlay) return;

    // 콘텐츠 채우기
    const badge = document.getElementById('detail-badge');
    badge.textContent = t.engName.toUpperCase();
    badge.style.color = t.badgeColor;
    badge.style.borderColor = t.badgeColor + '60';
    badge.style.background = t.badgeColor + '18';

    const iconEl = document.getElementById('detail-icon');
    iconEl.textContent = t.emoji;
    iconEl.style.borderColor = t.badgeColor;
    iconEl.style.boxShadow = `0 0 20px ${t.badgeColor}30`;

    document.getElementById('detail-name').textContent = t.name;
    document.getElementById('detail-name').style.color = t.badgeColor;
    document.getElementById('detail-eng').textContent = t.engName.toUpperCase();
    document.getElementById('detail-summary').textContent = `"${t.summary}"`;

    // 핵심 특징 3줄 (능력치 바 대신)
    const statsEl = document.getElementById('detail-stats');
    statsEl.innerHTML = t.traits.map(trait => `
        <div style="display:flex;gap:8px;align-items:flex-start;font-size:11px;color:#cbd5e1;line-height:1.55">
            <span style="color:${t.badgeColor};flex-shrink:0;margin-top:1px">▸</span>
            <span>${trait}</span>
        </div>
    `).join('');

    // 짝꿍 텍스트 주입
    const goodEl = document.getElementById('detail-good');
    const badEl = document.getElementById('detail-bad');
    goodEl.textContent = t.goodMatch;
    badEl.textContent = t.badMatch;

    // 부모 카드 전체에 클릭 이벤트 (기존 리스너 초기화 위해 cloneNode)
    const goodCard = goodEl.parentElement;
    const badCard  = badEl.parentElement;

    const newGoodCard = goodCard.cloneNode(true);
    const newBadCard  = badCard.cloneNode(true);
    goodCard.replaceWith(newGoodCard);
    badCard.replaceWith(newBadCard);

    newGoodCard.addEventListener('click', () => {
        const target = animalTypes.find(a => t.goodMatch.includes(a.emoji));
        if (target) openTypeDetail(target);
    });
    newBadCard.addEventListener('click', () => {
        const target = animalTypes.find(a => t.badMatch.includes(a.emoji));
        if (target) openTypeDetail(target);
    });

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

function closeTypeDetail() {
    const overlay = document.getElementById('type-detail-overlay');
    if (overlay) {
        overlay.classList.remove('flex');
        overlay.classList.add('hidden');
    }
}

// --- 14. 클립보드 이미지 복사 & 다운로드 & 챌린지 생성 ---
async function copyShareCardToClipboard() {
    trackEvent('viral_share', { action_type: 'instagram_story' });

    if (!cachedMasterCanvas) {
        renderResultScreen();
    }

    try {
        cachedMasterCanvas.toBlob(async (blob) => {
            if (!blob) {
                showShareStatus('이미지 생성 실패', true);
                return;
            }

            const file = new File([blob], 'shadow_puzzle_spti_result.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: '나의 공간 지각력 유형 진단서',
                        text: `🧩 나의 공간 지각 유형: ${document.getElementById('final-type-title').innerText} (SPTI)`,
                        files: [file]
                    });
                    showShareStatus('✅ 인스타그램/SNS 공유 시트가 열렸습니다.');
                    return;
                } catch (shareErr) {
                    console.log('User cancelled or share failed:', shareErr);
                }
            }

            if (navigator.clipboard && window.ClipboardItem) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    showShareStatus('✅ 결과 카드가 복사되었습니다! 인스타 스토리에 붙여넣기하세요.');
                    return;
                } catch (clipErr) {
                    console.warn('Clipboard write failed:', clipErr);
                }
            }

            downloadShareCard();
        }, 'image/png');
    } catch (e) {
        console.error(e);
        downloadShareCard();
    }
}

async function downloadShareCard() {
    trackEvent('viral_share', { action_type: 'download_card' });

    // 이름 입력 필드에서 이름 읽기
    const nameInput = document.getElementById('player-name-input');
    const playerName = nameInput ? nameInput.value.trim() : '';

    // 이름이 반영된 캔버스 재렌더링
    const totalSec = progress.stats.totalTime || 0;
    const totalRot = progress.stats.totalRotations || 0;
    const totalMin = Math.floor(totalSec / 60);
    const totalSecRem = Math.floor(totalSec % 60);
    const timeFormatted = `${String(totalMin).padStart(2, '0')}분 ${String(totalSecRem).padStart(2, '0')}초`;
    const myType = determineAnimalType(totalSec, totalRot);

    generateBackgroundMasterCanvas(myType, timeFormatted, totalRot, playerName);

    const namePart = playerName ? `_${playerName}` : '';
    const fileName = `shadow_puzzle_spti${namePart}_${Date.now()}.png`;

    if (!cachedMasterCanvas) {
        showShareStatus('⚠️ 카드 생성에 실패했습니다. 다시 시도해주세요.', true);
        return;
    }

    const dataUrl = cachedMasterCanvas.toDataURL('image/png');
    const ua = navigator.userAgent || '';
    const isInApp = /Instagram|FB|KAKAOTALK|NAVER|Line|Snapchat|TikTok|Twitter|Whale/i.test(ua);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

    // 1단계: 인앱 브라우저 -> 가짜 download 시도 및 허위 알림 차단, 즉시 롱프레스 모달 오픈
    if (isInApp) {
        openImageSaveModal(dataUrl);
        return;
    }

    // 2단계: 모바일 네이티브 브라우저 -> Web Share API 시도 및 모달 fallback
    if (isMobile) {
        try {
            cachedMasterCanvas.toBlob(async (blob) => {
                if (!blob) {
                    openImageSaveModal(dataUrl);
                    return;
                }

                const file = new File([blob], fileName, { type: 'image/png' });

                if (navigator.canShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'SPTI 나의 공간 지각력 유형 진단서',
                            text: `🧩 나의 3D 공간 지각 유형: ${myType.name}!`
                        });
                        return;
                    } catch (shareErr) {
                        if (shareErr.name === 'AbortError') {
                            return;
                        }
                        console.warn('Native Share failed, opening modal fallback:', shareErr);
                    }
                }

                openImageSaveModal(dataUrl);
            }, 'image/png');
            return;
        } catch (e) {
            console.warn('Mobile image share fallback:', e);
            openImageSaveModal(dataUrl);
            return;
        }
    }

    // 3단계: 데스크톱 브라우저 환경 -> <a download> 직접 다운로드 및 알림 토스트 출력
    try {
        cachedMasterCanvas.toBlob((blob) => {
            if (!blob) {
                const link = document.createElement('a');
                link.download = fileName;
                link.href = dataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showShareStatus('💾 진단서 이미지가 다운로드되었습니다.');
                return;
            }

            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = blobUrl;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
            showShareStatus('💾 진단서 이미지가 다운로드되었습니다.');
        }, 'image/png');
    } catch (downloadErr) {
        console.warn('Desktop download failed, opening modal fallback:', downloadErr);
        openImageSaveModal(dataUrl);
    }
}

function openImageSaveModal(imgDataUrl) {
    const modal = document.getElementById('image-save-modal');
    const img = document.getElementById('save-preview-img');
    if (!modal || !img) return;
    img.src = imgDataUrl;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeImageSaveModal() {
    const modal = document.getElementById('image-save-modal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

function getCleanBaseUrl() {
    let path = window.location.pathname.replace(/\/index\.html$/i, '');
    if (!path.endsWith('/')) path += '/';
    return window.location.origin + path;
}

function copyChallengeLink() {
    trackEvent('viral_share', { action_type: 'copy_challenge' });
    const totalSec = progress.stats.totalTime || 135;

    const challengeUrl = `${getCleanBaseUrl()}#c=${totalSec}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(challengeUrl).then(() => {
            showShareStatus('🔗 도전장 주소가 복사되었습니다!');
        });
    } else {
        prompt('도전장 주소를 복사하세요:', challengeUrl);
    }
}

function showShareStatus(msg, isError = false) {
    const statusMsg = document.getElementById('share-status-msg');
    if (!statusMsg) return;
    statusMsg.innerText = msg;
    statusMsg.className = `text-[11px] text-center font-semibold h-4 transition-opacity ${isError ? 'text-rose-400' : 'text-emerald-400'}`;
    setTimeout(() => {
        statusMsg.innerText = '';
    }, 4000);
}

// 챌린지 URL 파라미터 처리 (#c=135 또는 #challenge?time=135 호환)
function checkChallengeParams() {
    const hash = window.location.hash;
    if (!hash) return;

    let targetTime = null;
    if (hash.startsWith('#c=')) {
        targetTime = parseInt(hash.replace('#c=', ''), 10);
    } else if (hash.includes('challenge')) {
        const params = new URLSearchParams(hash.replace('#challenge?', ''));
        targetTime = parseInt(params.get('time'), 10);
    }

    if (targetTime && !isNaN(targetTime)) {
        const min = Math.floor(targetTime / 60);
        const sec = Math.floor(targetTime % 60);
        const banner = document.getElementById('challenge-banner');
        const bannerText = document.getElementById('challenge-banner-text');
        if (banner && bannerText) {
            bannerText.innerText = `⚔️ 라이벌 도전장: 친구의 완주 기록(${min}분 ${sec}초)에 도전 중!`;
            banner.classList.remove('hidden');
        }

        const introChallengeCard = document.getElementById('intro-challenge-card');
        const introChallengeText = document.getElementById('intro-challenge-text');
        if (introChallengeCard && introChallengeText) {
            introChallengeText.innerText = `친구의 13코스 완주 기록(${min}분 ${sec}초)을 돌파해 보세요!`;
            introChallengeCard.classList.remove('hidden');
        }
    }
}

// --- 15. 인트로 시작 / 게임 시작 컨트롤 ---
function startGame() {
    sound.init();
    isIntroActive = false;
    gameState = 'playing';

    trackEvent('game_start', {
        source: window.location.hash.includes('challenge') ? 'challenge_link' : 'direct',
        start_level: 1
    });

    const introModal = document.getElementById('intro-modal');
    if (introModal) {
        introModal.classList.add('hidden');
        introModal.classList.remove('flex');
    }

    loadLevel(0);
}

function startGameFromLevel(idx) {
    sound.init();
    isIntroActive = false;
    gameState = 'playing';

    trackEvent('game_start', {
        source: 'level_select',
        start_level: idx + 1
    });

    const introModal = document.getElementById('intro-modal');
    if (introModal) {
        introModal.classList.add('hidden');
        introModal.classList.remove('flex');
    }

    loadLevel(idx);
}

// --- 16. 메인 애니메이션 루프 ---
let lastTime = performance.now();

function animate(currentTime) {
    requestAnimationFrame(animate);

    const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    if (isIntroActive) {
        puzzleGroup.rotation.y += 0.008;
        puzzleGroup.rotation.x = Math.sin(currentTime * 0.001) * 0.2;
    } else if (!isDragging && gameState === 'playing') {
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

            const timeSec = (Date.now() - levelStartTime) / 1000;
            progress.saveLevelResult(currentLevelIndex, timeSec, levelRotationCount);

            // GA4 단계 클리어 이벤트 로깅
            trackEvent('level_clear', {
                level_index: currentLevelIndex + 1,
                level_name: levels[currentLevelIndex].name,
                duration_sec: Math.round(timeSec * 10) / 10,
                rotations: levelRotationCount
            });

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
    if (!isIntroActive) {
        puzzleGroup.position.y = basePuzzlePos.y + Math.sin(currentTime * 0.002) * 0.25;
    }

    renderer.render(scene, camera);
}

// --- 17. 이벤트 리스너 바인딩 ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    adjustLayoutForScreen();
});

document.getElementById('start-game-btn').addEventListener('click', () => {
    startGame();
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

    // 플로팅 공유 바 숨김
    const floatBar = document.getElementById('result-float-bar');
    if (floatBar) floatBar.classList.add('hidden');

    currentLevelIndex = 0;
    isIntroActive = false;
    gameState = 'playing';
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



// 테스트 공유 버튼 — 현재 페이지 링크를 클립보드에 복사 (오직 순수 주소만 복사)
document.getElementById('copy-story-btn').addEventListener('click', () => {
    sound.init();
    trackEvent('viral_share', { action_type: 'copy_link' });

    const shareUrl = getCleanBaseUrl();

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showShareStatus('🔗 테스트 주소가 복사되었습니다!');
        }).catch(() => {
            prompt('아래 주소를 복사하세요:', shareUrl);
        });
    } else {
        prompt('아래 주소를 복사하세요:', shareUrl);
    }
});

document.getElementById('download-card-btn').addEventListener('click', () => {
    sound.init();
    downloadShareCard();
});

// 다른 유형 살펴보기 — 아코디언 토글
document.getElementById('explore-types-btn').addEventListener('click', () => {
    const grid = document.getElementById('explore-types-grid');
    const chevron = document.getElementById('explore-chevron');
    const isHidden = grid.classList.contains('hidden');
    grid.classList.toggle('hidden', !isHidden);
    if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
});

// 유형 상세 팝업 닫기
document.getElementById('close-type-detail').addEventListener('click', closeTypeDetail);
document.getElementById('type-detail-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTypeDetail();
});

// 모바일 이미지 저장 모달 닫기
document.getElementById('close-image-modal').addEventListener('click', closeImageSaveModal);
document.getElementById('image-save-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeImageSaveModal();
});

// 🧭 iOS 인앱 브라우저 탈출 모달 제어
function checkInAppBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isOtherInApp = /Instagram|FBAN|FBAV|NAVER|Line|everytimeApp|DaumApps/i.test(ua);

    if (isIOS && isOtherInApp) {
        const inAppModal = document.getElementById('inapp-guide-modal');
        if (inAppModal) {
            inAppModal.classList.remove('hidden');
            inAppModal.classList.add('flex');
        }
    }
}

const copyInAppBtn = document.getElementById('copy-inapp-url-btn');
if (copyInAppBtn) {
    copyInAppBtn.addEventListener('click', () => {
        const url = getCleanBaseUrl();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                copyInAppBtn.innerHTML = '<span>✅</span><span>주소가 복사되었습니다! Safari에 붙여넣으세요</span>';
                copyInAppBtn.classList.remove('bg-cyan-500');
                copyInAppBtn.classList.add('bg-emerald-500');
            });
        } else {
            prompt('Safari에 붙여넣을 주소:', url);
        }
    });
}

const dismissInAppBtn = document.getElementById('dismiss-inapp-btn');
if (dismissInAppBtn) {
    dismissInAppBtn.addEventListener('click', () => {
        const inAppModal = document.getElementById('inapp-guide-modal');
        if (inAppModal) {
            inAppModal.classList.remove('flex');
            inAppModal.classList.add('hidden');
        }
    });
}

document.getElementById('sound-icon').innerText = sound.enabled ? '🔊' : '🔇';

// 초기 가동
adjustLayoutForScreen();
loadLevel(0);
checkInAppBrowser();
requestAnimationFrame(animate);
