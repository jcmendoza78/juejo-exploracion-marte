/* ============================================================
   CONFIGURACIÓN GENERAL
============================================================ */
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WORLD_HEIGHT = 600;

const PLAYER_SPEED = 220;
const JUMP_FORCE = 380;
const GRAVITY_Y = 700;
const AUTOSAVE_INTERVAL = 2000;

/* ============================================================
   NIVELES
============================================================ */
const LEVELS = [
  {
    id: 1,
    unlocked: true,
    worldWidth: 3000,
    playerStart: { x: 100, y: 450 },
    stations: [
      { id: 0, title: "Atmósfera", x: 400, y: 260 },
      { id: 1, title: "Agua y hielo", x: 800, y: 480 }
    ]
  },
  {
    id: 2,
    unlocked: false,
    worldWidth: 4000,
    playerStart: { x: 120, y: 450 },
    stations: [
      { id: 2, title: "Geología", x: 900, y: 300 },
      { id: 3, title: "Misiones", x: 1500, y: 480 }
    ]
  }
];

let currentLevelIndex = 0;
let unlockedLevels = 1;

/* ============================================================
   PHASER CONFIG
============================================================ */
const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: "arcade",
    arcade: { gravity: { y: GRAVITY_Y }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

/* ============================================================
   PRELOAD
============================================================ */
function preload() {
  this.load.image("ground", "assets/ground.png");
  this.load.image("station", "assets/station.png");
  this.load.image("flag", "assets/flag.png");

  // NUEVO JUGADOR DINÁMICO
  this.load.spritesheet("player", "assets/player.png", {
    frameWidth: 512,
    frameHeight: 512
  });

  // FONDO MARTE
  this.load.image("marsBg", "assets/mars_background.png");
}

/* ============================================================
   CREATE
============================================================ */
function create() {
  this.score = 0;
  this.lastSave = 0;
  this.cursors = this.input.keyboard.createCursorKeys();

  this.input.once("pointerdown", () => {
    if (!this.scale.isFullscreen) this.scale.startFullscreen();
  });

  loadProgress.call(this);
  loadLevel.call(this, currentLevelIndex);

  this.uiText = this.add.text(12, 12, "", {
    font: "16px Arial", fill: "#fff"
  }).setScrollFactor(0);
}

/* ============================================================
   LOAD LEVEL
============================================================ */
function loadLevel(index) {
  const level = LEVELS[index];
  if (!level || !level.unlocked) return;

  this.children.removeAll();
  this.physics.world.colliders.destroy();

  this.completedStations = 0;
  this.totalStations = level.stations.length;

  this.physics.world.setBounds(0, 0, level.worldWidth, WORLD_HEIGHT);
  this.cameras.main.setBounds(0, 0, level.worldWidth, WORLD_HEIGHT);

  this.add.image(0, 0, "marsBg").setOrigin(0).setScrollFactor(0);

  // Plataformas
  this.platforms = this.physics.add.staticGroup();
  for (let x = 0; x < level.worldWidth; x += 200)
    this.platforms.create(x + 100, WORLD_HEIGHT - 20, "ground");

  // Jugador animado
  this.player = this.physics.add.sprite(
    level.playerStart.x,
    level.playerStart.y,
    "player"
  ).setScale(0.18).setCollideWorldBounds(true);

  this.anims.create({
    key: "run",
    frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
  });

  this.physics.add.collider(this.player, this.platforms);
  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

  // Estaciones
  this.stations = this.physics.add.staticGroup();
  level.stations.forEach(s => {
    const sp = this.stations.create(s.x, s.y, "station");
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

  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-PLAYER_SPEED);
    this.player.setFlipX(true);
    this.player.play("run", true);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(PLAYER_SPEED);
    this.player.setFlipX(false);
    this.player.play("run", true);
  } else {
    this.player.setVelocityX(0);
    this.player.anims.stop();
  }

  if (this.cursors.up.isDown && this.player.body.blocked.down)
    this.player.setVelocityY(-JUMP_FORCE);

  this.lastSave += delta;
  if (this.lastSave > AUTOSAVE_INTERVAL) {
    saveProgress.call(this);
    this.lastSave = 0;
  }

  this.uiText.setText([
    `Nivel: ${LEVELS[currentLevelIndex].id}`,
    `Estaciones: ${this.completedStations}/${this.totalStations}`,
    `Puntos: ${this.score}`
  ]);
}

/* ============================================================
   PROGRESO
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

  this.time.delayedCall(1000, () => {
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
