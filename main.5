class MarsEduPlatformer extends Phaser.Scene {
  constructor() {
    super('mars-edu');
  }

  create() {

    this.gameStarted = false; // ✅ control inicio

    this.WORLD_W = 7400;
    this.WORLD_H = 1800;
    this.groundY = this.WORLD_H - 80;

    this.cameras.main.setBackgroundColor('#0b1d3a');
    this.createProceduralTextures();

    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    this.bg = this.add.tileSprite(0, 0, this.WORLD_W, this.WORLD_H, 'marsSky')
      .setOrigin(0, 0)
      .setScrollFactor(0.2);

    this.platforms = this.physics.add.staticGroup();

    for (let x = 0; x < this.WORLD_W; x += 256) {
      const g = this.platforms.create(x, this.groundY, 'ground');
      g.setOrigin(0, 0.5);
      g.refreshBody();
    }

    this.player = this.physics.add.sprite(140, this.groundY - 140, 'astronaut');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    this.cursors = this.input.keyboard.createCursorKeys();

    // ========================
    // 🎮 PANTALLA INICIO
    // ========================
    const w = this.scale.width;
    const h = this.scale.height;

    this.startOverlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.9)
      .setScrollFactor(0)
      .setDepth(1000);

    this.startText = this.add.text(w/2, h/2, 'Clic para iniciar', {
      fontFamily: 'Arial',
      fontSize: '42px',
      color: '#ffffff'
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1001);

    // ========================
    // 🎧 SONIDO DE FONDO
    // ========================
    this.bgMusic = new Audio('musica.mp3'); // ✅ agrega tu archivo
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.4;

    // ✅ FIX: clic global (FUNCIONA SIEMPRE)
    this.input.once('pointerdown', () => {
      this.startOverlay.destroy();
      this.startText.destroy();
      this.gameStarted = true;

      this.bgMusic.play().catch(() => {});
    });
  }

  update() {

    // ✅ bloquea hasta iniciar
    if (!this.gameStarted) {
      this.player.setVelocity(0);
      return;
    }

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-500);
    }
  }

  createProceduralTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.fillStyle(0x7a3a1c, 1);
    g.fillRect(0, 0, 256, 64);
    g.generateTexture('ground', 256, 64);
    g.clear();

    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 32, 40);
    g.generateTexture('astronaut', 32, 40);

    g.fillStyle(0x071428, 1);
    g.fillRect(0, 0, 128, 128);
    g.generateTexture('marsSky', 128, 128);

    g.destroy();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  parent: 'game',
  physics: {
    default: 'arcade'
  },
  scene: [MarsEduPlatformer]
};

new Phaser.Game(config);
