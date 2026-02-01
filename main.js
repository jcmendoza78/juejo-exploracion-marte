// ===============================
// JUEGO EDUCATIVO – MARTE (Phaser 3)
// ===============================

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 700 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

let player, cursors, platforms, ladders;
let stations = [];
let uiText;

// ---------- PRELOAD ----------
function preload() {
  this.load.image("background", "assets/fondo.png");
  this.load.image("player", "assets/personaje.png");
  this.load.image("ground", "assets/ground.png");
  this.load.image("ladder", "assets/ladder.png");
  this.load.image("station", "assets/station.png");
  this.load.image("door", "assets/door.png");
  this.load.image("flag", "assets/flag.png");
}

// ---------- CREATE ----------
function create() {
  const WORLD_W = 3000;
  const WORLD_H = 600;

  // Mundo
  this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
  this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // Fondo con parallax
  this.bg = this.add
    .tileSprite(0, 0, config.width, config.height, "background")
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(-1);

  // Plataformas
  platforms = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_W; x += 200) {
    platforms.create(x + 100, WORLD_H - 20, "ground");
  }
  platforms.create(400, 480, "ground");
  platforms.create(800, 520, "ground");
  platforms.create(1200, 500, "ground");
  platforms.create(1600, 520, "ground");
  platforms.create(600, 300, "ground");
  platforms.create(1000, 320, "ground");
  platforms.create(1400, 340, "ground");
  platforms.create(2000, 300, "ground");

  // Escaleras
  ladders = this.physics.add.staticGroup();
  ladders.create(600, 390, "ladder");
  ladders.create(1000, 410, "ladder");
  ladders.create(2000, 360, "ladder");

  // Jugador
  player = this.physics.add.sprite(100, 450, "player");
  player.setCollideWorldBounds(true);
  player.setBounce(0.05);
  player.body.setSize(player.width * 0.6, player.height * 0.9);

  // Cámara
  this.cameras.main.startFollow(player, true, 0.08, 0.08);

  // Colisiones
  this.physics.add.collider(player, platforms);

  // Estaciones educativas
  const stationData = [
    { x: 400, y: 260, title: "Atmósfera" },
    { x: 800, y: 500, title: "Agua" },
    { x: 1200, y: 300, title: "Geología" },
    { x: 1600, y: 520, title: "Misiones" },
    { x: 2000, y: 280, title: "Radiación" }
  ];

  stationData.forEach(data => {
    const s = this.physics.add.staticSprite(data.x, data.y, "station");
    s.setData("title", data.title);
    s.setData("completed", false);
    stations.push(s);
  });

  this.physics.add.overlap(player, stations, stationTouched, null, this);

  // Puerta y bandera
  this.door = this.physics.add.staticSprite(WORLD_W - 600, WORLD_H - 120, "door");
  this.flag = this.physics.add.staticSprite(WORLD_W - 200, WORLD_H - 120, "flag");
  this.physics.add.collider(player, this.door);

  this.physics.add.overlap(player, this.flag, () => {
    if (stations.every(s => s.getData("completed"))) {
      showEndMessage.call(this);
    }
  });

  // Controles
  cursors = this.input.keyboard.createCursorKeys();

  // UI
  uiText = this.add
    .text(16, 16, "", { font: "16px Arial", fill: "#ffffff" })
    .setScrollFactor(0);

  updateUI();
}

// ---------- UPDATE ----------
function update() {
  const speed = 220;

  if (cursors.left.isDown) {
    player.setVelocityX(-speed);
    player.flipX = true;
  } else if (cursors.right.isDown) {
    player.setVelocityX(speed);
    player.flipX = false;
  } else {
    player.setVelocityX(0);
  }

  // Salto
  if (cursors.up.isDown && player.body.blocked.down) {
    player.setVelocityY(-420);
  }

  // Escaleras
  let onLadder = false;
  ladders.children.iterate(ladder => {
    if (Phaser.Geom.Intersects.RectangleToRectangle(player.getBounds(), ladder.getBounds())) {
      onLadder = true;
    }
  });

  if (onLadder && cursors.up.isDown) {
    player.body.allowGravity = false;
    player.setVelocityY(-150);
  } else {
    player.body.allowGravity = true;
  }

  // Parallax del fondo
  this.bg.tilePositionX = this.cameras.main.scrollX * 0.5;
  this.bg.tilePositionY = this.cameras.main.scrollY * 0.2;

  updateUI();
}
// ---------- FUNCIONES ----------

function stationTouched(player, station) {
  if (station.getData("completed")) return;

  station.setTint(0x6ee7b7);
  station.setData("completed", true);

  const text = this.add.text(
    station.x - 40,
    station.y - 50,
    "✔ " + station.getData("title"),
    { font: "14px Arial", fill: "#6ee7b7" }
  );

  this.tweens.add({
    targets: text,
    y: text.y - 30,
    alpha: 0,
    duration: 1200,
    onComplete: () => text.destroy()
  });
}

function updateUI() {
  const done = stations.filter(s => s.getData("completed")).length;
  uiText.setText(`Estaciones: ${done} / ${stations.length}`);
}

function showEndMessage() {
  this.add
    .rectangle(400, 300, 500, 200, 0x000000, 0.8)
    .setScrollFactor(0);

  this.add
    .text(400, 260, "MISIÓN COMPLETADA", {
      font: "28px Arial",
      fill: "#ffd166"
    })
    .setOrigin(0.5)
    .setScrollFactor(0);

  this.add
    .text(400, 310, "Explorador Marciano 🏅", {
      font: "18px Arial",
      fill: "#ffffff"
    })
    .setOrigin(0.5)
    .setScrollFactor(0);
}
