// main.js — Versión corregida y optimizada para Phaser 3

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

new Phaser.Game(config);

// ---------------- PRELOAD ----------------
function preload() {
  this.load.image("ground", "assets/ground.png");
  this.load.image("ladder", "assets/ladder.png");
  this.load.image("player", "assets/player.png");
  this.load.image("station", "assets/station.png");
  this.load.image("door", "assets/door.png");
  this.load.image("flag", "assets/flag.png");

  if (!this.textures.exists("background")) {
    const g = this.add.graphics();
    g.fillStyle(0x061433, 1);
    g.fillRect(0, 0, 800, 600);
    g.generateTexture("background", 800, 600);
    g.destroy();
  }
}

// ---------------- CREATE ----------------
function create() {
  const WORLD_W = 3000;
  const WORLD_H = 600;

  this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
  this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

  this.bg = this.add.tileSprite(0, 0, 800, 600, "background").setOrigin(0).setScrollFactor(0).setDepth(-1);

  this.platforms = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_W; x += 200) this.platforms.create(x + 100, WORLD_H - 20, "ground");

  this.player = this.physics.add.sprite(100, 450, "player").setScale(0.5);
  this.player.setCollideWorldBounds(true);
  this.player.setBounce(0.05);
  this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.9);
  this.player.body.setOffset(this.player.width * 0.2, 0);
  this.physics.add.collider(this.player, this.platforms);

  this.cursors = this.input.keyboard.createCursorKeys();

  this.coyoteTimeMax = 120;
  this.jumpBufferMax = 150;
  this.coyoteTimer = 0;
  this.jumpBufferTimer = 0;

  this.ladders = this.physics.add.staticGroup();
  [{x:600,y:400},{x:1000,y:420},{x:2100,y:360}].forEach(pos=>{
    const l=this.ladders.create(pos.x,pos.y,"ladder");
    l.body.setSize(40,160).setOffset(-20,-80);
  });

  this.physics.add.overlap(this.player, this.ladders, ()=>{
    this.player.setData("onLadderZone", true);
  });

  this.stationsData = [
    { id: 0, title: "Atmósfera", x: 400, y: 260, route: "high", facts: ["95% CO2", "Presión muy baja"] },
    { id: 1, title: "Agua y hielo", x: 800, y: 480, route: "low", facts: ["Casquetes polares", "Hielo subterráneo"] },
    { id: 2, title: "Geología", x: 1200, y: 300, route: "high", facts: ["Monte Olimpo", "Cráteres abundantes"] },
    { id: 3, title: "Misiones", x: 1600, y: 500, route: "low", facts: ["Curiosity 2012", "Perseverance 2021"] },
    { id: 4, title: "Radiación", x: 2000, y: 280, route: "high", facts: ["Radiación mayor", "Protección necesaria"] },
    { id: 5, title: "Comunicación", x: 2400, y: 320, route: "high", facts: ["Retraso 20 min", "Orbitadores"] }
  ];

  const saved = loadProgress();
  if (saved && saved.stations) {
    this.stationsData.forEach(s=>{
      const m = saved.stations.find(x=>x.id===s.id);
      if (m) s.completed = !!m.completed;
    });
  }

  this.stations = this.physics.add.staticGroup();
  this.stationSprites = [];
  this.stationsData.forEach(st=>{
    const sp=this.stations.create(st.x,st.y,"station");
    sp.setData("meta",st);
    sp.setData("completed",!!st.completed);
    if (st.completed) sp.setTint(0x6ee7b7);
    this.stationSprites.push(sp);
  });

  this.physics.add.overlap(this.player, this.stations, (p, st)=>{
    if (!st.getData("completed")) startStationSequence.call(this, st);
  });

  this.door = this.physics.add.staticSprite(WORLD_W - 600, WORLD_H - 120, "door");
  this.flag = this.physics.add.staticSprite(WORLD_W - 200, WORLD_H - 120, "flag");
  this.flag.setData("reached", false);

  this.physics.add.overlap(this.player, this.flag, ()=>{
    const allDone = this.stationSprites.every(s=>s.getData("completed"));
    if (allDone && !this.flag.getData("reached")){
      this.flag.setData("reached", true);
      onLevelComplete.call(this);
    }
  });

  this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

  this.score = saved?.score || 0;
  this.totalStations = this.stationSprites.length;
  this.completedStations = this.stationSprites.filter(s=>s.getData("completed")).length;

  this.uiText = this.add.text(12,12,"",{font:"16px Arial",fill:"#fff"}).setScrollFactor(0);
  updateUI.call(this);

  createBitacora.call(this);

  this.badges = saved?.badges || { allComplete:false, highRouteComplete:false };
}

// ---------------- UPDATE ----------------
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

  if (this.cursors.up.isDown && this.player.body.blocked.down) {
    this.player.setVelocityY(-600);
  }

  const touchingLadder = this.physics.overlap(this.player, this.ladders);
  this.player.setData("onLadderZone", touchingLadder);

  if (touchingLadder && (this.cursors.up.isDown || this.cursors.down.isDown)){
    this.player.body.allowGravity=false;
    if (this.cursors.up.isDown) this.player.setVelocityY(-130);
    else if (this.cursors.down.isDown) this.player.setVelocityY(120);
    else this.player.setVelocityY(0);
  } else this.player.body.allowGravity=true;

  if (this.player.body.blocked.down) this.coyoteTimer = this.coyoteTimeMax;
  else this.coyoteTimer -= delta;

  if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.jumpBufferTimer = this.jumpBufferMax;
  else this.jumpBufferTimer -= delta;

  if (this.jumpBufferTimer>0 && this.coyoteTimer>0 && this.player.body.allowGravity){
    this.player.setVelocityY(-360);
    this.jumpBufferTimer=0;
    this.coyoteTimer=0;
  }

  updateUI.call(this);

  if (!this._lastSave) this._lastSave=0;
  this._lastSave+=delta;
  if (this._lastSave>2000){ saveProgress.call(this); this._lastSave=0; }
}

// ---------------- ESTACIONES ----------------
function startStationSequence(stationSprite) {
  this.player.setVelocity(0,0);
  this.player.body.moves=false;

  const meta = stationSprite.getData("meta");

  const steps=[
    { type:"sequence", prompt:`Selecciona un dato sobre ${meta.title}`, options: meta.facts },
    { type:"tf", prompt:`Verdadero o falso: "${meta.facts[0]}"`, answer:true }
  ];

  showStationUI.call(this,stationSprite,steps,0);
}

function showStationUI(stationSprite, steps, index){
  if (this.stationUI) this.stationUI.destroy(true);

  const w=520,h=220;
  const cam=this.cameras.main;
  const x=cam.worldView.x+400-w/2;
  const y=cam.worldView.y+300-h/2;

  const c=this.add.container(x,y).setDepth(1000);
  c.add(this.add.rectangle(0,0,w,h,0x071126,0.95).setOrigin(0));
  c.add(this.add.rectangle(0,0,w,h).setStrokeStyle(2,0xffffff).setOrigin(0));

  const meta=stationSprite.getData("meta");
  c.add(this.add.text(20,12,`Estación: ${meta.title}`,{font:"20px Arial",fill:"#fff"}));

  const step=steps[index];
  c.add(this.add.text(20,50,step.prompt,{font:"18px Arial",fill:"#fff",wordWrap:{width:w-40}}));

  if (step.type==="sequence"){
    step.options.forEach((opt,i)=>{
      const t=this.add.text(40,90+i*28,`${i+1}. ${opt}`,{font:"16px Arial",fill:"#fff"}).setInteractive({useHandCursor:true});
      t.on("pointerdown",()=>showStationUI.call(this,stationSprite,steps,index+1));
      c.add(t);
    });
  } else {
    const tb=this.add.rectangle(140,140,120,40,0x2ecc71).setInteractive();
    const fb=this.add.rectangle(380,140,120,40,0xe74c3c).setInteractive();
    c.add(tb,fb);
    c.add(this.add.text(140,140,"Verdadero",{fill:"#000"}).setOrigin(0.5));
    c.add(this.add.text(380,140,"Falso",{fill:"#000"}).setOrigin(0.5));

    tb.on("pointerdown",()=>finishStation.call(this,stationSprite,true));
    fb.on("pointerdown",()=>finishStation.call(this,stationSprite,false));
  }

  this.stationUI=c;
}

function finishStation(stationSprite, correct){
  const meta=stationSprite.getData("meta");
  stationSprite.setData("completed",true);
  stationSprite.setTint(0x6ee7b7);
  meta.completed=true;
  meta.learned={ keyFact: meta.facts[0] };

  this.player.body.moves=true;

  this.completedStations=this.stationSprites.filter(s=>s.getData("completed")).length;
  this.score+=100;

  if (this.completedStations===this.totalStations) openDoor.call(this);

  saveProgress.call(this);
}

function openDoor(){
  if (!this.door) return;
  this.tweens.add({ targets:this.door, alpha:0, duration:800, onComplete:()=>this.door.destroy() });
}

function onLevelComplete(){
  const cam=this.cameras.main;
  const x=cam.worldView.x+400;
  const y=cam.worldView.y+300;

  this.add.rectangle(x,y,440,160,0x071126,0.95).setDepth(1000).setOrigin(0.5);
  this.add.text(x,y,"¡Nivel completado!",{font:"28px Arial",fill:"#fff"}).setDepth(1000).setOrigin(0.5);

  this.score+=500;
  saveProgress.call(this);
}

// ---------------- UI ----------------
function updateUI(){
  this.uiText.setText([
    `Estaciones: ${this.completedStations}/${this.totalStations}`,
    `Puntos: ${this.score}`,
    `Bitácora: B o M`
  ]);
}

function createBitacora(){
  this.bitacoraVisible=false;
  this.bitacoraContainer=this.add.container(20,60).setScrollFactor(0).setDepth(1000);
  this.bitacoraContainer.add(this.add.rectangle(0,0,360,420,0x02121f,0.95).setOrigin(0));
  this.bitacoraContainer.add(this.add.rectangle(0,0,360,420).setStrokeStyle(2,0xffffff).setOrigin(0));
  this.bitacoraContainer.add(this.add.text(16,12,"Bitácora Marciana",{font:"18px Arial",fill:"#fff"}));

  this.bitacoraEntries=this.add.container(16,48);
  this.bitacoraContainer.add(this.bitacoraEntries);
  this.bitacoraContainer.setVisible(false);
}

function toggleBitacora(){
  this.bitacoraVisible=!this.bitacoraVisible;
  this.bitacoraContainer.setVisible(this.bitacoraVisible);
  if (this.bitacoraVisible) refreshBitacora.call(this);
}

function refreshBitacora(){
  this.bitacoraEntries.removeAll(true);
  let y=0;

  this.stationsData.forEach((st,i)=>{
    const completed=st.completed?"Completada":"Pendiente";
    const color=st.completed?"#6ee7b7":"#ffd166";
    const t=this.add.text(0,y,`${i+1}. ${st.title} — ${completed}`,{font:"14px Arial",fill:color});
    this.bitacoraEntries.add(t); y+=20;
    if (st.completed && st.learned){
      const f=this.add.text(12,y,`• ${st.learned.keyFact}`,{font:"13px Arial",fill:"#ddd"});
      this.bitacoraEntries.add(f); y+=18;
    }
  });
}

// ---------------- PROGRESS ----------------
function saveProgress(){
  const payload={ stations:this.stationsData, score:this.score, badges:this.badges };
  localStorage.setItem("marsGameProgress", JSON.stringify(payload));
}

function loadProgress(){
  try{
    const raw=localStorage.getItem("marsGameProgress");
    return raw ? JSON.parse(raw) : null;
  } catch{
    return null;
  }
}