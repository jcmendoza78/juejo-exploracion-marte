// main.js - Versión Corregida y Jerarquizada para Phaser 3
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// ---------- Preload ----------
function preload() {
  this.load.image('ground', 'assets/ground.png');
  this.load.image('ladder', 'assets/ladder.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('station', 'assets/station.png');
  this.load.image('door', 'assets/door.png');
  this.load.image('flag', 'assets/flag.png');
  this.load.image('fondo', 'assets/fondo.png');
}

// ---------- Create ----------
function create() {
  const WORLD_W = 3000;
  const WORLD_H = 600;
  this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
  this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // Texturas de respaldo (por si fallan los assets)
  ensureProceduralTextures.call(this);

  // Fondo con parallax
  this.fondo = this.add.tileSprite(0, 0, config.width, config.height, 'fondo')
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(-1);

  // Plataformas
  this.platforms = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_W; x += 200) {
    this.platforms.create(x + 100, WORLD_H - 20, 'ground').refreshBody();
  }

  // Rutas
  [500, 520, 540, 520, 540].forEach((y, i) => this.platforms.create(400 + (i * 400), y, 'ground').refreshBody());
  [300, 320, 340, 300, 320].forEach((y, i) => this.platforms.create(400 + (i * 400), y, 'ground').refreshBody());

  // Escaleras
  this.ladders = this.physics.add.staticGroup();
  const ladderPos = [{x: 600, y: 400}, {x: 1000, y: 420}, {x: 2100, y: 360}];
  ladderPos.forEach(pos => {
    let l = this.ladders.create(pos.x, pos.y, 'ladder');
    l.body.setSize(40, 160);
  });

  // Jugador
  this.player = this.physics.add.sprite(100, 450, 'player');
  this.player.setCollideWorldBounds(true).setBounce(0.05);

  // Controles
  this.cursors = this.input.keyboard.createCursorKeys();
  
  // Datos de estaciones
  this.stationsData = [
    { id: 0, title: 'Atmósfera', x: 400, y: 260, route: 'high', facts: ['95% CO2'] },
    { id: 1, title: 'Agua', x: 800, y: 480, route: 'low', facts: ['Hielo subterráneo'] },
    { id: 2, title: 'Geología', x: 1200, y: 300, route: 'high', facts: ['Monte Olimpo'] }
  ];

  this.stations = this.physics.add.staticGroup();
  this.stationSprites = [];
  this.highRouteStations = [];

  this.stationsData.forEach(st => {
    const sprite = this.stations.create(st.x, st.y, 'station');
    sprite.setData('meta', st);
    this.stationSprites.push(sprite);
    if (st.route === 'high') this.highRouteStations.push(sprite);
  });

  // Colisiones y Overlaps
  this.physics.add.collider(this.player, this.platforms);
  this.physics.add.overlap(this.player, this.ladders, (p) => p.setData('onLadderZone', true));
  this.physics.add.overlap(this.player, this.stations, (p, s) => {
    if (!s.getData('completed')) startStationSequence.call(this, s);
  });

  // Puerta y Bandera
  this.door = this.physics.add.staticSprite(WORLD_W - 600, WORLD_H - 120, 'door');
  this.physics.add.collider(this.player, this.door);
  this.flag = this.physics.add.staticSprite(WORLD_W - 200, WORLD_H - 120, 'flag');

  // UI
  this.score = 0;
  this.badges = { allComplete: false, highRouteComplete: false };
  this.uiText = this.add.text(12, 12, '', { font: '16px Arial', fill: '#fff' }).setScrollFactor(0);
  
  createBitacora.call(this);
  this.input.keyboard.on('keydown-B', () => toggleBitacora.call(this));
}

// ---------- Update ----------
function update(time, delta) {
  const speed = 200;
  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-speed);
    this.player.flipX = true;
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(speed);
    this.player.flipX = false;
  } else {
    this.player.setVelocityX(0);
  }

  // Escaleras
  if (this.player.getData('onLadderZone') && (this.cursors.up.isDown || this.cursors.down.isDown)) {
    this.player.body.allowGravity = false;
    this.player.setVelocityY(this.cursors.up.isDown ? -120 : 120);
  } else {
    this.player.body.allowGravity = true;
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.player.body.blocked.down) {
      this.player.setVelocityY(-360);
    }
  }
  this.player.setData('onLadderZone', false); // Reset para el siguiente frame

  this.fondo.tilePositionX = this.cameras.main.scrollX * 0.5;
  updateUI.call(this);
  checkHighRouteBadge.call(this);
}

// ---------- Helpers ----------

function ensureProceduralTextures() {
  const g = this.make.graphics({ x: 0, y: 0, add: false });
  if (!this.textures.exists('fondo')) {
    g.fillStyle(0x4a1a13, 1);
    g.fillRect(0, 0, 800, 600);
    g.generateTexture('fondo', 800, 600);
  }
  if (!this.textures.exists('ground')) {
    g.clear(); g.fillStyle(0x7a5c3a, 1); g.fillRect(0, 0, 200, 32);
    g.generateTexture('ground', 200, 32);
  }
  if (!this.textures.exists('player')) {
    g.clear(); g.fillStyle(0xff6f61, 1); g.fillRect(0, 0, 32, 48);
    g.generateTexture('player', 32, 48);
  }
  if (!this.textures.exists('station')) {
    g.clear(); g.fillStyle(0xffd166, 1); g.fillCircle(16, 16, 16);
    g.generateTexture('station', 32, 32);
  }
}

function startStationSequence(stationSprite) {
  const meta = stationSprite.getData('meta');
  stationSprite.setData('completed', true);
  stationSprite.setTint(0x6ee7b7);
  this.score += 100;
  
  if (this.stationSprites.every(s => s.getData('completed'))) {
    if (this.door) this.door.destroy();
  }
}

function createBitacora() {
  this.bitacoraContainer = this.add.container(20, 60).setScrollFactor(0).setVisible(false);
  const bg = this.add.rectangle(0, 0, 300, 200, 0x000000, 0.8).setOrigin(0);
  this.bitacoraText = this.add.text(10, 10, 'Bitácora', { font: '14px Arial', fill: '#fff' });
  this.bitacoraContainer.add([bg, this.bitacoraText]);
}

function toggleBitacora() {
  const v = !this.bitacoraContainer.visible;
  this.bitacoraContainer.setVisible(v);
  if (v) {
    let txt = "ESTACIONES:\n";
    this.stationsData.forEach(s => txt += `${s.title}: ${s.completed ? 'OK' : '...'}\n`);
    this.bitacoraText.setText(txt);
  }
}

function updateUI() {
  const completed = this.stationSprites.filter(s => s.getData('completed')).length;
  this.uiText.setText(`Exploración: ${completed}/${this.stationSprites.length}\nScore: ${this.score}`);
}

function checkHighRouteBadge() {
  if (this.badges.highRouteComplete) return;
  const allHigh = this.highRouteStations.every(s => s.getData('completed'));
  if (allHigh && this.highRouteStations.length > 0) {
    this.badges.highRouteComplete = true;
    console.log("¡Insignia Ruta Alta obtenida!");
  }
}
