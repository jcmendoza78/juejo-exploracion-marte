// ===================== main.js =====================
window.onload = function() {
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
  new Phaser.Game(config);
};

let cursors;
let player;
let scoreText;
let score = 0;

function preload() {}

function create() {
  // Fondo
  this.add.rectangle(400, 300, 800, 600, 0x222233);

  // Plataformas base
  const platforms = this.physics.add.staticGroup();
  platforms.create(400, 580, 'ground').setScale(2).refreshBody();

  // Ruta baja (fácil)
  platforms.create(200, 450, 'ground').setScale(0.5).refreshBody();
  platforms.create(600, 400, 'ground').setScale(0.5).refreshBody();
  platforms.create(1000, 350, 'ground').setScale(0.5).refreshBody();

  // Ruta alta (retadora)
  platforms.create(400, 250, 'ground').setScale(0.5).refreshBody();
  platforms.create(800, 200, 'ground').setScale(0.5).refreshBody();
  platforms.create(1200, 150, 'ground').setScale(0.5).refreshBody();

  // Escaleras (conectores)
  const ladders = this.physics.add.staticGroup();
  ladders.create(600, 300, 'ladder').setScale(0.2, 2).refreshBody();
  ladders.create(1000, 250, 'ladder').setScale(0.2, 2).refreshBody();

  // Jugador
  player = this.physics.add.sprite(100, 450, 'player');
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  // Cámara
  this.cameras.main.setBounds(0, 0, 1600, 600);
  this.physics.world.setBounds(0, 0, 1600, 600);
  this.cameras.main.startFollow(player);

  // Controles
  cursors = this.input.keyboard.createCursorKeys();

  // Texto puntuación
  scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);

  // ===================== ESTACIONES EDUCATIVAS =====================
  this.stationsData = [
    { key: 'atm', title: 'Atmósfera', info: 'Marte tiene atmósfera delgada de CO2' },
    { key: 'agua', title: 'Agua/Hielo', info: 'Existen casquetes polares de hielo' },
    { key: 'geo', title: 'Geología', info: 'Monte Olimpo es el volcán más grande' },
    { key: 'mis', title: 'Misiones', info: 'Rovers como Perseverance exploran Marte' },
    { key: 'rad', title: 'Radiación', info: 'Alta radiación por falta de campo magnético' },
    { key: 'com', title: 'Comunicación', info: 'Retraso de señal ~20 minutos con la Tierra' }
  ];

  this.stations = this.physics.add.group();
  this.stationsData.forEach((st, i) => {
    let x = 400 + i * 250;
    let y = (i % 2 === 0) ? 300 : 180;
    let station = this.add.rectangle(x, y, 40, 40, 0x00ff00);
    this.physics.add.existing(station, true);
    station.key = st.key;
    station.title = st.title;
    station.info = st.info;
    station.completed = false;
    this.stations.add(station);
  });

  this.physics.add.overlap(player, this.stations, (player, station) => {
    if (!station.completed) {
      let success = true; // aquí irían tus quizzes
      if (success) {
        station.completed = true;
        station.fillColor = 0x0000ff;
        score += 10;
        scoreText.setText('Puntos: ' + score);
        this.updateLog(station.title, station.info);
        this.checkStationsComplete();
      }
    }
  }, null, this);

  // ===================== BITÁCORA MARCIANA =====================
  this.logVisible = false;
  this.logText = this.add.text(20, 60, '', { fontSize: '14px', fill: '#fff' }).setScrollFactor(0).setVisible(false);

  this.updateLog = (title, info) => {
    let completed = this.stationsData.filter(s => s.completed).map(s => `✔ ${s.title}: ${s.info}`);
    this.logText.setText('Bitácora Marciana:\n' + completed.join('\n'));
  };

  this.input.keyboard.on('keydown-B', () => {
    this.logVisible = !this.logVisible;
    this.logText.setVisible(this.logVisible);
  });
  this.input.keyboard.on('keydown-M', () => {
    this.logVisible = !this.logVisible;
    this.logText.setVisible(this.logVisible);
  });

  // ===================== META Y PUERTA =====================
  this.door = this.add.rectangle(1500, 500, 50, 100, 0xff0000);
  this.physics.add.existing(this.door, true);
  this.physics.add.collider(player, this.door);

  this.checkStationsComplete = () => {
    let allDone = this.stationsData.every(s => s.completed);
    if (allDone) {
      this.door.destroy();
      this.add.text(player.x, player.y - 50, '¡Insignia: Explorador Marciano!', { fontSize: '16px', fill: '#ff0' });
    }
  };
}

function update() {
  player.setVelocityX(0);

  if (cursors.left.isDown) {
    player.setVelocityX(-200);
  } else if (cursors.right.isDown) {
    player.setVelocityX(200);
  }

  // salto con coyote time + buffer simplificado
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-350);
  }
}
