// main.js - Versión ampliada para juego educativo en Marte con Phaser 3
// Reemplaza todo el contenido de tu main.js por este archivo.

// Configuración del juego (mantiene tu resolución y física)
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
  // Intentamos cargar assets externos si existen; si no, generamos texturas procedurales en create.
  this.load.image('ground', 'assets/ground.png');
  this.load.image('ladder', 'assets/ladder.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('station', 'assets/station.png');
  this.load.image('door', 'assets/door.png');
  this.load.image('flag', 'assets/flag.png');
  // Nuevo: Cargar la imagen del fondo
  this.load.image('fondo', 'assets/fondo.png');

  // Cargar un JSON de nivel opcional (si lo añades luego)
  // this.load.json('levelData', 'assets/level.json');
}

// ---------- Create ----------
function create() {
  // --- Mundo y cámara ---
  const WORLD_W = 3000;
  const WORLD_H = 600;
  this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
  this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  // Nuevo: Añadir fondo con parallax simple (se mueve más lento que la cámara)
  this.fondo = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'fondo').setOrigin(0, 0).setScrollFactor(0.5);

  // --- Texturas procedurales de respaldo si faltan assets ---
  ensureProceduralTextures.call(this);

  // (El resto del código de create permanece igual)
  // --- Plataformas ---
  this.platforms = this.physics.add.staticGroup();
  // Suelo continuo
  for (let x = 0; x < WORLD_W; x += 200) {
    const p = this.platforms.create(x + 100, WORLD_H - 20, 'ground');
    p.setScale(1).refreshBody();
  }

  // Plataformas ruta baja (más accesible)
  this.platforms.create(400, 500, 'ground').refreshBody();
  this.platforms.create(800, 520, 'ground').refreshBody();
  this.platforms.create(1200, 540, 'ground').refreshBody();
  this.platforms.create(1600, 520, 'ground').refreshBody();
  this.platforms.create(2000, 540, 'ground').refreshBody();

  // Plataformas ruta alta (más retadora)
  this.platforms.create(400, 300, 'ground').refreshBody();
  this.platforms.create(800, 320, 'ground').refreshBody();
  this.platforms.create(1200, 340, 'ground').refreshBody();
  this.platforms.create(1800, 300, 'ground').refreshBody();
  this.platforms.create(2400, 320, 'ground').refreshBody();

  // Conectores tipo escalera (sprites con overlap)
  this.ladders = this.physics.add.staticGroup();
  const ladder1 = this.ladders.create(600, 400, 'ladder').setOrigin(0.5, 0.5);
  const ladder2 = this.ladders.create(1000, 420, 'ladder').setOrigin(0.5, 0.5);
  const ladder3 = this.ladders.create(2100, 360, 'ladder').setOrigin(0.5, 0.5);
  ladder1.body.setSize(40, 160).setOffset(-20, -80);
  ladder2.body.setSize(40, 160).setOffset(-20, -80);
  ladder3.body.setSize(40, 160).setOffset(-20, -80);

  // --- Jugador ---
  this.player = this.physics.add.sprite(100, 450, 'player');
  this.player.setCollideWorldBounds(true);
  this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.9).setOffset(this.player.width * 0.2, 0);
  this.player.setBounce(0.05);

  // --- Controles ---
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
  this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);

  // --- Coyote time y jump buffer ---
  this.coyoteTimeMax = 120; // ms
  this.jumpBufferMax = 150; // ms
  this.coyoteTimer = 0;
  this.jumpBufferTimer = 0;

  // --- Colisiones ---
  this.physics.add.collider(this.player, this.platforms);

  // --- Ladders overlap handling ---
  this.onLadder = false;
  this.physics.add.overlap(this.player, this.ladders, (player, ladder) => {
    // marcar que está en zona de escalera; no desactivar gravedad aún
    player.setData('onLadderZone', true);
    player.setData('ladder', ladder);
  }, null, this);

  // limpiar flag cuando sale de ladder zone
  this.physics.add.overlap(this.player, this.ladders, null, (player, ladder) => {
    // la función anterior marca la zona; aquí no hacemos nada extra
    return false;
  }, this);

  // detectar salida de zona de escalera con un pequeño timer en update

  // --- Estaciones educativas ---
  // Definimos estaciones con tema, posición, ruta (high/low) y 2 mini-retos
  this.stationsData = [
    { id: 0, title: 'Atmósfera', x: 400, y: 260, route: 'high', facts: ['95% CO2', 'Presión muy baja'] },
    { id: 1, title: 'Agua y hielo', x: 800, y: 480, route: 'low', facts: ['Casquetes polares', 'Hielo subterráneo'] },
    { id: 2, title: 'Geología', x: 1200, y: 300, route: 'high', facts: ['Monte Olimpo', 'Cráteres abundantes'] },
    { id: 3, title: 'Misiones', x: 1600, y: 500, route: 'low', facts: ['Curiosity desde 2012', 'Perseverance llegó en 2021'] },
    { id: 4, title: 'Radiación', x: 2000, y: 280, route: 'high', facts: ['Radiación mayor', 'Protección necesaria'] },
    { id: 5, title: 'Comunicación', x: 2400, y: 320, route: 'high', facts: ['Retraso ~20 min', 'Orbitadores como repetidores'] }
  ];

  // Restaurar progreso desde localStorage si existe
  const saved = loadProgress();
  if (saved && saved.stations) {
    // merge saved completed flags into stationsData
    this.stationsData.forEach(sd => {
      const s = saved.stations.find(x => x.id === sd.id);
      if (s) sd.completed = !!s.completed;
    });
  }

  this.stations = this.physics.add.staticGroup();
  this.stationSprites = [];
  this.highRouteStations = [];
  this.stationsData.forEach(st => {
    const sprite = this.stations.create(st.x, st.y, 'station');
    sprite.setData('meta', st);
    sprite.setData('completed', !!st.completed);
    if (st.completed) sprite.setTint(0x6ee7b7);
    this.stationSprites.push(sprite);
    if (st.route === 'high') this.highRouteStations.push(sprite);
  });

  this.physics.add.overlap(this.player, this.stations, (player, station) => {
    if (!station.getData('completed')) {
      startStationSequence.call(this, station);
    }
  }, null, this);

  // --- Puerta y bandera ---
  this.door = this.physics.add.staticSprite(WORLD_W - 600, WORLD_H - 120, 'door');
  this.flag = this.physics.add.staticSprite(WORLD_W - 200, WORLD_H - 120, 'flag');
  this.flag.setData('reached', false);

  // Bloqueo físico por puerta
  this.physics.add.collider(this.player, this.door);

  // Overlap con bandera para terminar nivel
  this.physics.add.overlap(this.player, this.flag, () => {
    const allDone = this.stationSprites.every(s => s.getData('completed'));
    if (allDone && !this.flag.getData('reached')) {
      this.flag.setData('reached', true);
      onLevelComplete.call(this);
    }
  }, null, this);

  // --- Cámara ---
  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

  // --- UI y bitácora ---
  this.score = saved && saved.score ? saved.score : 0;
  this.completedStations = this.stationSprites.filter(s => s.getData('completed')).length;
  this.totalStations = this.stationSprites.length;
  this.uiText = this.add.text(12, 12, '', { font: '16px Arial', fill: '#ffffff' }).setScrollFactor(0);
  updateUI.call(this);

  // Bitácora container (oculto)
  createBitacora.call(this);

  // Toggle bitácora
  this.input.keyboard.on('keydown-B', () => toggleBitacora.call(this));
  this.input.keyboard.on('keydown-M', () => toggleBitacora.call(this));

  // --- Insignias estado ---
  this.badges = saved && saved.badges ? saved.badges : { allComplete: false, highRouteComplete: false };

  // Mensaje inicial si ya completado
  if (this.badges.allComplete) {
    this.add.text(300, 80, '🏅 Insignia: Explorador Marciano', { font: '18px Arial', fill: '#ffd166' }).setScrollFactor(0);
  }
}

// ---------- Update ----------
function update(time, delta) {
  // (El resto del código de update permanece igual)
  // Movimiento lateral
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

  // Ladder logic: si está en zona de escalera y presiona arriba/abajo, desactivar gravedad y mover
  const onLadderZone = !!this.player.getData('onLadderZone');
  if (onLadderZone && (this.cursors.up.isDown || this.cursors.down.isDown)) {
    this.player.body.allowGravity = false;
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-120);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(120);
    } else {
      this.player.setVelocityY(0);
    }
  } else {
    // restaurar gravedad si no está en escalera
    this.player.body.allowGravity = true;
  }

  // Limpiar flag onLadderZone si no hay overlap (simple check)
  // Si no hay overlap con ninguna ladder, quitar la marca
  const overlappingLadder = this.physics.overlapRect(this.player.x - 8, this.player.y - 8, 16, 16)
    .some(b => b.gameObject && b.gameObject.texture && b.gameObject.texture.key === 'ladder');
  if (!overlappingLadder) {
    this.player.setData('onLadderZone', false);
  }

  // Coyote time y jump buffer
  if (this.player.body.blocked.down || this.player.body.onFloor()) {
    this.coyoteTimer = this.coyoteTimeMax;
  } else {
    this.coyoteTimer -= delta;
  }

  if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
    this.jumpBufferTimer = this.jumpBufferMax;
  } else {
    this.jumpBufferTimer -= delta;
  }

  // Ejecutar salto si buffer y coyote disponibles y no está en escalera
  if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0 && !this.player.body.allowGravity === false) {
    this.player.setVelocityY(-360);
    this.jumpBufferTimer = 0;
    this.coyoteTimer = 0;
  }

  // Actualizar UI
  updateUI.call(this);

  // Comprobar insignia de ruta alta
  checkHighRouteBadge.call(this);

  // Guardar progreso periódicamente (cada 2s)
  if (!this._lastSaveTime) this._lastSaveTime = 0;
  this._lastSaveTime += delta;
  if (this._lastSaveTime > 2000) {
    saveProgress.call(this);
    this._lastSaveTime = 0;
  }
}

// ---------- Funciones auxiliares ----------

function ensureProceduralTextures() {
  // Si alguna textura no cargó, generamos una alternativa
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  if (!this.textures.exists('ground')) {
    g.clear();
    g.fillStyle(0x7a5c3a, 1);
    g.fillRect(0, 0, 200, 32);
    g.generateTexture('ground', 200, 32);
  }
  if (!this.textures.exists('ladder')) {
    g.clear();
    g.fillStyle(0x8b6b3a, 1);
    g.fillRect(0, 0, 40, 160);
    g.generateTexture('ladder', 40, 160);
  }
  if (!this.textures.exists('player')) {
    g.clear();
    g.fillStyle(0xff6f61, 1);
    g.fillRoundedRect(0, 0, 48, 64, 8);
    g.generateTexture('player', 48, 64);
  }
  if (!this.textures.exists('station')) {
    g.clear();
    g.fillStyle(0xffd166, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture('station', 32, 32);
  }
  if (!this.textures.exists('door')) {
    g.clear();
    g.fillStyle(0x8b5cf6, 1);
    g.fillRect(0, 0, 64, 128);
    g.generateTexture('door', 64, 128);
  }
  if (!this.textures.exists('flag')) {
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 16, 48);
    g.fillStyle(0xff0000, 1);
    g.fillTriangle(16, 8, 32, 16, 16, 24);
    g.generateTexture('flag', 32, 48);
  }
  // Nuevo: Generar fondo procedural si no existe (color rojizo para Marte)
  if (!this.textures.exists('fondo')) {
    g.clear();
    g.fillStyle(0x8b4513, 1); // Color rojizo para simular Marte
    g.fillRect(0, 0, 800, 600);
    g.generateTexture('fondo', 800, 600);
  }
}

// (El resto de las funciones permanecen igual)
function startStationSequence(stationSprite) {
  // Pausar movimiento del jugador
  this.player.setVelocity(0, 0);
  this.player.body.moves = false;

  const meta = stationSprite.getData('meta');
  const steps = buildStationSteps(meta);

  // Mostrar UI modal simple centrado en cámara
  showStationUI.call(this, stationSprite, steps, 0);
}

function buildStationSteps(meta) {
  // Cada estación tiene 2 mini-retos: 1) ordenar/seleccionar (simulado) 2) verdadero/falso
  const shuffled = meta.facts.slice().sort(() => 0.5 - Math.random());
  return [
    { type: 'sequence', prompt: `Paso 1 — Selecciona el dato más relevante sobre ${meta.title}`, options: shuffled },
    { type: 'tf', prompt: `Paso 2 — Verdadero o Falso: "${meta.facts[0]}" es correcto?`, answer: true }
  ];
}

function showStationUI(stationSprite, steps, index) {
  // destruir UI previa si existe
  if (this.stationUI
