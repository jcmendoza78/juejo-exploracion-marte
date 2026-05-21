// ==========================================================
// Marte Runner EDU v4 (BIFURCACIONES)
// Tipo Mario + Estaciones obligatorias (cualquier orden)
// Público: Jóvenes (13–17)
//
// Novedad principal:
// ✅ Nivel con bifurcaciones (ruta baja / ruta alta) y conectores entre rutas
// ✅ 12 estaciones, cada una con 2 mini-retos (2 pasos)
// ✅ Meta final bloqueada con puerta hasta completar TODAS las estaciones
// ✅ Saltos más amables (coyote time + jump buffer)
//
// Cómo funciona la bifurcación:
// - Hay 2 zonas de bifurcación:
//   1) De x ~1600 a ~3400 (ruta alta con plataformas elevadas + ruta baja por suelo)
//   2) De x ~4200 a ~5600 (otra bifurcación similar)
// - En cada zona hay 2 conectores (escaleras verticales) para pasar de una ruta a otra.
// - Algunas estaciones están arriba y otras abajo, así que para completar todo
//   tendrás que explorar AMBAS rutas.
//
// Sin assets externos: texturas procedurales.
// ==========================================================

class MarsEduPlatformer extends Phaser.Scene {
  constructor() {
    super('mars-edu');
  }

  create() {
    // -----------------
    // 1) Mundo grande
    // -----------------
    this.WORLD_W = 7400;
    this.WORLD_H = 1800;
    this.groundY = this.WORLD_H - 80;

    this.cameras.main.setBackgroundColor('#0b1d3a');
    this.createProceduralTextures();

    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    // Fondo parallax
    this.bg = this.add.tileSprite(0, 0, this.WORLD_W, this.WORLD_H, 'marsSky')
      .setOrigin(0, 0)
      .setScrollFactor(0.2);

    // -----------------
    // 2) Plataformas y obstáculos
    // -----------------
    this.platforms = this.physics.add.staticGroup();

    // Suelo segmentado
    for (let x = 0; x < this.WORLD_W; x += 256) {
      const g = this.platforms.create(x, this.groundY, 'ground');
      g.setOrigin(0, 0.5);
      g.refreshBody();
    }

    const addPlatform = (x, y, scaleX = 1, scaleY = 1) => {
      const p = this.platforms.create(x, y, 'platform');
      p.setScale(scaleX, scaleY);
      p.refreshBody();
      return p;
    };

    // Helper: escalera / conector vertical (para cambiar de ruta)
    const addLadder = (x, yBottom, steps, stepGap = 55) => {
      for (let i = 0; i < steps; i++) {
        addPlatform(x, yBottom - i * stepGap, 0.75, 1);
      }
    };

    // --- Zona inicial (calentamiento)
    addPlatform(420,  this.groundY - 160);
    addPlatform(700,  this.groundY - 220);
    addPlatform(980,  this.groundY - 260);
    addPlatform(1240, this.groundY - 220);
    addPlatform(1460, this.groundY - 200);

    // =====================================================
    // BIFURCACIÓN 1 (x ~1600 a ~3400)
    // Ruta baja: suelo + plataformas medianas
    // Ruta alta: plataformas elevadas (más "parkour")
    // Conectores: escaleras verticales en x=2350 y x=2950
    // =====================================================

    // Ruta baja (algunas plataformas para saltos opcionales)
    [
      {x: 1750, y: this.groundY - 160},
      {x: 2050, y: this.groundY - 220},
      {x: 2650, y: this.groundY - 160},
      {x: 3250, y: this.groundY - 220},
    ].forEach(p => addPlatform(p.x, p.y));

    // Ruta alta (más arriba)
    [
      {x: 1700, y: this.groundY - 380},
      {x: 2000, y: this.groundY - 440},
      {x: 2300, y: this.groundY - 400},
      {x: 2600, y: this.groundY - 460},
      {x: 2900, y: this.groundY - 420},
      {x: 3200, y: this.groundY - 470},
    ].forEach(p => addPlatform(p.x, p.y));

    // Conectores (escaleras) entre rutas
    addLadder(2350, this.groundY - 160, 6); // sube a ruta alta
    addLadder(2950, this.groundY - 160, 6);

    // Merge suave (zona de reunificación)
    addPlatform(3550, this.groundY - 220);
    addPlatform(3800, this.groundY - 260);

    // =====================================================
    // BIFURCACIÓN 2 (x ~4200 a ~5600)
    // Conectores: x=4650 y x=5350
    // =====================================================

    // Entrando a bifurcación 2
    addPlatform(4100, this.groundY - 200);

    // Ruta baja 2
    [
      {x: 4350, y: this.groundY - 160},
      {x: 4950, y: this.groundY - 220},
      {x: 5550, y: this.groundY - 160},
    ].forEach(p => addPlatform(p.x, p.y));

    // Ruta alta 2
    [
      {x: 4300, y: this.groundY - 380},
      {x: 4600, y: this.groundY - 440},
      {x: 4900, y: this.groundY - 400},
      {x: 5200, y: this.groundY - 460},
      {x: 5500, y: this.groundY - 420},
    ].forEach(p => addPlatform(p.x, p.y));

    // Conectores 2
    addLadder(4650, this.groundY - 160, 6);
    addLadder(5350, this.groundY - 160, 6);

    // Tramo final antes de meta
    addPlatform(5850, this.groundY - 240);
    addPlatform(6150, this.groundY - 280);
    addPlatform(6450, this.groundY - 240);
    addPlatform(6750, this.groundY - 200);

    // Obstáculos (rocas) - un poco más densas en zonas bajas
    this.rocks = this.physics.add.staticGroup();
    for (let i = 0; i < 62; i++) {
      const rx = Phaser.Math.Between(320, this.WORLD_W - 240);
      const ry = this.groundY - Phaser.Math.Between(0, 10);
      const rock = this.rocks.create(rx, ry, 'rock');
      rock.setScale(Phaser.Math.FloatBetween(0.8, 1.4));
      rock.refreshBody();
    }

    // -----------------
    // 3) Jugador (salto ajustado)
    // -----------------
    this.player = this.physics.add.sprite(140, this.groundY - 140, 'astronaut');
    this.player.setBounce(0.04);
    this.player.setCollideWorldBounds(true);

    this.player.body.setGravityY(850);
    this.playerSpeed = 275;
    this.jumpSpeed = 700;

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.rocks);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.0);

    this.cursors = this.input.keyboard.createCursorKeys();

    // Mejoras de salto: coyote + buffer
    this.coyoteTimeMs = 120;
    this.jumpBufferMs = 120;
    this.lastOnGroundTime = 0;
    this.jumpPressedTime = -9999;

    // -----------------
    // 4) Estaciones (12) - 2 mini-retos por estación
    // Distribuidas en ambas rutas (baja/alta)
    // -----------------

    this.stationData = [
      // Zona inicial
      {
        id: 'grav',
        x: 700,
        y: this.groundY - 264,
        title: 'Estación 1 · Gravedad',
        text: 'La gravedad en Marte es menor que en la Tierra. Eso cambia cómo se mueven objetos y personas.',
        activity: { type: 'multi', steps: [
          { type: 'truefalse', statement: 'En Marte pesarías menos que en la Tierra.', correct: true, fact: 'Sí: menor gravedad = menor peso.' },
          { type: 'quiz', question: '¿Qué cambia al haber menos gravedad?', options: ['Saltos más largos', 'Más oxígeno', 'Más mares', 'Más presión'], correct: 0, fact: 'Menos gravedad facilita saltos más largos.' }
        ]}
      },
      {
        id: 'atm',
        x: 980,
        y: this.groundY - 304,
        title: 'Estación 2 · Atmósfera',
        text: 'Atmósfera delgada (mucho CO₂) = poca presión y menos protección. Eso influye en clima y temperatura.',
        activity: { type: 'multi', steps: [
          { type: 'quiz', question: '¿Qué gas predomina en la atmósfera de Marte?', options: ['Oxígeno', 'CO₂', 'Nitrógeno', 'Hidrógeno'], correct: 1, fact: 'Marte tiene una atmósfera mayoritariamente de CO₂.' },
          { type: 'truefalse', statement: 'Una atmósfera delgada protege MENOS contra radiación.', correct: true, fact: 'Correcto: menos atmósfera = menos escudo.' }
        ]}
      },
      {
        id: 'rad',
        x: 1460,
        y: this.groundY - 264,
        title: 'Estación 3 · Radiación',
        text: 'Con poca atmósfera y sin un campo magnético fuerte, la radiación es un riesgo para astronautas y equipos.',
        activity: { type: 'multi', steps: [
          { type: 'quiz', question: '¿Por qué la radiación es un reto en Marte?', options: ['Poca protección atmosférica', 'Demasiada agua', 'Mucho oxígeno', 'Lluvias intensas'], correct: 0, fact: 'Menos atmósfera = menos protección.' },
          { type: 'truefalse', statement: 'La radiación puede afectar la electrónica de sondas/rovers.', correct: true, fact: 'Sí: puede dañar componentes y datos.' }
        ]}
      },

      // Bifurcación 1 (ruta alta)
      {
        id: 'sol',
        x: 2000,
        y: this.groundY - 500,
        title: 'Estación 4 · Día marciano (ruta alta)',
        text: 'Un día en Marte se llama “sol”. Esa diferencia con la Tierra afecta horarios de misión y energía.',
        activity: { type: 'multi', steps: [
          { type: 'truefalse', statement: 'Un “sol” dura ~24h 39m.', correct: true, fact: 'Sí: ~24 h 39 min.' },
          { type: 'quiz', question: '¿Qué nombre recibe el “día” en Marte?', options: ['Sol', 'Luna', 'Orbe', 'Ciclo'], correct: 0, fact: 'Se usa “sol” para el día marciano.' }
        ]}
      },
      {
        id: 'temp',
        x: 2600,
        y: this.groundY - 520,
        title: 'Estación 5 · Temperatura (ruta alta)',
        text: 'Marte pierde calor rápido. La atmósfera delgada y la menor energía solar influyen mucho.',
        activity: { type: 'multi', steps: [
          { type: 'quiz', question: '¿Qué factor influye más en que Marte sea tan frío?', options: ['Atmósfera muy delgada', 'Muchos océanos', 'Más oxígeno', 'Más nubes'], correct: 0, fact: 'Con poca atmósfera, se retiene poco calor.' },
          { type: 'truefalse', statement: 'La atmósfera marciana retiene calor de forma similar a la Tierra.', correct: false, fact: 'Falso: es mucho menos densa que la de la Tierra.' }
        ]}
      },

      // Bifurcación 1 (ruta baja)
      {
        id: 'ice',
        x: 2650,
        y: this.groundY - 224,
        title: 'Estación 6 · Agua y hielo (ruta baja)',
        text: 'Hay hielo en polos y subsuelo. Además, el relieve muestra huellas de agua líquida antigua.',
        activity: { type: 'multi', steps: [
          { type: 'truefalse', statement: 'En Marte hay hielo tanto en los polos como bajo el suelo.', correct: true, fact: 'Correcto: hay hielo polar y subterráneo.' },
          { type: 'quiz', question: '¿Qué sugiere “canales” y valles en algunas zonas?', options: ['Agua en el pasado', 'Selvas', 'Volcanes activos', 'Mucho oxígeno'], correct: 0, fact: 'Son evidencias de agua pasada en superficie.' }
        ]}
      },
      {
        id: 'soil',
        x: 3250,
        y: this.groundY - 284,
        title: 'Estación 7 · Suelo (regolito) (ruta baja)',
        text: 'El “regolito” es polvo y roca triturada. Es útil para estudiar química y para pensar en construcción futura.',
        activity: { type: 'multi', steps: [
          { type: 'quiz', question: '¿Cómo se llama el polvo/roca suelta de Marte?', options: ['Regolito', 'Humus', 'Granito', 'Arcilla'], correct: 0, fact: 'Se llama regolito.' },
          { type: 'truefalse', statement: 'Analizar el suelo ayuda a entender la historia geológica del planeta.', correct: true, fact: 'Sí: su química da pistas del pasado.' }
        ]}
      },

      // Zona intermedia (después de merge)
      {
        id: 'geo',
        x: 3800,
        y: this.groundY - 324,
        title: 'Estación 8 · Geología',
        text: 'La geología “cuenta historias”: volcanes gigantes, cañones enormes y capas de rocas con pistas del pasado.',
        activity: { type: 'multi', steps: [
          { type: 'sequence', prompt: 'Ordena el proceso lógico para estudiar un sitio en Marte:', items: ['Tomar imágenes', 'Analizar terreno', 'Elegir muestreo', 'Recolectar muestra'], correctOrder: ['Tomar imágenes', 'Analizar terreno', 'Elegir muestreo', 'Recolectar muestra'], fact: 'Buen orden: observar → analizar → decidir → muestrear.' },
          { type: 'quiz', question: '¿Cómo se llama el volcán más grande del Sistema Solar en Marte?', options: ['Olympus Mons', 'Etna', 'Mauna Kea', 'Vesubio'], correct: 0, fact: 'Olympus Mons es gigantesco.' }
        ]}
      },

      // Bifurcación 2 (ruta alta)
      {
        id: 'comm',
        x: 5200,
        y: this.groundY - 520,
        title: 'Estación 9 · Comunicación (ruta alta)',
        text: 'Comunicar con Marte toma tiempo por la distancia. Por eso se usan orbitadores como “repetidores” de señal.',
        activity: { type: 'multi', steps: [
          { type: 'truefalse', statement: 'Las señales entre la Tierra y Marte tienen retraso.', correct: true, fact: 'Sí: la distancia causa demora.' },
          { type: 'quiz', question: '¿Para qué sirve un orbitador en una misión?', options: ['Relé de comunicación', 'Producir oxígeno', 'Crear volcanes', 'Traer lluvia'], correct: 0, fact: 'Muchos orbitadores ayudan a comunicar datos.' }
        ]}
      },

      // Bifurcación 2 (ruta baja)
      {
        id: 'storm',
        x: 4950,
        y: this.groundY - 284,
        title: 'Estación 10 · Tormentas de polvo (ruta baja)',
        text: 'Tormentas de polvo pueden reducir visibilidad y energía solar. Son un reto real para misiones.',
        activity: { type: 'multi', steps: [
          { type: 'quiz', question: '¿Por qué el polvo afecta paneles solares?', options: ['Bloquea la luz', 'Crea agua', 'Aumenta oxígeno', 'Enfría el sol'], correct: 0, fact: 'Menos luz = menos energía.' },
          { type: 'truefalse', statement: 'Las tormentas de polvo pueden cubrir regiones enormes.', correct: true, fact: 'Sí: pueden ser muy extensas.' }
        ]}
      },
      {
        id: 'rover',
        x: 5550,
        y: this.groundY - 224,
        title: 'Estación 11 · Rovers (ruta baja)',
        text: 'Rovers = laboratorios móviles. Analizan rocas, toman fotos, perforan y envían datos a la Tierra.',
        activity: { type: 'multi', steps: [
          { type: 'quiz', question: '¿Qué rover llegó a Marte en 2021?', options: ['Curiosity', 'Perseverance', 'Spirit', 'Sojourner'], correct: 1, fact: 'Perseverance llegó en 2021.' },
          { type: 'truefalse', statement: 'Un rover puede tomar muestras y analizarlas con instrumentos.', correct: true, fact: 'Sí: llevan instrumentos científicos.' }
        ]}
      },

      // Final
      {
        id: 'life',
        x: 6450,
        y: this.groundY - 304,
        title: 'Estación 12 · ¿Vida?',
        text: 'Buscar vida en Marte suele enfocarse en rastros de vida pasada y ambientes que pudieron ser habitables.',
        activity: { type: 'multi', steps: [
          { type: 'truefalse', statement: 'Las misiones buscan señales de vida PASADA.', correct: true, fact: 'Correcto: se buscan bioseñales antiguas.' },
          { type: 'quiz', question: '¿Qué es clave para la habitabilidad?', options: ['Agua', 'Diamantes', 'Oro', 'Más nubes'], correct: 0, fact: 'El agua es un factor clave.' }
        ]}
      }
    ];

    this.completedStations = new Set();
    this.score = 0;
    this.uiActive = false;
    this.stationCooldownUntil = 0;

    this.stationSprites = new Map();
    this.stations = this.physics.add.staticGroup();

    this.stationData.forEach(s => {
      const st = this.stations.create(s.x, s.y, 'station');
      st.setData('stationId', s.id);
      st.refreshBody();
      this.stationSprites.set(s.id, st);

      this.add.text(s.x, s.y - 70, 'ESTACIÓN', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.25)',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5);
    });

    this.physics.add.overlap(this.player, this.stations, this.onReachStation, null, this);

    // -----------------
    // 5) Meta final + Puerta
    // -----------------
    this.goal = this.physics.add.staticSprite(this.WORLD_W - 160, this.groundY - 140, 'flag');
    this.goal.setDepth(2);

    this.gate = this.physics.add.staticImage(this.WORLD_W - 380, this.groundY - 120, 'gate');
    this.gate.refreshBody();

    this.physics.add.collider(this.player, this.gate, () => {
      if (this.completedStations.size < this.stationData.length) {
        this.openInfoOnlyUI(
          'Meta bloqueada',
          `Completa todas las estaciones para terminar la misión.\nProgreso: ${this.completedStations.size}/${this.stationData.length}`
        );
      }
    }, null, this);

    this.physics.add.overlap(this.player, this.goal, () => {
      if (this.completedStations.size >= this.stationData.length) {
        this.win();
      } else {
        this.openInfoOnlyUI(
          'Aún no',
          `Te faltan estaciones: ${this.stationData.length - this.completedStations.size}.\nProgreso: ${this.completedStations.size}/${this.stationData.length}`
        );
      }
    }, null, this);

    // -----------------
    // 6) HUD
    // -----------------
    this.hud = this.add.text(16, 16, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setScrollFactor(0);

    this.help = this.add.text(16, 38, '← → mover | ↑ saltar | Explora rutas alta/baja para completar estaciones', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfe3ff'
    }).setScrollFactor(0);

    this.mission = this.add.text(16, 60, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfe3ff'
    }).setScrollFactor(0);

    this.toast = null;
    this.won = false;

    // Estado UI de pasos
    this.currentStation = null;
    this.currentStepIndex = 0;
  }

  update(time) {
    if (this.won) return;

    this.bg.tilePositionX = this.cameras.main.scrollX * 0.2;
    this.bg.tilePositionY = this.cameras.main.scrollY * 0.2;

    if (this.uiActive) {
      this.player.setVelocityX(0);
      return;
    }

    // Jump buffer
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.jumpPressedTime = time;
    }

    // Movimiento
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Ground check
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    if (onGround) {
      this.lastOnGroundTime = time;
    }

    // Coyote + buffer jump
    const canCoyote = (time - this.lastOnGroundTime) <= this.coyoteTimeMs;
    const bufferedJump = (time - this.jumpPressedTime) <= this.jumpBufferMs;

    if (bufferedJump && canCoyote) {
      this.player.setVelocityY(-this.jumpSpeed);
      this.jumpPressedTime = -9999;
    }

    // HUD
    this.hud.setText(`Puntos: ${this.score}   Estaciones: ${this.completedStations.size}/${this.stationData.length}`);
    this.mission.setText(this.completedStations.size < this.stationData.length
      ? 'Objetivo: completa todas las estaciones para desbloquear la meta 🛰️'
      : '¡Meta desbloqueada! ve a la bandera 🏁');

    if (this.player.y > this.WORLD_H + 200) {
      this.scene.restart();
    }
  }

  // =====================================================
  // Estaciones
  // =====================================================

  onReachStation(player, station) {
    const now = this.time.now;
    if (this.uiActive) return;
    if (now < this.stationCooldownUntil) return;

    const id = station.getData('stationId');
    if (this.completedStations.has(id)) return;

    const data = this.stationData.find(s => s.id === id);
    if (!data) return;

    this.openStationUI(data);
  }

  openStationUI(station) {
    this.uiActive = true;
    this.player.setVelocity(0, 0);

    this.currentStation = station;
    this.currentStepIndex = 0;

    this.openCardBase(station.title, station.text);
    this.renderCurrentStep();
  }

  openCardBase(titleText, bodyText) {
    const w = this.scale.width;
    const h = this.scale.height;

    const dim = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.45).setScrollFactor(0);
    const card = this.add.rectangle(w/2, h/2, Math.min(880, w-40), 420, 0x0f2a52, 0.97)
      .setScrollFactor(0);
    card.setStrokeStyle(2, 0x2e6bc2, 1);

    const title = this.add.text(w/2, h/2 - 185, titleText, {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    const info = this.add.text(w/2, h/2 - 145, bodyText, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfe3ff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    const stepBadge = this.add.text(w/2, h/2 - 110, '', {
      fontFamily: 'Arial',
      fontSize: '13px',
      color: '#cfe3ff'
    }).setOrigin(0.5).setScrollFactor(0);

    this.ui = this.add.container(0, 0, [dim, card, title, info, stepBadge]).setDepth(999);
    this.uiStepBadge = stepBadge;
  }

  renderCurrentStep() {
    if (this.uiActivityItems) {
      this.uiActivityItems.forEach(o => o.destroy());
    }
    this.uiActivityItems = [];

    const station = this.currentStation;
    const steps = station.activity?.steps || [];

    if (this.currentStepIndex >= steps.length) {
      this.finishStation(station);
      return;
    }

    const step = steps[this.currentStepIndex];
    this.uiStepBadge.setText(`Reto ${this.currentStepIndex + 1} / ${steps.length}`);

    if (step.type === 'quiz') {
      this.renderQuizStep(step);
    } else if (step.type === 'truefalse') {
      this.renderTrueFalseStep(step);
    } else if (step.type === 'sequence') {
      this.renderSequenceStep(step);
    } else {
      this.renderContinueButton('SIGUIENTE', () => {
        this.currentStepIndex++;
        this.renderCurrentStep();
      });
    }
  }

  // ------------------
  // Quiz step
  // ------------------
  renderQuizStep(step) {
    const w = this.scale.width;
    const h = this.scale.height;

    const qText = this.add.text(w/2, h/2 - 65, step.question, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    const feedback = this.add.text(w/2, h/2 + 150, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfe3ff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    this.ui.add(qText);
    this.ui.add(feedback);
    this.uiActivityItems.push(qText, feedback);

    const btns = [];
    const startY = h/2 + 0;

    step.options.forEach((opt, i) => {
      const y = startY + i * 44;

      const btnBg = this.add.rectangle(w/2, y, Math.min(760, w-120), 38, 0x173a70, 1)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);
      btnBg.setStrokeStyle(2, 0x2e6bc2, 1);

      const btnText = this.add.text(w/2, y, opt, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0);

      btnBg.on('pointerover', () => btnBg.setFillStyle(0x1f4b8f, 1));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x173a70, 1));

      btnBg.on('pointerdown', () => {
        btns.forEach(b => b.disableInteractive());
        const ok = (i === step.correct);

        if (ok) {
          btnBg.setFillStyle(0x1f8f3a, 1);
          feedback.setText(`✅ ${step.fact}`);
          this.score += 7;
        } else {
          btnBg.setFillStyle(0x9b1c1c, 1);
          feedback.setText(`❌ ${step.fact}`);
          this.score += 3;
        }

        this.time.delayedCall(700, () => {
          this.renderContinueButton('SIGUIENTE', () => {
            this.currentStepIndex++;
            this.renderCurrentStep();
          });
        });
      });

      btns.push(btnBg);
      this.ui.add(btnBg);
      this.ui.add(btnText);
      this.uiActivityItems.push(btnBg, btnText);
    });
  }

  // ------------------
  // True/False step
  // ------------------
  renderTrueFalseStep(step) {
    const w = this.scale.width;
    const h = this.scale.height;

    const statement = this.add.text(w/2, h/2 - 65, step.statement, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    const feedback = this.add.text(w/2, h/2 + 125, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfe3ff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    this.ui.add(statement);
    this.ui.add(feedback);
    this.uiActivityItems.push(statement, feedback);

    const makeBtn = (label, x, y, value) => {
      const bg = this.add.rectangle(x, y, 190, 46, 0xff6a00, 1)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);

      const t = this.add.text(x, y, label, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#1b0c00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setScrollFactor(0);

      bg.on('pointerdown', () => {
        btnTrue.disableInteractive();
        btnFalse.disableInteractive();

        const ok = (value === step.correct);
        if (ok) {
          feedback.setText(`✅ ${step.fact}`);
          this.score += 7;
        } else {
          feedback.setText(`❌ ${step.fact}`);
          this.score += 3;
        }

        this.time.delayedCall(700, () => {
          this.renderContinueButton('SIGUIENTE', () => {
            this.currentStepIndex++;
            this.renderCurrentStep();
          });
        });
      });

      this.ui.add(bg);
      this.ui.add(t);
      this.uiActivityItems.push(bg, t);
      return bg;
    };

    const btnTrue = makeBtn('VERDADERO', w/2 - 120, h/2 + 15, true);
    const btnFalse = makeBtn('FALSO', w/2 + 120, h/2 + 15, false);
  }

  // ------------------
  // Sequence step
  // ------------------
  renderSequenceStep(step) {
    const w = this.scale.width;
    const h = this.scale.height;

    const prompt = this.add.text(w/2, h/2 - 90, step.prompt, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    const feedback = this.add.text(w/2, h/2 + 150, '', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#cfe3ff',
      wordWrap: { width: Math.min(820, w-80) },
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0);

    const chosenText = this.add.text(w/2, h/2 + 115, 'Tu orden: (elige 4)', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#cfe3ff'
    }).setOrigin(0.5).setScrollFactor(0);

    this.ui.add(prompt);
    this.ui.add(feedback);
    this.ui.add(chosenText);
    this.uiActivityItems.push(prompt, feedback, chosenText);

    const items = [...step.items];
    Phaser.Utils.Array.Shuffle(items);

    const chosen = [];
    const btns = [];

    const startY = h/2 - 35;

    items.forEach((label, idx) => {
      const y = startY + idx * 38;

      const bg = this.add.rectangle(w/2, y, Math.min(780, w-120), 32, 0x173a70, 1)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);
      bg.setStrokeStyle(2, 0x2e6bc2, 1);

      const t = this.add.text(w/2, y, label, {
        fontFamily: 'Arial',
        fontSize: '15px',
        color: '#ffffff'
      }).setOrigin(0.5).setScrollFactor(0);

      bg.on('pointerover', () => bg.setFillStyle(0x1f4b8f, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x173a70, 1));

      bg.on('pointerdown', () => {
        if (chosen.length >= step.correctOrder.length) return;
        bg.disableInteractive();
        bg.setAlpha(0.5);
        t.setAlpha(0.5);

        chosen.push(label);
        chosenText.setText('Tu orden: ' + chosen.join(' → '));

        if (chosen.length === step.correctOrder.length) {
          btns.forEach(b => b.disableInteractive());
          const ok = chosen.every((v, i) => v === step.correctOrder[i]);

          if (ok) {
            feedback.setText(`✅ ${step.fact}`);
            this.score += 8;
          } else {
            feedback.setText(`❌ ${step.fact}`);
            this.score += 4;
          }

          this.time.delayedCall(700, () => {
            this.renderContinueButton('SIGUIENTE', () => {
              this.currentStepIndex++;
              this.renderCurrentStep();
            });
          });
        }
      });

      btns.push(bg);
      this.ui.add(bg);
      this.ui.add(t);
      this.uiActivityItems.push(bg, t);
    });
  }

  // =====================================================
  // Finalizar estación / UI
  // =====================================================

  finishStation(station) {
    if (!this.completedStations.has(station.id)) {
      this.completedStations.add(station.id);
      const sprite = this.stationSprites.get(station.id);
      if (sprite) sprite.setTint(0x55ff99);
      this.showToast(`✅ ${station.title} completada`);
    }

    this.renderContinueButton('CERRAR', () => this.closeStationUI());

    if (this.completedStations.size === this.stationData.length) {
      this.unlockGoal();
    }
  }

  unlockGoal() {
    if (this.gate) {
      this.gate.destroy();
      this.gate = null;
      this.showToast('🔓 ¡Meta desbloqueada! Ve a la bandera 🏁');
    }
  }

  showToast(message) {
    if (this.toast) {
      this.toast.destroy();
      this.toast = null;
    }

    this.toast = this.add.text(this.scale.width / 2, 92, message, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.35)',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setScrollFactor(0);

    this.time.delayedCall(1200, () => {
      if (this.toast) {
        this.toast.destroy();
        this.toast = null;
      }
    });
  }

  renderContinueButton(label, onClick) {
    const w = this.scale.width;
    const h = this.scale.height;

    if (this._continueBtn) return;

    const btn = this.add.rectangle(w/2, h/2 + 185, 220, 46, 0xff6a00, 1)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    const txt = this.add.text(w/2, h/2 + 185, label, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#1b0c00',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0);

    btn.on('pointerdown', () => {
      this._continueBtn = null;
      onClick();
    });

    this._continueBtn = btn;
    this.ui.add(btn);
    this.ui.add(txt);
    if (this.uiActivityItems) this.uiActivityItems.push(btn, txt);
  }

  openInfoOnlyUI(title, text) {
    if (this.uiActive) return;
    this.uiActive = true;
    this.player.setVelocity(0, 0);

    this.openCardBase(title, text);
    this.renderContinueButton('OK', () => this.closeStationUI());
  }

  closeStationUI() {
    if (this.ui) this.ui.destroy(true);
    this.ui = null;
    this.uiActive = false;
    this._continueBtn = null;

    this.currentStation = null;
    this.currentStepIndex = 0;
    this.uiActivityItems = null;

    this.stationCooldownUntil = this.time.now + 900;
  }

  win() {
    if (this.won) return;
    this.won = true;

    this.player.setVelocity(0, 0);
    this.player.body.enable = false;

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w/2, h/2,
      `¡Misión completada! 🏁\nPuntos: ${this.score}\nEstaciones: ${this.completedStations.size}/${this.stationData.length}\n\n(Recarga la página para jugar de nuevo)`,
      {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#ffffff',
        align: 'center',
        backgroundColor: 'rgba(0,0,0,0.35)',
        padding: { x: 18, y: 14 }
      }
    ).setOrigin(0.5).setScrollFactor(0);

    this.cameras.main.flash(250, 255, 106, 0);
  }

  // =====================================================
  // Texturas procedurales
  // =====================================================
  createProceduralTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Fondo cielo marciano (tile)
    g.fillStyle(0x071428, 1);
    g.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, 127);
      const y = Phaser.Math.Between(0, 127);
      const c = Phaser.Math.Between(0x1a2d52, 0x2a3f6f);
      g.fillStyle(c, 1);
      g.fillRect(x, y, 2, 2);
    }

    g.fillStyle(0x3a140e, 0.35);
    g.fillCircle(32, 90, 34);
    g.fillCircle(92, 70, 42);

    g.generateTexture('marsSky', 128, 128);
    g.clear();

    // Suelo (256x64)
    g.fillStyle(0x7a3a1c, 1);
    g.fillRect(0, 0, 256, 64);

    for (let i = 0; i < 220; i++) {
      const x = Phaser.Math.Between(0, 255);
      const y = Phaser.Math.Between(0, 63);
      const c = Phaser.Math.Between(0x6b3117, 0x8b4a26);
      g.fillStyle(c, 1);
      g.fillRect(x, y, 2, 2);
    }

    g.fillStyle(0x4e2412, 1);
    g.fillRect(0, 0, 256, 8);

    g.generateTexture('ground', 256, 64);
    g.clear();

    // Plataforma (160x28)
    g.fillStyle(0x5b2a15, 1);
    g.fillRoundedRect(0, 0, 160, 28, 10);
    g.fillStyle(0x3f1d10, 1);
    g.fillRoundedRect(0, 0, 160, 6, 6);
    g.generateTexture('platform', 160, 28);
    g.clear();

    // Roca (44x34)
    g.fillStyle(0x2c1c16, 1);
    g.fillRoundedRect(2, 6, 40, 24, 10);
    g.fillStyle(0x3b2a22, 1);
    g.fillRoundedRect(12, 12, 16, 10, 6);
    g.generateTexture('rock', 44, 34);
    g.clear();

    // Astronauta (32x40)
    g.fillStyle(0xeaeaea, 1);
    g.fillRoundedRect(6, 6, 20, 26, 8);

    g.fillStyle(0x2d7dd2, 1);
    g.fillRoundedRect(10, 10, 12, 10, 4);

    g.fillStyle(0xff6a00, 1);
    g.fillRect(14, 24, 4, 6);

    g.fillStyle(0xbdbdbd, 1);
    g.fillRect(8, 32, 7, 6);
    g.fillRect(17, 32, 7, 6);

    g.generateTexture('astronaut', 32, 40);
    g.clear();

    // Bandera meta (24x80)
    g.fillStyle(0xffffff, 1);
    g.fillRect(10, 0, 4, 80);
    g.fillStyle(0xff6a00, 1);
    g.fillTriangle(14, 10, 24, 16, 14, 24);
    g.generateTexture('flag', 24, 80);
    g.clear();

    // Estación (40x60)
    g.fillStyle(0x9bd1ff, 1);
    g.fillRoundedRect(16, 10, 8, 44, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(20, 10, 10);
    g.fillStyle(0xff6a00, 1);
    g.fillRect(12, 36, 16, 10);
    g.fillStyle(0x2d7dd2, 1);
    g.fillRect(14, 38, 12, 6);
    g.generateTexture('station', 40, 60);
    g.clear();

    // Puerta (72x140)
    g.fillStyle(0x0f2a52, 1);
    g.fillRoundedRect(0, 0, 72, 140, 14);
    g.lineStyle(4, 0x2e6bc2, 1);
    g.strokeRoundedRect(3, 3, 66, 134, 12);
    g.fillStyle(0xff6a00, 1);
    g.fillRoundedRect(16, 20, 40, 28, 10);
    g.fillStyle(0xffffff, 1);
    g.fillRect(22, 28, 28, 4);
    g.generateTexture('gate', 72, 140);

    g.destroy();
  }
}

const config = {
  type: Phaser.AUTO,
  width: 900,
  height: 600,
  parent: 'game',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MarsEduPlatformer]
};

new Phaser.Game(config);
