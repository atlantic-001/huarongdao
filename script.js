const board = document.getElementById('board');
const stepsEl = document.getElementById('steps');
const rankList = document.getElementById('rankList');

const grid = 75;
const COLS = 4;
const ROWS = 5;

let stepCount = 0;

function initBlocks() {
    return [
        { id: 'cao', x: 1, y: 0, w: 2, h: 2, type: 'cao' },

        { id: 'v1', x: 0, y: 0, w: 1, h: 2, type: 'vert' },
        { id: 'v2', x: 3, y: 0, w: 1, h: 2, type: 'vert' },
        { id: 'v3', x: 0, y: 2, w: 1, h: 2, type: 'vert' },
        { id: 'v4', x: 3, y: 2, w: 1, h: 2, type: 'vert' },

        { id: 'h1', x: 1, y: 2, w: 2, h: 1, type: 'hori' },

        { id: 's1', x: 1, y: 3, w: 1, h: 1, type: 'small' },
        { id: 's2', x: 2, y: 3, w: 1, h: 1, type: 'small' },
        { id: 's3', x: 0, y: 4, w: 1, h: 1, type: 'small' },
        { id: 's4', x: 3, y: 4, w: 1, h: 1, type: 'small' }
    ];
}

let blocks = initBlocks();

let current = null;
let startX = 0;
let startY = 0;
let direction = null;

function getName(id) {
    const map = {
        cao: '曹操',
        v1: '关羽',
        v2: '张飞',
        v3: '赵云',
        v4: '马超',
        h1: '黄忠',
        s1: '兵',
        s2: '兵',
        s3: '兵',
        s4: '兵'
    };
    return map[id] || '';
}

function getMap(ignoreId = null) {
    const map = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    blocks.forEach(b => {
        if (b.id === ignoreId) return;
        for (let y = 0; y < b.h; y++) {
            for (let x = 0; x < b.w; x++) {
                map[b.y + y][b.x + x] = b.id;
            }
        }
    });

    return map;
}

// ✅ 只能移动一格 + 不越子
function canMoveOne(block, dx, dy) {
    const newX = block.x + dx;
    const newY = block.y + dy;

    if (newX < 0 || newY < 0) return false;
    if (newX + block.w > COLS) return false;
    if (newY + block.h > ROWS) return false;

    const map = getMap(block.id);

    for (let y = 0; y < block.h; y++) {
        for (let x = 0; x < block.w; x++) {
            if (map[newY + y][newX + x]) return false;
        }
    }

    return true;
}

function render() {
    board.innerHTML = '';

    blocks.forEach(b => {
        const div = document.createElement('div');
        div.className = `block ${b.type}`;

        div.style.left = b.x * grid + 'px';
        div.style.top = b.y * grid + 'px';
        div.style.width = b.w * grid + 'px';
        div.style.height = b.h * grid + 'px';

        div.innerText = getName(b.id);

        // 👇 统一鼠标 + 触摸
        div.addEventListener('mousedown', startDrag);
        div.addEventListener('touchstart', startDrag);

        board.appendChild(div);
    });

    stepsEl.innerText = stepCount;
}

function startDrag(e) {
    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;

    current = blocks[[...document.querySelectorAll('.block')].indexOf(e.target)];

    startX = point.clientX;
    startY = point.clientY;
    direction = null;

    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
}

function moveDrag(e) {
    if (!current) return;

    const point = e.touches ? e.touches[0] : e;

    const dx = point.clientX - startX;
    const dy = point.clientY - startY;

    if (!direction) {
        direction = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
}

function endDrag(e) {
    if (!current) return;

    const point = e.changedTouches ? e.changedTouches[0] : e;

    const dx = point.clientX - startX;
    const dy = point.clientY - startY;

    let dirX = 0;
    let dirY = 0;

    if (Math.abs(dx) > Math.abs(dy)) {
        dirX = dx > 20 ? 1 : dx < -20 ? -1 : 0;
    } else {
        dirY = dy > 20 ? 1 : dy < -20 ? -1 : 0;
    }

    // ✅ 连续移动（直到被挡住）
    let moved = false;
    while (canMoveOne(current, dirX, dirY)) {
        current.x += dirX;
        current.y += dirY;
        stepCount++;
        moved = true;

        playMoveSound(); // 🔊 音效
    }

    // ✅ 通关动画
    if (current.id === 'cao' && current.x === 1 && current.y === 3) {
        animateWin();
        return;
    }

    current = null;
    render();

    document.removeEventListener('mousemove', moveDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', moveDrag);
    document.removeEventListener('touchend', endDrag);
}

const moveAudio = new Audio("move.mp3");

function playMoveSound() {
    moveAudio.currentTime = 0;
    moveAudio.play();
}

function animateWin() {
    const el = [...document.querySelectorAll('.block')]
    [blocks.findIndex(b => b.id === 'cao')];

    if (!el) return;

    // 往下滑出出口
    el.style.transition = 'all 0.4s ease';
    el.style.top = (ROWS * grid) + 'px';

    setTimeout(() => {
        const name = prompt("通关！请输入你的名字：") || "匿名";
        saveRecord(name, stepCount);
        alert(`通关成功！步数：${stepCount}`);
        resetGame();
    }, 500);
}

function resetGame() {
    blocks = initBlocks();
    stepCount = 0;
    render();
}

// 排行榜
function saveRecord(name, steps) {
    let list = JSON.parse(localStorage.getItem("rank") || "[]");

    list.push({
        name,
        steps,
        date: new Date().toLocaleDateString()
    });

    list.sort((a, b) => a.steps - b.steps);
    list = list.slice(0, 3);

    localStorage.setItem("rank", JSON.stringify(list));
    renderRank();
}

function renderRank() {
    const list = JSON.parse(localStorage.getItem("rank") || "[]");

    rankList.innerHTML = '';

    list.forEach((r, i) => {
        const li = document.createElement('li');
        li.innerText = `${i + 1}. ${r.name} - ${r.steps}步 (${r.date})`;
        rankList.appendChild(li);
    });
}

render();
renderRank();