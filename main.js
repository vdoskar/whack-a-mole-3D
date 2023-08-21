import './css/style.css'
import * as THREE from 'three';
import { RendererSetup } from "./Setup/RendererSetup.js"
import { PerspectiveCamera } from "./Setup/PerspectiveCamera.js"
import { AmbientLight, MainPointLight, DirLight} from './Setup/Lights.js';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

import { CreateFloor } from "./Models/Floor.js"
import { CreateWalls } from "./Models/Walls.js"

/////////////////////////// INIT

const app = document.getElementById('app')
const width = app.clientWidth
const height = app.clientHeight

const scene = new THREE.Scene(); // vytvoření scény

//vytvoření rendereru a kamery z externích souborů
const renderer = RendererSetup(); 
const camera = PerspectiveCamera(); 

const controls = new PointerLockControls(camera, renderer.domElement) // ovládání
const clock = new THREE.Clock() // časovač na výpočet "delta" hodnoty pro pohyb kamery

const modelLoader = new GLTFLoader() // třída na načítání modelů

const MolePath = "Models/Mole/scene.gltf" // cesta k modelu krtka

const pointer = new THREE.Vector2(); // vector2 - simuluje kurzor
const raycaster = new THREE.Raycaster(); // třída na raycasting
const vector3 = new THREE.Vector3(); // vector3 - 3D vektor se souřadnicemi X,Y,Z

const PLAYER_SPEED = 5;
const TOUCH_DISTANCE = 5;

const hitAudio = new Audio('Sound/click.wav');

let points = 0

const touchColor = 0x00ff00
const blockColor = 0xff0000

let isPlaying = false;

// vytvoření skupin pro krtky, text, světla a meshe a následné přidání do scény
const molesGroup = new THREE.Group(); scene.add(molesGroup);
const textGroup = new THREE.Group(); scene.add(textGroup);
const lightsGroup = new THREE.Group(); scene.add(lightsGroup);
const sceneMeshesGroup = new THREE.Group(); scene.add(sceneMeshesGroup);

/////////////////////////// NAČÍTÁNÍ, PROGRESS BAR

const progressBarContainer = document.querySelectorAll(".progress-bar-container")[0]
const progressBar = document.getElementById("progress-bar")
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function(url, item, total) { // co se děje při spuštění
  console.log("loading url " + url)
}

loadingManager.onProgress = function(url, loaded, total) { // co se děje při načítání
  progressBar.value = (loaded/total) * 100
}

loadingManager.onLoad = function() { // co se děje při kompletním načtení
  progressBarContainer.style.display = "none"
  document.getElementById('game-settings').style.display = "flex"
}

loadingManager.onError = function() { // co se děje při chybě
  alert("Něco se pokazilo")
}


//////////////////////////  procedury //////////////////////////////

function BackgroundSetup(scene, renderer) {

  const texture_file = "/textures/ocean.jpg"
  const loader = new THREE.TextureLoader(loadingManager)

  // načtení textury pomocí třídy TextureLoader
  const texture = loader.load(texture_file, () => {

    const rt = new THREE.WebGLCubeRenderTarget(texture.image.height) // získá parametry textury
    rt.fromEquirectangularTexture(renderer, texture)
    scene.background = rt.texture
  })
}
BackgroundSetup(scene, renderer)

function addItemsToScene() { // tato funkce vytváří různé objekty a následně je přidává do scény, potažmo do příslušné skupiny

  const ambientLight = AmbientLight(); scene.add(ambientLight); lightsGroup.add(ambientLight);
  const mainPointLight = MainPointLight(); scene.add(mainPointLight); lightsGroup.add(mainPointLight)
  const dirLight = DirLight(); scene.add(dirLight); lightsGroup.add(dirLight);

  const floor = CreateFloor(); scene.add(floor); sceneMeshesGroup.add(floor)
  const walls = CreateWalls(); for (const wall of walls) { scene.add(wall) }; sceneMeshesGroup.add(walls)
}
addItemsToScene()


function cameraSettings() {
  camera.position.z = 0; 
  camera.position.y = 2; 
  camera.position.x = 0;
  camera.rotation._z = Math.PI
  camera.updateProjectionMatrix() //tato fce se musí zavolat po změnách jakéhokoliv parametru kamery, aby se změny projevily
}

cameraSettings()

//////////////// OVLÁDÁNÍ ///////////////////////////////

let timeLeft
let timeSet = false

const timeLeftCounter = setInterval(() => { 
  
  // zde je časovač pro hru. Pokud není pauza nebo časovač dosáhne hodnoty 0, odečítá postupně hodnotu

  if (!isPlaying) {return};
  if (timeLeft <= 0) { document.getElementById("time-left").innerText = 0 ; return}

  document.getElementById("time-left").innerText = timeLeft
  timeLeft--

}, 1000)


// zde se provádí klikání na tlačítko "Hrát"
document.getElementById("resume-button").addEventListener("click", () => { 

  // pokud hodnota herního času je prázdná, zaměř uživatele do textového pole pro zadání a odmítni hru hrát
  if (document.getElementById("init-time").value == "" || 
      isNaN(document.getElementById("init-time").value) || 
      document.getElementById("init-time").value < 0) { 
    alert ("Zadejte herní čas")
    document.getElementById("init-time").focus()
    return
  }

  // pokud není nastavený čas, nastav ho podle hodnoty v textovém poli 
  if (timeSet != true) {
    timeLeft = document.getElementById("init-time").value
    document.getElementById("init-time").setAttribute("disabled","true")
  }

  timeSet = true
  isPlaying = true;

  // uzamčení kurzoru a skrytí menu
  controls.lock();
  document.getElementById('game-settings').style.display = "none"
  document.getElementById('game-settings').classList.toggle("active")
  document.getElementById("timer-nahore").style.display = "block"
})

// vypnutí hry zavřením okna v prohlížeci
document.getElementById('exit-button').addEventListener("click", () => {
  window.close()
})

// jakmile se stistkne klávesa "Esc", ovládání se uzamkne a objeví se herní menu
controls.addEventListener("unlock", () => {
  isPlaying = false;
  document.getElementById('game-settings').style.display = "flex"
  document.getElementById('game-settings').classList.toggle("active")
  document.getElementById("timer-nahore").style.display = "block"
})


//////////////// MOLE MACHINE ///////////////////////////////

function MoleMachineMoje() { // fce na vytvoření herní konzole

  // konstanty pro rozměry
  const MachineWallHeight = 1
  const MachineWallLength = 1.15
  const MachineWallOffset = 2.425

  // vytvoření stěn
  for (let i = 1; i <= 4; i++) {

    // načtení textury a nastavení
    const texture = new THREE.TextureLoader(loadingManager).load('textures/machine.jpg') 
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping

    const geometry = new THREE.PlaneGeometry(MachineWallLength, MachineWallHeight);
    const material = new THREE.MeshPhongMaterial({
        color: 0x4d4d4d,
        side: THREE.DoubleSide,
        map: texture
    });
    // vytvoření meshe stěny
    const wall = new THREE.Mesh(geometry, material);
    // nastavení meshe
    wall.receiveShadow = true
    wall.castShadow = true
  
    wall.position.y = MachineWallHeight / 2
    wall.geometry.computeBoundingBox(); // nastaví bounding box
  
    // upravování pozice a rotace vytvářené zdi
    switch (i) {
        case 1:
            wall.position.z = (MachineWallLength / 2) - MachineWallOffset
            wall.rotation.y = Math.PI
            break
        case 2:
            wall.position.z = 0 - MachineWallOffset
            wall.position.x = -(MachineWallLength / 2)
            wall.rotation.y = Math.PI / 2
            break
        case 3:
            wall.position.z = -(MachineWallLength / 2) - MachineWallOffset
            wall.rotation.y = Math.PI
            break
        case 4:
            wall.position.z = 0 - MachineWallOffset
            wall.position.x = MachineWallLength / 2 
            wall.rotation.y = Math.PI / 2
            break
    }
  
    scene.add(wall) // přidání vytvořené a upravené zdi do scény
  }

  // vytvoření skla
  for (let i = 0; i < 4; i++) {
    
    const geometry = new THREE.PlaneGeometry(MachineWallLength, MachineWallHeight / 1.5);
    const material = new THREE.MeshPhysicalMaterial({
      // parametry textury, aby byl dodán efekt skla
      metalness: 0.5,
      roughness: 0.2,  
      transmission: 0.9,  
      side: THREE.DoubleSide
    });
    const sklo = new THREE.Mesh(geometry, material);
    
    sklo.receiveShadow = true
    sklo.castShadow = true
    
    sklo.position.y = 1.3325
    sklo.geometry.computeBoundingBox();

    const skloOffset = 0.125

    sklo.position.z = -(MachineWallLength * 2) - skloOffset
    
    // upravování pozice a rotace vytvářené části skla
    switch (i) {
      case 0:
          sklo.rotation.y = Math.PI
          sklo.position.z = -(MachineWallLength * 2.5) - skloOffset
          break
      case 1:
          sklo.position.x = (MachineWallLength / 2)
          sklo.rotation.y = Math.PI / 2
          break
      case 2:
          
          sklo.position.x = -(MachineWallLength / 2)
          sklo.rotation.y = Math.PI / 2
          break
      case 3:
          sklo.position.y = 1.665
          sklo.rotation.x = Math.PI / 2
          sklo.scale.x = MachineWallLength - 0.15
          sklo.scale.y = MachineWallLength + 0.575
    }
    
    sklo.renderOrder = i + 1
    scene.add(sklo)

    // const outlineMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, side: THREE.DoubleSide } );
		// const outlineMesh = new THREE.Mesh( geometry, outlineMaterial );

		// outlineMesh.position.y = sklo.position.y;
    // outlineMesh.position.x = sklo.position.x;
    // outlineMesh.position.z = sklo.position.z;

    // outlineMesh.rotation.y = sklo.rotation.y;
    // outlineMesh.rotation.x = sklo.rotation.x;
    // outlineMesh.rotation.z = sklo.rotation.z;

    // outlineMesh.scale.y = sklo.scale.y;
    // outlineMesh.scale.x = sklo.scale.x;
    // outlineMesh.scale.z = sklo.scale.z;

		// outlineMesh.scale.multiplyScalar( 1.005 );

    // outlineMesh.renderOrder = 0
		// scene.add( outlineMesh );
  }

  // vytvoření otvorů pro krtky
  for (let x = 0; x < 4; x++) {
    for (let z = 0; z < 4; z++) {

      const MoleOtvorGeometry = new THREE.CylinderGeometry();
      const MoleOtvorMaterial = new THREE.MeshPhysicalMaterial( {
        side: THREE.DoubleSide,
        color: 0x333333,
        metalness: 0.85,
        roughness: 0.55, 
      } );
      const MoleOtvorMesh = new THREE.Mesh( MoleOtvorGeometry, MoleOtvorMaterial );
       
        MoleOtvorMesh.position.y = 1
        MoleOtvorMesh.position.z = -(z/3.5) - 2
        MoleOtvorMesh.position.x = -(x/3.5) + 0.405
  
        MoleOtvorMesh.openEnded = true //nastavení pro dutý 
        MoleOtvorMesh.receiveShadow = true
        MoleOtvorMesh.castShadow = true
  
        MoleOtvorMesh.scale.x = 0.1
        MoleOtvorMesh.scale.z = 0.1
        MoleOtvorMesh.scale.y = 0.1
  
        scene.add(MoleOtvorMesh)
    }
  }

  // vytvoření desky pod otvory
  // vlastní textura
  const Ptexture = new THREE.TextureLoader().load('textures/machine2.jpg')
  const PGeometry = new THREE.PlaneGeometry( 1.15, 1.15 );
  const PMaterial = new THREE.MeshPhysicalMaterial( {
        side: THREE.DoubleSide,
        map: Ptexture,
        roughness: 0.5,
        metalness: 0.5
    } );
  const P = new THREE.Mesh( PGeometry, PMaterial );

  P.receiveShadow = true
  P.castShadow = true

  P.position.y = MachineWallHeight - 0.05
  P.position.z = -MachineWallOffset
  P.rotation.x = Math.PI / 2

  scene.add(P)
}

// zavolání fce na vytvoření konzole
MoleMachineMoje()



/////////////////// krtci //////////////////////

// definování základních proměnných a konstant potřebných pro proces vytváření krtků
let moleY = 1
let molesCount = null
  
const maxMoleY = 1.1
const minMoleY = 0.75

const MolesLog = []
const MolesArr = []

// funkce na samotné vytvoření krtků
function createMoles() {

  let mole_count = 0
  
  // čtverec 4x4 krtků, tj. 16 celkem
  for (let x = 0; x < 4; x++) {
    for (let z = 0; z < 4; z++) {
  
      // načtení modelu pomocí třídy GTLFLoader
      modelLoader.load(MolePath, (Mole) => {
  
        let MoleModel = Mole.scene
  
        // hledání, které vlákno je mesh. Až se najde, nastaví se u něj nastavení pro stín a material
      MoleModel.traverse(n => {
        if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
            n.geometry.computeBoundingSphere();
            if (n.material.map) {
              n.material.map.anisotropy = 16;
            }
        }
      })
      
      // dynamické nastavení pozice krtka podle jeho pořadí
      MoleModel.position.y = minMoleY
      MoleModel.position.z = -(z/3.5) - 2
      MoleModel.position.x = -(x/3.5) + 0.405
  
      // nastavení velikosti krtka
      MoleModel.scale.x = 0.1
      MoleModel.scale.z = 0.1
      MoleModel.scale.y = 0.1
  
      // DŮLEŽITÉ PRO TENTO PROJEKT - nastavení "name" parametru, aby dle něj šlo u raycastingu rozlišovat, jestli hráč kliká na krtka
      MoleModel.name = "mole_model-" + mole_count; mole_count++;
        
      molesGroup.add(MoleModel)
      MolesArr.push(MoleModel) // vložení krtka do pole MolesArr, DŮLEŽITÉ
      //console.log(MoleModel)
       
      }) 
    }
  }
  
}
createMoles() // vytvoření krtků


// konstanta a interval na pohyb krtků
const intervalFrekvence = 5
const RandomizeMoleHeights = setInterval(() => {
  
  // pokračuj, pouze pokud není časovač na 0 nebo není pauza
  if (!controls.isLocked) { return }
  if (timeLeft == 0) { return }

  // iterace skrz pole MolesArr, které obsahuje modely krků
  for (const [index, object] of Object.entries(MolesArr)) {

    // pokud na pozici index v poli MolesLog se nachází hodnota "up", rovnou pokračuj na dalšího krtka (stávajícího je již vysunut)
    if (MolesLog[index] == "up") { continue }

    let chance = Math.random() 

    if (chance <= 0.3) { // procenta úspěšnosti vysunutí krtka nahoru (0.3 = 30%)
      // každých 5ms posuň pozici krtka na ose Y o 0.05 bodů nahoru, vytvoří to téměř plynulou animaci posunu
      const goUp = setInterval(() => {
        object.position.y += 0.05; 
        if (object.position.y >= maxMoleY) { clearInterval( goUp ) } // jakmile se pozice krtka vyrovná, přestaň posouvat
      }, intervalFrekvence)

      MolesLog[index] = "up"
      
      // delay pro dobu jak dlouho krtek zůstane vysunutý, vždy náhodný
      const MoleDelaySec = (Math.floor((Math.random() * 2) + 2)) * 1000
      
      setTimeout(function () {
        // stejný princip animace jako u vysouvání
        const goDown = setInterval(() => {
          object.position.y -= 0.05; 
          if (object.position.y <= minMoleY) { clearInterval( goDown ) }
        }, intervalFrekvence)

        setTimeout(function () {
          MolesLog[index] = "down"
        }, MoleDelaySec)
        // musí být 2 timeouty, protože ten druhý dělá "delay", než se to znovu může hnout (aby krtek neskákal nahoru ihned po tom, co spadne dolů)

      }, MoleDelaySec)
    }
  }
},1000)


////////////////// KLÁVESNICE ///////////////

// zaznamenávání kláves do pole keyboard
const keyboard = []
addEventListener("keydown", (e) =>{
  keyboard[e.key] = true
})
addEventListener("keyup", (e) =>{
  keyboard[e.key] = false
})

let actualSpeed, xCamPos, yCamPos, zCamPos
let lastCameraPos = [0, 0]

function processKeyboard(delta, isPlaying) {

  // pokud je pauza, vyjdi z fce (nelze se hýbat)
  if (!isPlaying) { return }

  actualSpeed = delta * PLAYER_SPEED

  // proměnné pro jednoduší manipulaci se souřadnicemi pozice kamery
  xCamPos = camera.position.x
  yCamPos = camera.position.y
  zCamPos = camera.position.z

  // ukládání posledních X a Y souřadnic
  lastCameraPos[0] = parseFloat(xCamPos.toFixed(2))
  lastCameraPos[1] = parseFloat(zCamPos.toFixed(2))

  const barrierOffset = 0.0075

  // zkontroluje vrácenou hodnotu z fce CheckForMachineBarrier 
  if (!checkForMachineBarrier(xCamPos, zCamPos)) {
    
    // podmínky kontrolující zda kamera nekoliduje s konzolí
    // pokud koliduje, nastaví poslední souřadnice kamery a vrátí kameru
    if (zCamPos <= machineBarriers[0][0]) { lastCameraPos[1] += barrierOffset }
    if (zCamPos >= machineBarriers[1][0]) { lastCameraPos[1] -= barrierOffset }
    if (xCamPos <= machineBarriers[1][0]) { lastCameraPos[0] += barrierOffset }
    if (xCamPos >= machineBarriers[1][1]) { lastCameraPos[0] -= barrierOffset }
    
    camera.position.x = lastCameraPos[0]
    camera.position.z = lastCameraPos[1]
    console.log("machine issue")
  }

  // zkontroluje vrácenou hodnotu z fce checkForCollision, která kontroluje, zda je kamera uvnitř místnosti
  else if (!checkForCollision(xCamPos, zCamPos)) 
  {
    // stejný princip jako u předchozí podmínky

    if (lastCameraPos[0] < 0) {lastCameraPos[0] += barrierOffset}
    if (lastCameraPos[0] > 0) {lastCameraPos[0] -= barrierOffset}
    if (lastCameraPos[1] < 0) {lastCameraPos[1] += barrierOffset}
    if (lastCameraPos[1] > 0) {lastCameraPos[1] -= barrierOffset}
    camera.position.x = lastCameraPos[0]
    camera.position.z = lastCameraPos[1]
    console.log("wall issue")

    // pokud veškeré podmínky proběhnou v pořádku, kamera je posunuta dle stisknuté klávesy
  } else {
  
    if (keyboard["w"] || keyboard["W"]) {
      controls.moveForward(actualSpeed)
    }
    if (keyboard["s"] || keyboard["S"]) {
      controls.moveForward(-actualSpeed)
    }
    if (keyboard["d"] || keyboard["D"]) {
      controls.moveRight(actualSpeed)
    }
    if (keyboard["a"] || keyboard["A"]) {
      controls.moveRight(-actualSpeed)
    }
  }
}

// povolené rozsahy souřadnic, ve kterých se může kamera hýbat, pro konzoli a stěny místnosti
const machineBarriers = [ 
  [-1.60, -3.20], // z range from to
  [-0.80,  0.80], // x range from to
]
const wallBarriers = [
  //x + z
  [-14.50,  14.50],
  [ 14.50, -14.50]
]

// fce na kontrolu kolize stěn
function checkForCollision(camX, camZ) {
  
  if (
      (camX >= wallBarriers[0][0] && camZ <= wallBarriers[0][1]) &&
      (camX <= wallBarriers[1][0] && camZ >= wallBarriers[1][1])
    ) 
  {
    return true
  }

  return false
}
// fce na kontrolu kolize konzole
function checkForMachineBarrier(camX, camZ) {

  if ((camZ <= machineBarriers[0][0] && camZ >= machineBarriers[0][1]) && 
      (camX >= machineBarriers[1][0] && camX <= machineBarriers[1][1])
      ) 
  {
    return false
  }

  return true
}

/////////////////// ON EVENT //////////////////////

// funkce po každém kliknutí myší 
const onMouseClick = (event) => {

  // pokud není kurzor zamčen, vyjeď s funkce
  if (!controls.isLocked) { return }

  event.preventDefault();

  vector3.applyQuaternion(camera.quaternion); 
  vector3.normalize();        

  raycaster.setFromCamera(pointer, camera)
  const intersects = raycaster.intersectObjects(scene.children) // všechny objekty, kterými prochází paprsek raycastu

  // nejdříve se kontroluje, zda paprsek nějaké objekty protl
  if (intersects.length > 0) {

    const selectedPiece = intersects[0] // první protnutý objekt v pořadí

    // kontroluje, zda vzdálenost mezi kamerou a prvním protnutým objektem je menší nebo rovna hodnotě TOUCH_DISTANCE
    if (selectedPiece.distance <= TOUCH_DISTANCE) {

      // hodnoty prvního prot. objektu
      const MoleMesh = selectedPiece.object.parent.parent.parent.parent.parent.parent
      const MoleName = MoleMesh.name
      const MoleNumber = MoleName.split("-")[1]
  
      // DŮLEŽITÉ - pokud atribut "name" má v hodnotě "mole_model" (nastavovalo se dříve), provádí se kód dále
      if (MoleName.split("-")[0] == "mole_model") {
  
        points++ ; updateScoreText(points); // přičtení bodů a upravení 3D textu

        // zahraje zvuk úhozu
        hitAudio.pause();
        hitAudio.currentTime = 0;
        hitAudio.play();
  

        // stejný princip jako u funkce pohybů krtků. Zde se krtek zasunuje dolů
        const MoleDelaySec = (Math.floor((Math.random() * 2) + 2)) * 1000
        
        setTimeout(function () {
          const goDown = setInterval(() => {
            MoleMesh.position.y -= 0.05; 
            if (MoleMesh.position.y <= minMoleY) { clearInterval( goDown ) }
          }, intervalFrekvence)
  
          setTimeout(function () {
            MolesLog[MoleNumber] = "down"
          }, MoleDelaySec)
        }, 10)
      }
    }
  }
}


////////////////// TEXT SKÓRE ///////////////

let scoreTextMesh = null

// fce na vytváření textu, parametr points uvádí, kolik bodů se v textu zobrazuje
function createScoreText(points) {
  // načtení pomocí třídy FontLoader
  const fontLoader = new FontLoader()
  fontLoader.load(
    "Fonts/helvetica.json", (font) => {
      const textGeometry = new TextGeometry(`Skóre:\n${points}` , {
        // nastavení parametrů textu
        size: 2.5,
        height: 0.05, 
        bevelThickness: 10,
        font:font
      })
      const textMaterial = new THREE.MeshPhongMaterial();
      scoreTextMesh = new THREE.Mesh(textGeometry, textMaterial)
      // umístění textu
      scoreTextMesh.position.x = -5
      scoreTextMesh.position.z = -14.9
      scoreTextMesh.position.y = 6.5
      // přidání do skupiny textGroup
      textGroup.add(scoreTextMesh); 
    }
  )
}
createScoreText(points)

// fce na upravení textu, volá se při zásahu krtka s novým parametrem bodů
function updateScoreText(points) {
  textGroup.remove(scoreTextMesh)
  createScoreText(points); 
  points++;
}

////////////////// EVENT LISTENERS ///////////////

// JS události a spouštějící fce
window.addEventListener('click', onMouseClick)
window.addEventListener('onPointerLockError', () => {alert("error, sry, refreshni to")})

////////////////// RENDER FUNKCE ///////////////


// finální nastavení kamery (poměr stran, aplikování změn)
camera.aspect = app.clientWidth / app.clientHeight
camera.updateProjectionMatrix();

// nastavení velikosti vykreslovací jednotky
renderer.setSize(width, height)

function render() {

  // nevykreslovat, pokud není uzamčený kurzor
  if (!controls.isLocked ) { return; }

  // hodnota delta důležitá pro rychlost pohybu kamery
  let delta = clock.getDelta()
  processKeyboard(delta, isPlaying)

  // vykreslení scény a následné znovuzavolání 
  renderer.render(scene, camera)
  renderer.setAnimationLoop(render)
  
}
renderer.setAnimationLoop(render)