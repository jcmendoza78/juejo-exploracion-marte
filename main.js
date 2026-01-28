// main.js
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

function preload() {
  // Texturas placeholder
  this.textures.generate('ground', { data: ['B'], pixelWidth: 32, pixelHeight: 16 });
  this.textures.generate('ladder', { data: ['L'], pixelWidth: 16, pixelHeight: 64 });
  this.textures.generate('player', { data: ['P'], pixelWidth: 32, pixelHeight: 32 });
}

function create() {
  // Mundo y cámara
  this.physics.world.setBounds(0, 0, 3000, 600);
  this.cameras.main.setBounds(0, 0, 3000, 600);

  // Jugador
  this.player = this.physics.add.sprite(100, 450, 'player');
  this.player.setCollideWorldBounds(true);

  // Controles
  this.cursors = this.input.keyboard.createCursorKeys();

  // Plataformas
  this.platforms = this.physics.add.staticGroup();
  // Ruta baja
  this.platforms.create(400, 500, 'ground').refreshBody();
  this.platforms.create(800, 520, 'ground').refreshBody();
  this.platforms.create(1200, 540, 'ground').refreshBody();
  // Ruta alta
  this.platforms.create(400, 300, 'ground').refreshBody();
  this.platforms.create(800, 320, 'ground').refreshBody();
  this.platforms.create(1200, 340, 'ground').refreshBody();
  // Escaleras
  this.ladders = this.physics.add.staticGroup();
  this.ladders.create(600, 400, 'ladder');
  this.ladders.create(1000, 420, 'ladder');

  this.physics.add.collider(this.player, this.platforms);

  // Estaciones educativas
  this.stationsData = [
    { key: 'atm', title: 'Atmósfera marciana', x: 400, y: 260, fact: 'La atmósfera es 95% CO2' },
    { key: 'agua', title: 'Agua y hielo', x: 800, y: 480, fact: 'Existen casquetes polares de hielo' },
    { key: 'geo', title: 'Geología marciana', x: 1200, y: 300, fact: 'Monte Olimpo es el volcán más grande' },
    { key: 'mis', title: 'Misiones a Marte', x: 1600, y: 500, fact: 'Curiosity explora desde 2012' },
    { key: 'rad', title: 'Radiación espacial', x: 2000, y: 280, fact: 'La radiación es mayor que en la Tierra' },
    { key: 'com', title: 'Comunicación interplanetaria', x: 2400, y: 320, fact: 'La señal tarda ~20 min' }
  ];

  this.stations = this.physics.add.staticGroup();
  this.stationsData.forEach(st => {
    let s = this.add.rectangle(st.x, st.y, 40, 40, 0x00ff00);
    this.physics.add.existing(s, true);
    s.key = st.key;
    s.title = st.title;
    s.fact = st.fact;
    s.completed = false;
    this.stations.add(s);
  });

  this.physics.add.overlap(this.player, this.stations, (player, station) => {
    if (!station.completed) {
      this.startStationChallenge(station);
    }
  }, null, this);

  // Bitácora
  this.logVisible = false;
  this.logText = this.add.text(20, 20, '', { fontSize: '16px', fill: '#fff' })
    .setScrollFactor(0).setVisible(false);

  this.input.keyboard.on('keydown-B', () => { this.toggleLog(); });
  this.input.keyboard.on('keydown-M', () => { this.toggleLog(); });

  // Cámara sigue al jugador
  this.cameras.main.startFollow(this.player);
}

function update() {
  const speed = 200;
  const jumpVelocity = -350;

  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-speed);
  } else if (this.cursors.right.isDown) {
    this.player.setVelocityX(speed);
  } else {
    this.player.setVelocityX(0);
  }

  if (this.cursors.up.isDown && this.player.body.touching.down) {
    this.player.setVelocityY(jumpVelocity);
  }
}

// --- Métodos auxiliares ---
function startStationChallenge(station) {
  // Aquí irían los mini-retos (quiz, verdadero/falso, etc.)
  // Por ahora simulamos completado:
  station.completed = true;
  station.fillColor = 0x0000ff;

  // Verificar si todas completadas
  if (this.stationsData.every(st => st.completed)) {
    this.unlockGoal();
    this.showBadge();
  }
}

function toggleLog() {
  this.logVisible = !this.logVisible;
  this.logText.setVisible(this.logVisible);
  if (this.logVisible) {
    let content = '📖 Bitácora Marciana\n\n';
    this.stationsData.forEach(st => {
      content += `${st.completed ? '✔️' : '❌'} ${st.title}: ${st.completed ? st.fact : 'Pendiente'}\n`;
    });
    this.logText.setText(content);
  }
}

function unlockGoal() {
  this.add.text(600, 100, '🚪 Puerta desbloqueada', { fontSize: '20px', fill: '#0f0' }).setScrollFactor(0);
}

function showBadge() {
  this.add.text(200, 150, '🏅 Insignia: Explorador Marciano', { fontSize: '20px', fill: '#ff0' }).setScrollFactor(0);
}
