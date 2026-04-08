document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

const board = document.getElementById('board');
const stepsEl = document.getElementById('steps');

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
let originX = 0;
let originY = 0;
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

function canMove(block, newX, newY) {
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

        div.addEventListener('touchstart', (e) => {
            current = b;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;

            originX = b.x;
            originY = b.y;
            direction = null;

            div.style.transition = 'none'; // 拖动时取消动画
        });

        board.appendChild(div);
    });

    stepsEl.innerText = stepCount;
}

document.addEventListener('touchmove', (e) => {
    if (!current) return;

    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (!direction) {
        direction = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    let moveX = direction === 'x' ? dx / grid : 0;
    let moveY = direction === 'y' ? dy / grid : 0;

    let newX = originX + moveX;
    let newY = originY + moveY;

    newX = Math.max(0, Math.min(COLS - current.w, newX));
    newY = Math.max(0, Math.min(ROWS - current.h, newY));

    const el = [...document.querySelectorAll('.block')][blocks.indexOf(current)];
    if (el) {
        el.style.left = newX * grid + 'px';
        el.style.top = newY * grid + 'px';
    }
});

document.addEventListener('touchend', (e) => {
    if (!current) return;

    const dx = (e.changedTouches[0].clientX - startX) / grid;
    const dy = (e.changedTouches[0].clientY - startY) / grid;

    let targetX = originX;
    let targetY = originY;

    if (direction === 'x') {
        targetX = Math.round(originX + dx);
    } else {
        targetY = Math.round(originY + dy);
    }

    if (canMove(current, targetX, targetY)) {
        current.x = targetX;
        current.y = targetY;
        stepCount++;
    }

    if (current.id === 'cao' && current.x === 1 && current.y === 3) {
        setTimeout(() => alert(`通关！步数：${stepCount}`), 100);
    }

    current = null;
    render();
});

function resetGame() {
    blocks = initBlocks();
    stepCount = 0;
    render();
}

render();