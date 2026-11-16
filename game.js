const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelText = document.getElementById('levelText');
const hpText = document.getElementById('hpText');
const xpText = document.getElementById('xpText');
const killsText = document.getElementById('killsText');
const upgradePanel = document.getElementById('upgradePanel');
const upgradeCards = document.getElementById('upgradeCards');
const startPanel = document.getElementById('startPanel');
const startButton = document.getElementById('startButton');
const fireButton = document.getElementById('fireButton');
const joystickArea = document.getElementById('joystickArea');
const joystickBase = document.getElementById('joystickBase');
const joystickKnob = document.getElementById('joystickKnob');

const state = {
  running: false,
  paused: false,
  width: window.innerWidth,
  height: window.innerHeight,
  time: 0,
  kills: 0,
  enemyTimer: 0,
};

const player = {
  x: 0,
  y: 0,
  radius: 18,
  speed: 220,
  hp: 100,
  maxHp: 100,
  damage: 18,
  fireCooldown: 0,
  fireRate: 0.3,
  bulletSpeed: 420,
  bullets: [],
  xp: 0,
  level: 1,
  xpToNext: 100,
  bulletsPerShot: 1,
};

let enemies = [];
let particles = [];
let moveInput = { x: 0, y: 0 };
let fireHeld = false;
let pointerActive = false;
let joystickPointerId = null;

const upgradePool = [
  {
    id: 'bullet',
    name: 'Stronger Bullets',
    description: 'Increase bullet damage by 25%.',
    apply: () => {
      player.damage *= 1.25;
    },
  },
  {
    id: 'speed',
    name: 'Quick Feet',
    description: 'Increase movement speed by 18%.',
    apply: () => {
      player.speed *= 1.18;
    },
  },
  {
    id: 'fire',
    name: 'Faster Fire',
    description: 'Reduce reload time by 15%.',
    apply: () => {
      player.fireRate *= 0.85;
    },
  },
  {
    id: 'shield',
    name: 'Energy Shield',
    description: 'Recover health and increase max HP.',
    apply: () => {
      player.maxHp += 20;
      player.hp = player.maxHp;
    },
  },
  {
    id: 'double',
    name: 'Double Shot',
    description: 'Fire two projectiles per shot.',
    apply: () => {
      player.bulletsPerShot = Math.min(player.bulletsPerShot + 1, 3);
    },
  },
  {
    id: 'burst',
    name: 'Burst Rounds',
    description: 'Increase projectile speed by 20%.',
    apply: () => {
      player.bulletSpeed *= 1.2;
    },
  },
];

function resizeCanvas() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * window.devicePixelRatio;
  canvas.height = state.height * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

  if (!state.running) {
    player.x = state.width / 2;
    player.y = state.height / 2;
  }
}

function resetGame() {
  player.x = state.width / 2;
  player.y = state.height / 2;
  player.hp = 100;
  player.maxHp = 100;
  player.damage = 18;
  player.fireCooldown = 0;
  player.fireRate = 0.3;
  player.bulletSpeed = 420;
  player.bullets = [];
  player.xp = 0;
  player.level = 1;
  player.xpToNext = 100;
  player.bulletsPerShot = 1;
  player.speed = 220;

  enemies = [];
  particles = [];
  state.kills = 0;
  state.enemyTimer = 0;
  state.paused = false;

  addEnemy();
  updateHud();
}

function updateHud() {
  levelText.textContent = String(player.level);
  hpText.textContent = `${Math.ceil(player.hp)} / ${player.maxHp}`;
  xpText.textContent = `${Math.floor(player.xp)} / ${player.xpToNext}`;
  killsText.textContent = String(state.kills);
}

function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      radius: 2 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 140,
      vy: (Math.random() - 0.5) * 140,
      life: 0.5 + Math.random() * 0.7,
      maxLife: 0.5 + Math.random() * 0.7,
      color,
    });
  }
}

function spawnEnemy() {
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (edge === 0) {
    x = Math.random() * state.width;
    y = -30;
  } else if (edge === 1) {
    x = state.width + 30;
    y = Math.random() * state.height;
  } else if (edge === 2) {
    x = Math.random() * state.width;
    y = state.height + 30;
  } else {
    x = -30;
    y = Math.random() * state.height;
  }

  const hp = 25 + player.level * 4 + Math.random() * 12;
  enemies.push({
    x,
    y,
    radius: 14 + Math.random() * 8,
    hp,
    maxHp: hp,
    speed: 35 + Math.random() * 30 + player.level * 3,
    color: `hsl(${Math.random() * 30 + 120}, 80%, 55%)`,
  });
}

function addEnemy() {
  const count = Math.min(1 + Math.floor(player.level / 2), 5);
  for (let i = 0; i < count; i++) spawnEnemy();
}

function shootBullet() {
  if (player.fireCooldown > 0 || !state.running) return;

  const shotCount = player.bulletsPerShot;
  const spread = shotCount > 1 ? 0.22 : 0;

  for (let i = 0; i < shotCount; i++) {
    const angleOffset = shotCount === 1 ? 0 : (i - (shotCount - 1) / 2) * spread;
    const angle = Math.atan2((state.height / 2) - player.y, (state.width / 2) - player.x) + angleOffset;

    player.bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * player.bulletSpeed,
      vy: Math.sin(angle) * player.bulletSpeed,
      radius: 5,
      life: 1.3,
      color: '#7dd3fc',
    });
  }

  player.fireCooldown = player.fireRate;
}

function handleMovement(dt) {
  const moveX = moveInput.x;
  const moveY = moveInput.y;
  const length = Math.hypot(moveX, moveY) || 1;

  const dx = (moveX / length) * player.speed * dt;
  const dy = (moveY / length) * player.speed * dt;

  player.x = clamp(player.x + dx, player.radius, state.width - player.radius);
  player.y = clamp(player.y + dy, player.radius, state.height - player.radius);
}

function updateBullets(dt) {
  for (let i = player.bullets.length - 1; i >= 0; i--) {
    const bullet = player.bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (bullet.life <= 0 || bullet.x < -20 || bullet.x > state.width + 20 || bullet.y < -20 || bullet.y > state.height + 20) {
      player.bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        enemy.hp -= player.damage;
        player.bullets.splice(i, 1);
        createParticles(bullet.x, bullet.y, '#7dd3fc', 6);
        if (enemy.hp <= 0) {
          killEnemy(j);
        }
        break;
      }
    }
  }
}

function killEnemy(index) {
  const enemy = enemies[index];
  createParticles(enemy.x, enemy.y, enemy.color, 18);
  enemies.splice(index, 1);
  state.kills += 1;
  player.xp += 20;

  if (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext = Math.floor(player.xpToNext * 1.45);
    openUpgradePanel();
  }

  updateHud();
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;

    if (dist < enemy.radius + player.radius) {
      const damage = 10 + player.level * 1.2;
      player.hp -= damage * dt * 1.2;
      if (player.hp <= 0) {
        endGame();
      }
    }
  }
}

function endGame() {
  state.paused = true;
  startPanel.classList.remove('hidden');
  startButton.textContent = 'Restart';
  state.running = false;
}

function openUpgradePanel() {
  state.paused = true;

  const cards = [...upgradePool].sort(() => Math.random() - 0.5).slice(0, 3);
  upgradeCards.innerHTML = '';

  cards.forEach((card) => {
    const button = document.createElement('button');
    button.className = 'upgrade-card';
    button.innerHTML = `<h3>${card.name}</h3><p>${card.description}</p>`;
    button.addEventListener('click', () => {
      card.apply();
      upgradePanel.classList.add('hidden');
      state.paused = false;
      updateHud();
    });
    upgradeCards.appendChild(button);
  });

  upgradePanel.classList.remove('hidden');
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function update(dt) {
  if (!state.running || state.paused) return;

  state.time += dt;
  state.enemyTimer -= dt;
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);

  if (fireHeld) {
    shootBullet();
  }

  handleMovement(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateParticles(dt);

  if (state.enemyTimer <= 0) {
    addEnemy();
    state.enemyTimer = Math.max(0.7, 1.4 - player.level * 0.05);
  }

  updateHud();
}

function drawBackground() {
  ctx.fillStyle = '#0b1018';
  ctx.fillRect(0, 0, state.width, state.height);

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < state.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.height);
    ctx.stroke();
  }
  for (let y = 0; y < state.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.width, y);
    ctx.stroke();
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(-6, -2, 12, 4);
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, enemy.radius * 2, 6);
  ctx.fillStyle = '#86efac';
  ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 12, (enemy.hp / enemy.maxHp) * enemy.radius * 2, 6);
}

function drawBullets() {
  player.bullets.forEach((bullet) => {
    ctx.fillStyle = bullet.color;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawGame() {
  drawBackground();
  drawBullets();
  enemies.forEach(drawEnemy);
  drawParticles();
  drawPlayer();
}

function gameLoop(timestamp) {
  if (!gameLoop.lastTime) gameLoop.lastTime = timestamp;
  const dt = Math.min((timestamp - gameLoop.lastTime) / 1000, 0.033);
  gameLoop.lastTime = timestamp;

  update(dt);
  drawGame();
  requestAnimationFrame(gameLoop);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setupJoystick() {
  const baseRect = joystickBase.getBoundingClientRect();

  const updateJoystick = (clientX, clientY) => {
    const rect = joystickArea.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const maxDist = rect.width * 0.32;
    const dist = Math.min(Math.hypot(dx, dy), maxDist);
    const angle = Math.atan2(dy, dx);
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;

    joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
    moveInput.x = (x / maxDist) * 1;
    moveInput.y = (y / maxDist) * 1;
  };

  joystickArea.addEventListener('pointerdown', (event) => {
    joystickPointerId = event.pointerId;
    joystickArea.setPointerCapture(event.pointerId);
    updateJoystick(event.clientX, event.clientY);
  });

  joystickArea.addEventListener('pointermove', (event) => {
    if (event.pointerId !== joystickPointerId) return;
    updateJoystick(event.clientX, event.clientY);
  });

  const resetJoystick = () => {
    joystickPointerId = null;
    joystickKnob.style.transform = 'translate(0px, 0px)';
    moveInput.x = 0;
    moveInput.y = 0;
  };

  joystickArea.addEventListener('pointerup', resetJoystick);
  joystickArea.addEventListener('pointercancel', resetJoystick);
  joystickArea.addEventListener('pointerleave', resetJoystick);
}

function setupFireButton() {
  fireButton.addEventListener('pointerdown', () => {
    fireHeld = true;
    shootBullet();
  });
  fireButton.addEventListener('pointerup', () => {
    fireHeld = false;
  });
  fireButton.addEventListener('pointerleave', () => {
    fireHeld = false;
  });
}

function setupKeyboard() {
  const keys = {};
  window.addEventListener('keydown', (event) => {
    keys[event.key.toLowerCase()] = true;
    if (event.key === ' ') {
      fireHeld = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
    if (event.key === ' ') {
      fireHeld = false;
    }
  });

  setInterval(() => {
    if (!state.running || state.paused) return;

    moveInput.x = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
    moveInput.y = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
  }, 16);
}

function startGame() {
  state.running = true;
  state.paused = false;
  startPanel.classList.add('hidden');
  upgradePanel.classList.add('hidden');
  resetGame();
  state.running = true;
}

startButton.addEventListener('click', startGame);

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
setupJoystick();
setupFireButton();
setupKeyboard();

player.x = state.width / 2;
player.y = state.height / 2;
state.running = false;
updateHud();
requestAnimationFrame(gameLoop);
