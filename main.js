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
  // Cargar sprites básicos (puedes reemplazar por tus propios PNG)
  this.load.image('ground', 'assets/ground.png');   // plataforma
  this.load.image('ladder', 'assets/ladder.png');   // escalera
  this.load.image('player', 'assets/player.png');   // jugador
  this.load.image('station', 'assets/station.png'); // estación educativa
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
  this.platforms.create(400, 500, 'ground');
  this.platforms.create(800, 520, 'ground');
  this.platforms.create(1200, 540, 'ground');
  // Ruta alta
  this.platforms.create(400, 300, 'ground');
  this.platforms.create(800, 320, 'ground');
  this.platforms.create(1200, 340, 'ground');

  this.physics.add.collider(this.player, this.platforms);

  // Escaleras (decorativas, sin colisión)
  this.add.image(600, 400, 'ladder');
  this.add.image(1000, 420, 'ladder');

  // Estaciones educativas
  this.stationsData = [
    { title: 'Atmósfera', x: 400, y: 260, fact: '95% CO2' },
    { title: 'Agua y hielo', x: 800, y: 480, fact: 'Casquetes polares' },
    { title: 'Geología', x: 1200, y: 300, fact: 'Monte Olimpo' },
    { title: 'Misiones', x: 1600, y: 500, fact: 'Curiosity desde 2012' },
    { title: 'Radiación', x: 2000, y: 280, fact: 'Mayor que en la Tierra' },
    { title: 'Comunicación', x: 2400, y: 320, fact: '20 min de retraso' }
  ];

  this.stations = this.physics.add.staticGroup();
  this.stationsData.forEach(st => {
    let s = this.stations.create(st.x, st.y, 'station');
    s.title = st.title;
    s.fact = st.fact;
    s.completed = false;
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

  // Métodos dentro de la escena
  this.startStationChallenge = (station) => {
    station.completed = true;
    station.setTint(0x0000ff); // cambia color al completarse

    if (this.stationsData.every(st => st.completed)) {
      this.unlockGoal();
      this.showBadge();
    }
  };

  this.toggleLog = () => {
    this.logVisible = !this.logVisible;
    this.logText.setVisible(this.logVisible);
    if (this.logVisible) {
      let content = '📖 Bitácora Marciana\n\n';
      this.stationsData.forEach(st => {
        content += `${st.completed ? '✔️' : '❌'} ${st.title}: ${st.completed ? st.fact : 'Pendiente'}\n`;
      });
      this.logText.setText(content);
    }
  };

  this.unlockGoal = () => {
    this.add.text(600, 100, '🚪 Puerta desbloqueada', { fontSize: '20px', fill: '#0f0' }).setScrollFactor(0);
  };

  this.showBadge = () => {
    this.add.text(200, 150, '🏅 Insignia: Explorador Marciano', { fontSize: '20px', fill: '#ff0' }).setScrollFactor(0);
  };
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

  if (this.cursors.up.isDown && this.player.body.blocked.down) {
    this.player.setVelocityY(jumpVelocity);
  }
}
