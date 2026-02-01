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
  this.load.image('ground', 'assets/fondo.png');
  this.load.image('ladder', 'assets/ladder.png');
  this.load.image('player', 'assets/jugador.png');
  this.load.image('station', 'assets/station.png');
  this.load.image('door', 'assets/door.png');
  this.load.image('flag', 'assets/flag.png');

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

  // --- Texturas procedurales de respaldo si faltan assets ---
  ensureProceduralTextures.call(this);

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
  player = this.physics.add.sprite(100, 450, "player").setScale(0.5);
  player.setCollideWorldBounds(true);
  player.setBounce(0.05);
  
  // Ajustar hitbox después de escalar
  player.body.setSize(player.width * 0.6, player.height * 0.9);
  player.body.setOffset(player.width * 0.2, 0);

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
}

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
  if (this.stationUI) {
    this.stationUI.destroy(true);
    this.stationUI = null;
  }

  const w = 520, h = 220;
  const cam = this.cameras.main;
  const x = cam.worldView.x + (config.width / 2) - w / 2;
  const y = cam.worldView.y + (config.height / 2) - h / 2;

  const container = this.add.container(x, y).setDepth(1000);
  const bg = this.add.rectangle(0, 0, w, h, 0x071126, 0.95).setOrigin(0);
  const border = this.add.rectangle(0, 0, w, h).setStrokeStyle(2, 0xffffff).setOrigin(0);
  container.add([bg, border]);

  const meta = stationSprite.getData('meta');
  const titleText = this.add.text(20, 12, `Estación: ${meta.title}`, { font: '20px Arial', fill: '#fff' });
  container.add(titleText);

  const step = steps[index];
  const promptText = this.add.text(20, 50, step.prompt, { font: '18px Arial', fill: '#fff', wordWrap: { width: w - 40 } });
  container.add(promptText);

  if (step.type === 'sequence') {
    step.options.forEach((opt, i) => {
      const t = this.add.text(40, 90 + i * 28, `${i + 1}. ${opt}`, { font: '16px Arial', fill: '#fff' }).setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        // aceptamos selección y pasamos al siguiente paso
        showStationUI.call(this, stationSprite, steps, index + 1);
      });
      container.add(t);
    });
    const hint = this.add.text(20, h - 36, 'Haz clic en la opción que consideres correcta.', { font: '14px Arial', fill: '#ddd' });
    container.add(hint);
  } else if (step.type === 'tf') {
    const trueBtn = this.add.rectangle(140, 140, 120, 40, 0x2ecc71).setInteractive({ useHandCursor: true });
    const falseBtn = this.add.rectangle(380, 140, 120, 40, 0xe74c3c).setInteractive({ useHandCursor: true });
    const tText = this.add.text(140, 140, 'Verdadero', { font: '16px Arial', fill: '#000' }).setOrigin(0.5);
    const fText = this.add.text(380, 140, 'Falso', { font: '16px Arial', fill: '#000' }).setOrigin(0.5);
    container.add([trueBtn, falseBtn, tText, fText]);

    trueBtn.on('pointerdown', () => {
      finishStation.call(this, stationSprite, true);
      container.destroy(true);
      this.stationUI = null;
    });
    falseBtn.on('pointerdown', () => {
      finishStation.call(this, stationSprite, false);
      container.destroy(true);
      this.stationUI = null;
    });
  }

  this.stationUI = container;
}

function finishStation(stationSprite, userAnswer) {
  // Marcar completada y guardar dato clave en meta
  const meta = stationSprite.getData('meta');
  stationSprite.setData('completed', true);
  stationSprite.setTint(0x6ee7b7);
  meta.completed = true;
  meta.learned = { keyFact: meta.facts[0] };

  // Reactivar movimiento del jugador
  this.player.body.moves = true;

  // Actualizar contadores y score
  this.completedStations = this.stationSprites.filter(s => s.getData('completed')).length;
  this.score += 100;

  // Si completó todas, abrir puerta y dar insignia
  if (this.completedStations >= this.totalStations) {
    openDoor.call(this);
    this.badges.allComplete = true;
    // Mensaje y premio
    this.add.text(this.player.x - 120, this.player.y - 120, '🏆 Todas las estaciones completadas', { font: '16px Arial', fill: '#ffd166' }).setDepth(1000).setScrollFactor(0);
  }

  // Guardar progreso inmediatamente
  saveProgress.call(this);
}

function openDoor() {
  if (!this.door || !this.door.active) return;
  this.tweens.add({
    targets: this.door,
    alpha: 0,
    duration: 800,
    onComplete: () => {
      if (this.door) this.door.destroy();
      this.add.text(this.cameras.main.worldView.x + 520, this.cameras.main.worldView.y + 40, 'Puerta abierta', { font: '18px Arial', fill: '#7efc9f' }).setScrollFactor(0).setDepth(1000);
    }
  });
}

function onLevelComplete() {
  // Mensaje de nivel completado y recompensa
  const cam = this.cameras.main;
  const x = cam.worldView.x + config.width / 2;
  const y = cam.worldView.y + config.height / 2;
  this.add.rectangle(x - 220, y - 80, 440, 160, 0x071126, 0.95).setDepth(1000);
  this.add.text(x, y - 20, '¡Nivel completado!', { font: '28px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(1000);
  this.score += 500;
  this.badges.allComplete = true;
  saveProgress.call(this);
}

function updateUI() {
  this.uiText.setText([
    `Estaciones: ${this.completedStations} / ${this.totalStations}`,
    `Puntos: ${this.score}`,
    `Bitácora: presiona B o M`
  ]);
}

// ---------- Bitácora UI ----------
function createBitacora() {
  this.bitacoraVisible = false;
  this.bitacoraContainer = this.add.container(20, 60).setScrollFactor(0).setDepth(1000);
  const bg = this.add.rectangle(0, 0, 360, 420, 0x02121f, 0.95).setOrigin(0);
  const border = this.add.rectangle(0, 0, 360, 420).setStrokeStyle(2, 0xffffff).setOrigin(0);
  const title = this.add.text(16, 12, 'Bitácora marciana', { font: '18px Arial', fill: '#fff' });
  this.bitacoraContainer.add([bg, border, title]);
  this.bitacoraEntries = this.add.container(16, 48);
  this.bitacoraContainer.add(this.bitacoraEntries);
  this.bitacoraContainer.setVisible(false);
}

function toggleBitacora() {
  this.bitacoraVisible = !this.bitacoraVisible;
  this.bitacoraContainer.setVisible(this.bitacoraVisible);
  if (this.bitacoraVisible) refreshBitacora.call(this);
}

function refreshBitacora() {
  this.bitacoraEntries.removeAll(true);
  let y = 0;
  this.stationsData.forEach((st, idx) => {
    const completed = !!st.completed;
    const title = st.title;
    const statusText = completed ? 'Completada' : 'Pendiente';
    const color = completed ? '#6ee7b7' : '#ffd166';
    const t = this.add.text(0, y, `${idx + 1}. ${title} — ${statusText}`, { font: '14px Arial', fill: color });
    this.bitacoraEntries.add(t);
    y += 20;
    if (completed && st.learned) {
      const fact = this.add.text(12, y, `• ${st.learned.keyFact}`, { font: '13px Arial', fill: '#ddd' });
      this.bitacoraEntries.add(fact);
      y += 18;
    }
  });

  const progress = this.add.text(0, y + 8, `Progreso: ${this.completedStations}/${this.totalStations}`, { font: '14px Arial', fill: '#fff' });
  this.bitacoraEntries.add(progress);
  y += 28;

  const badgesText = [];
  if (this.badges.allComplete) badgesText.push('Explorador Marciano');
  if (this.badges.highRouteComplete) badgesText.push('Valiente Ruta Alta');
  const btxt = this.add.text(0, y, badgesText.length ? `Insignias: ${badgesText.join(' • ')}` : 'Insignias: ninguna', { font: '13px Arial', fill: '#ffd166' });
  this.bitacoraEntries.add(btxt);
}

// ---------- Insignias ruta alta ----------
function checkHighRouteBadge() {
  if (this.badges.highRouteComplete) return;
  if (this.highRouteStations.length === 0) return;
  const allHighDone = this.highRouteStations.every(s => s.getData('completed'));
  if (allHighDone) {
    this.badges.highRouteComplete = true;
    this.add.text(this.player.x - 120, this.player.y - 160, '🏅 Insignia: Ruta Alta', { font: '16px Arial', fill: '#ffd166' }).setDepth(1000).setScrollFactor(0);
    saveProgress.call(this);
  }
}

// ---------- Persistencia local ----------
function saveProgress() {
  try {
    const stations = this.stationsData.map(s => ({ id: s.id, completed: !!s.completed, learned: s.learned || null }));
    const payload = {
      stations,
      score: this.score,
      badges: this.badges
    };
    localStorage.setItem('marsGameProgress', JSON.stringify(payload));
  } catch (e) {
    console.warn('No se pudo guardar progreso', e);
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem('marsGameProgress');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('No se pudo cargar progreso', e);
    return null;
  }
}
