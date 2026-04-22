/* ============================================================
   CONFIGURACIÓN GENERAL
============================================================ */
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WORLD_HEIGHT = 600;

const PLAYER_SPEED = 200;
const JUMP_FORCE = 360;
const CLIMB_SPEED = 130;
const GRAVITY_Y = 600;

const COYOTE_TIME = 120;
const JUMP_BUFFER = 150;
const AUTOSAVE_INTERVAL = 2000;

/* ============================================================
   DEFINICIÓN DE NIVELES (DESBLOQUEO PROGRESIVO)
============================================================ */
const LEVELS = [
  {
    id: 1,
    name: "Exploración Inicial",
    unlocked: true,
    worldWidth: 3000,
    playerStart: { x: 100, y: 450 },
    stations: [
      { id: 0, title: "Atmósfera", x: 400, y: 260, facts: ["95% CO2"] },
      { id: 1, title: "Agua y hielo", x: 800, y: 480, facts: ["Casquetes polares"] }
    ]
  },
  {
    id: 2,
    name: "Superficie Marciana",
    unlocked: false,
    worldWidth: 4000,
    playerStart: { x: 120, y: 450 },
    stations: [
      { id: 2, title: "Geología", x: 900, y: 300, facts: ["Monte Olimpo"] },
      { id: 3, title: "Misiones", x: 1500, y: 480, facts: ["Curiosity y Perseverance"] }
    ]
  },
  {
    id: 3,
    name: "Riesgos del Planeta",
    unlocked: false,
    worldWidth: 4500,
    playerStart: { x: 120, y: 450 },
    stations: [
      { id: 4, title: "Radiación", x: 2200, y: 260, facts: ["Radiación alta"] },
      { id: 5, title: "Comunicación", x: 3500, y: 320, facts: ["Retraso de señal"] }
    ]
  }
];

let currentLevelIndex = 0;
let unlockedLevels = 1;

/* ============================================================
   CONFIG PHASER
============================================================ */
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: GRAVITY_Y }, debug: false }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

/* ============================================================
   PRELOAD
============================================================ */
function preload() {
  ["ground","ladder","player","station","door","flag"].forEach(k =>
    this.load.image(k, `assets/${k}.png`)
  );

  if (!this.textures.exists("background")) {
    const g = this.add.graphics();
    g.fillStyle(0x061433, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.generateTexture("background", GAME_WIDTH, GAME_HEIGHT);
    g.destroy();
  }
}

/* ============================================================
   CREATE
============================================================ */
function create() {
  this.score = 0;
  this.lastSave = 0;

  this.cursors = this.input.keyboard.createCursorKeys();
  this.physics.world.setBounds(0, 0, GAME_WIDTH, WORLD_HEIGHT);

  loadProgress.call(this);
  loadLevel.call(this, currentLevelIndex);

  this.uiText = this.add.text(12, 12, "", {
    font: "16px Arial", fill: "#fff"
  }).setScrollFactor(0);
}

/* ============================================================
   LOAD LEVEL
============================================================ */
function loadLevel(levelIndex) {
  const level = LEVELS[levelIndex];
  if (!level || !level.unlocked) return;

  this.children.removeAll();
  this.physics.world.colliders.destroy();

  this.currentLevel = level;
  this.completedStations = 0;
  this.totalStations = level.stations.length;

  this.physics.world.setBounds(0, 0, level.worldWidth, WORLD_HEIGHT);
  this.cameras.main.setBounds(0, 0, level.worldWidth, WORLD_HEIGHT);

  this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "background")
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(-1);

  // Plataformas
  this.platforms = this.physics.add.staticGroup();
  for (let x = 0; x < level.worldWidth; x += 200)
    this.platforms.create(x + 100, WORLD_HEIGHT - 20, "ground");

  // Jugador
  this.player = this.physics.add.sprite(
    level.playerStart.x,
    level.playerStart.y,
    "player"
  ).setScale(0.5).setCollideWorldBounds(true);

  this.physics.add.collider(this.player, this.platforms);
  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

  // Estaciones
  this.stations = this.physics.add.staticGroup();
  level.stations.forEach(st => {
    const sp = this.stations.create(st.x, st.y, "station");
    sp.setData("meta", st);
    sp.setData("completed", false);
  });

  this.physics.add.overlap(this.player, this.stations, (_, st) => {
    if (!st.getData("completed")) completeStation.call(this, st);
  });

  // Meta
  this.flag = this.physics.add.staticSprite(
    level.worldWidth - 200, WORLD_HEIGHT - 120, "flag"
  );

  this.physics.add.overlap(this.player, this.flag, () => {
    if (this.completedStations === this.totalStations)
      onLevelComplete.call(this);
  });
}

/* ============================================================
   UPDATE
============================================================ */
function update(_, delta) {
  if (!this.player) return;

  if (this.cursors.left.isDown) this.player.setVelocityX(-PLAYER_SPEED);
  else if (this.cursors.right.isDown) this.player.setVelocityX(PLAYER_SPEED);
  else this.player.setVelocityX(0);

  if (this.cursors.up.isDown && this.player.body.blocked.down)
    this.player.setVelocityY(-JUMP_FORCE);

  this.lastSave += delta;
  if (this.lastSave > AUTOSAVE_INTERVAL) {
    saveProgress.call(this);
    this.lastSave = 0;
  }

  this.uiText.setText([
    `Nivel: ${this.currentLevel.id}`,
    `Estaciones: ${this.completedStations}/${this.totalStations}`,
    `Puntos: ${this.score}`
  ]);
}

/* ============================================================
   ESTACIONES Y PROGRESO
============================================================ */
function completeStation(station) {
  station.setTint(0x6ee7b7);
  station.setData("completed", true);
  this.completedStations++;
  this.score += 100;
  saveProgress.call(this);
}

function onLevelComplete() {
  this.score += 500;

  if (unlockedLevels === currentLevelIndex + 1 && LEVELS[currentLevelIndex + 1]) {
    unlockedLevels++;
    LEVELS[currentLevelIndex + 1].unlocked = true;
  }

  saveProgress.call(this);

  this.time.delayedCall(1200, () => {
    currentLevelIndex++;
    loadLevel.call(this, currentLevelIndex);
  });
}

/* ============================================================
   GUARDADO
============================================================ */
function saveProgress() {
  localStorage.setItem("marsGameProgress", JSON.stringify({
    score: this.score,
    unlockedLevels,
    currentLevelIndex
  }));
}

function loadProgress() {
  try {
    const d = JSON.parse(localStorage.getItem("marsGameProgress"));
    if (!d) return;

    this.score = d.score || 0;
    unlockedLevels = d.unlockedLevels || 1;
    currentLevelIndex = Math.min(d.currentLevelIndex || 0, unlockedLevels - 1);

    LEVELS.forEach((l, i) => l.unlocked = i < unlockedLevels);
  } catch {}
}
``
