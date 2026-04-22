/* ============================================================
   CONFIGURACIÓN Y CONSTANTES
============================================================ */
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 600;

const PLAYER_SPEED = 200;
const JUMP_FORCE = 360;
const CLIMB_SPEED = 130;
const GRAVITY_Y = 600;

const COYOTE_TIME = 120;
const JUMP_BUFFER = 150;
const AUTOSAVE_INTERVAL = 2000;

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
  this.load.image("ground", "assets/ground.png");
  this.load.image("ladder", "assets/ladder.png");
  this.load.image("player", "assets/player.png");
  this.load.image("station", "assets/station.png");
  this.load.image("door", "assets/door.png");
  this.load.image("flag", "assets/flag.png");

  createSolidBackground(this, "background", 0x061433);
}

function createSolidBackground(scene, key, color) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  g.generateTexture(key, GAME_WIDTH, GAME_HEIGHT);
  g.destroy();
}

/* ============================================================
   CREATE
============================================================ */
function create() {
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  this.bg = this.add
    .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "background")
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(-1);

  createPlatforms.call(this);
  createPlayer.call(this);
  createLadders.call(this);
  createStations.call(this);
  createGoal.call(this);
  createUI.call(this);
  createBitacora.call(this);
  setupInput.call(this);

  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

  this.coyoteTimer = 0;
  this.jumpBufferTimer = 0;
  this.lastSave = 0;
}

/* ============================================================
   CREATE HELPERS
============================================================ */
function createPlatforms() {
  this.platforms = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_WIDTH; x += 200) {
    this.platforms.create(x + 100, WORLD_HEIGHT - 20, "ground");
  }
}

function createPlayer() {
  this.player = this.physics.add.sprite(100, 450, "player").setScale(0.5);
  this.player.setCollideWorldBounds(true);
  this.player.setBounce(0.05);
  this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.9);
  this.player.body.setOffset(this.player.width * 0.2, 0);

  this.physics.add.collider(this.player, this.platforms);
}

function createLadders() {
  this.ladders = this.physics.add.staticGroup();
  [
    { x: 600, y: 400 },
    { x: 1000, y: 420 },
    { x: 2100, y: 360 }
  ].forEach(pos => {
    const l = this.ladders.create(pos.x, pos.y, "ladder");
    l.body.setSize(40, 160).setOffset(-20, -80);
  });
}

function createStations() {
  this.stationsData = [
    { id: 0, title: "Atmósfera", x: 400, y: 260, facts: ["95% CO2", "Presión muy baja"] },
    { id: 1, title: "Agua y hielo", x: 800, y: 480, facts: ["Casquetes polares", "Hielo subterráneo"] },
    { id: 2, title: "Geología", x: 1200, y: 300, facts: ["Monte Olimpo", "Cráteres abundantes"] },
    { id: 3, title: "Misiones", x: 1600, y: 500, facts: ["Curiosity 2012", "Perseverance 2021"] },
    { id: 4, title: "Radiación", x: 2000, y: 280, facts: ["Radiación alta", "Protección necesaria"] },
    { id: 5, title: "Comunicación", x: 2400, y: 320, facts: ["Retraso 20 min", "Orbitadores"] }
  ];

  loadProgress.call(this);

  this.stations = this.physics.add.staticGroup();
  this.stationSprites = [];

  this.stationsData.forEach(st => {
    const sp = this.stations.create(st.x, st.y, "station");
    sp.setData("meta", st);
    sp.setData("completed", !!st.completed);
    if (st.completed) sp.setTint(0x6ee7b7);
    this.stationSprites.push(sp);
  });

  this.physics.add.overlap(this.player, this.stations, (p, st) => {
    if (!st.getData("completed")) startStationSequence.call(this, st);
  });

  this.totalStations = this.stationSprites.length;
  this.completedStations = this.stationSprites.filter(s => s.getData("completed")).length;
}

function createGoal() {
  this.door = this.physics.add.staticSprite(WORLD_WIDTH - 600, WORLD_HEIGHT - 120, "door");
  this.flag = this.physics.add.staticSprite(WORLD_WIDTH - 200, WORLD_HEIGHT - 120, "flag");
  this.flag.setData("reached", false);

  this.physics.add.overlap(this.player, this.flag, () => {
    if (
      !this.flag.getData("reached") &&
      this.stationSprites.every(s => s.getData("completed"))
    ) {
      this.flag.setData("reached", true);
      onLevelComplete.call(this);
    }
  });
}

function setupInput() {
  this.cursors = this.input.keyboard.createCursorKeys();
  this.input.keyboard.on("keydown-B", () => toggleBitacora.call(this));
  this.input.keyboard.on("keydown-M", () => toggleBitacora.call(this));
}

/* ============================================================
   UPDATE
============================================================ */
function update(time, delta) {
  handleMovement.call(this);
  handleJump.call(this, delta);
  handleLadders.call(this);
  autosave.call(this, delta);
  updateUI.call(this);
}

/* ============================================================
   PLAYER LOGIC
============================================================ */
function handleMovement() {
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-PLAYER_SPEED);
    this.player.flipX = true;
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(PLAYER_SPEED);
    this.player.flipX = false;
  } else {
    this.player.setVelocityX(0);
  }
}

function handleJump(delta) {
  if (this.player.body.blocked.down) this.coyoteTimer = COYOTE_TIME;
  else this.coyoteTimer -= delta;

  if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
    this.jumpBufferTimer = JUMP_BUFFER;
  } else {
    this.jumpBufferTimer -= delta;
  }

  if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
    this.player.setVelocityY(-JUMP_FORCE);
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
  }
}

function handleLadders() {
  const onLadder = this.physics.overlap(this.player, this.ladders);
  this.player.body.allowGravity = !onLadder;

  if (onLadder) {
    if (this.cursors.up.isDown) this.player.setVelocityY(-CLIMB_SPEED);
    else if (this.cursors.down.isDown) this.player.setVelocityY(CLIMB_SPEED);
    else this.player.setVelocityY(0);
  }
}

/* ============================================================
   STATIONS
============================================================ */
function startStationSequence(stationSprite) {
  this.player.body.enable = false;

  const meta = stationSprite.getData("meta");
  const steps = [
    { type: "info", text: meta.facts[0] }
  ];

  showStationUI.call(this, stationSprite, steps);
}

function showStationUI(stationSprite, steps) {
  if (this.stationUI) this.stationUI.destroy(true);

  const cam = this.cameras.main;
  const x = cam.worldView.centerX;
  const y = cam.worldView.centerY;

  const c = this.add.container(x, y).setDepth(1000);
  c.add(this.add.rectangle(0, 0, 440, 160, 0x071126, 0.95).setOrigin(0.5));
  c.add(this.add.text(0, -20, steps[0].text, { font: "18px Arial", fill: "#fff" }).setOrigin(0.5));

  const btn = this.add
    .text(0, 40, "Continuar", { font: "16px Arial", backgroundColor: "#6ee7b7", color: "#000", padding: 10 })
    .setOrigin(0.5)
    .setInteractive();

  btn.on("pointerdown", () => finishStation.call(this, stationSprite));

  c.add(btn);
  this.stationUI = c;
}

function finishStation(stationSprite) {
  const meta = stationSprite.getData("meta");
  stationSprite.setData("completed", true);
  stationSprite.setTint(0x6ee7b7);
  meta.completed = true;

  this.player.body.enable = true;
  this.stationUI.destroy();

  this.completedStations++;
  this.score += 100;

  saveProgress.call(this);
}

/* ============================================================
   UI, BITÁCORA Y PROGRESO
============================================================ */
function createUI() {
  this.score = 0;
  this.uiText = this.add.text(12, 12, "", { font: "16px Arial", fill: "#fff" }).setScrollFactor(0);
}

function updateUI() {
  this.uiText.setText([
    `Estaciones: ${this.completedStations}/${this.totalStations}`,
    `Puntos: ${this.score}`,
    `Bitácora: B / M`
  ]);
}

function createBitacora() {
  this.bitacoraVisible = false;
  this.bitacoraContainer = this.add.container(20, 60).setScrollFactor(0).setDepth(1000);
  this.bitacoraContainer.add(this.add.rectangle(0, 0, 360, 420, 0x02121f, 0.95).setOrigin(0));
  this.bitacoraContainer.add(this.add.text(16, 12, "Bitácora Marciana", { fill: "#fff" }));
  this.bitacoraContainer.setVisible(false);
}

function toggleBitacora() {
  this.bitacoraVisible = !this.bitacoraVisible;
  this.bitacoraContainer.setVisible(this.bitacoraVisible);
}

function autosave(delta) {
  this.lastSave += delta;
  if (this.lastSave > AUTOSAVE_INTERVAL) {
    saveProgress.call(this);
    this.lastSave = 0;
  }
}

function saveProgress() {
  const payload = {
    stations: this.stationsData.map(s => ({
      id: s.id,
      completed: !!s.completed
    })),
    score: this.score
  };
  localStorage.setItem("marsGameProgress", JSON.stringify(payload));
}

function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem("marsGameProgress"));
    if (!data) return;
    this.score = data.score || 0;
    data.stations.forEach(saved => {
      const st = this.stationsData.find(s => s.id === saved.id);
      if (st) st.completed = saved.completed;
    });
  } catch {}
}

function onLevelComplete() {
  this.score += 500;
  saveProgress.call(this);
}
``
