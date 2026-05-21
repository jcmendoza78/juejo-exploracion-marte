// ========================
// 🎮 PANTALLA INICIO
// ========================
this.gameStarted = false;

// Fondo oscuro
const w = this.scale.width;
const h = this.scale.height;

this.startOverlay = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.85)
  .setScrollFactor(0)
  .setDepth(1000);

// Texto
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
this.bgMusic = new Audio('musica.mp3'); // 🔥 coloca tu archivo aquí
this.bgMusic.loop = true;
this.bgMusic.volume = 0.4;

// Evento clic
this.startOverlay.setInteractive();
this.startOverlay.on('pointerdown', () => {
  this.startOverlay.destroy();
  this.startText.destroy();
  this.gameStarted = true;

  this.bgMusic.play(); // ✅ inicia música
});
