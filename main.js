import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x010203, 15, 85);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let debug = null;
let viewmodel = null;

const renderer = new THREE.WebGLRenderer();
const cock = new THREE.Clock();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.antialias = true;
document.body.appendChild(renderer.domElement);

// const controls = new OrbitControls(camera, renderer.domElement);
const controls = new PointerLockControls(camera, document.body);
const loader = new GLTFLoader();

// ========================================================================================

// Textures
function loadTexture(path) {
    let texture = new THREE.TextureLoader().load(path);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    return texture;
}
const groundTiling = 4.0;
const groundTexture = loadTexture("textures/ground.png");
groundTexture.repeat.set(250 / groundTiling, 250 / groundTiling);

// ========================================================================================

// pos-x, neg-x, pos-y, neg-y, pos-z, neg-z
scene.background = new THREE.CubeTextureLoader().setPath("textures/skybox/").load([
    "right.png",
    "left.png",
    "top.png",
    "bottom.png",
    "front.png",
    "back.png"
]);
scene.background.minFilter = scene.background.magFilter = THREE.NearestFilter;
const ambient = new THREE.AmbientLight(0x233d70);
scene.add(ambient);

const groundGeometry = new THREE.PlaneGeometry(250, 250);
const groundMaterial = new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: groundTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.set(Math.PI/2, 0, Math.PI);

scene.add(ground);

// ========================================================================================



class Item {
    constructor(name, spritesheet, idle, useAnim, xOffset = 0) {
        this.name = name;
        this.spritesheet = spritesheet;
        this.idle = idle;
        this.useAnim = useAnim;
        this.hasSecondUse = false;
        this.xOffset = xOffset;
    }   
    use() {
        animationQueue = [...this.useAnim];
        frameTick = secondsPerFrame;
    }
    equip() {
        viewmodel.style.background = `url("${curItem.spritesheet}")`;
        viewmodelVerticalOffset = itemSwitchOffset;
    }
}

let itemDict = {
    "fist": new Item("Bare Fists", "textures/fist.png", 0, [0], 7.5),
    "pistol": new Item("Pistol", "textures/pistol.png", 0, [0, 1, 2, 3, 0]),
    "test": new Item("testing lmao", "textures/grass.png", 0, [0])
}
let animationQueue = [];
let inventory = [
    {"item": "fist", "keyCode": "1"},
    {"item": "pistol", "keyCode": "2"}, 
    {"item": "test", "keyCode": "3"},
    {"item": null, "keyCode": "4"},
    {"item": null, "keyCode": "5"},
    {"item": null, "keyCode": "6"},
    {"item": null, "keyCode": "7"},
    {"item": null, "keyCode": "8"}
];
let slot = 0;
let curItem = null;
let viewmodelVerticalOffset = 0;
const itemSwitchOffset = 50;

const secondsPerFrame = 0.075;
let frameTick = secondsPerFrame;
document.addEventListener("mousedown", () => {
    curItem.use();
});

function switchToItem(index, forced = false) {
    if ((index == slot && !forced) || inventory[slot].item == null) {
        return;
    }

    slot = index;
    curItem = itemDict[inventory[slot].item];

    // alert(`pppp ${JSON.stringify(curItem)}`);
    curItem.equip();
}


// ========================================================================================


let locked = false;
controls.addEventListener("lock", () => {
	menu.style.display = "none";
    locked = true;
});

controls.addEventListener("unlock", () => {
	menu.style.display = "block";
    locked = false;
});


// Input shenanigans
let horizontalAxisRaw = {left: 0, right: 0};
let verticalAxisRaw = {up: 0, down: 0};

let horizontalAxis = 0;
let verticalAxis = 0;

let sensitivity = 0.6;
let sprinting = 0;

document.addEventListener("keydown", onKeyDown, false);
document.addEventListener("keyup", onKeyUp, false);



function onKeyDown(event) {
    let keyCode = event.key;

    if (keyCode == "w" || keyCode == "W" || keyCode == "ArrowUp") verticalAxisRaw.up = 1;
    if (keyCode == "s" || keyCode == "S" || keyCode == "ArrowDown") verticalAxisRaw.down = 1;
    if (keyCode == "a" || keyCode == "A" || keyCode == "ArrowLeft") horizontalAxisRaw.left = 1;
    if (keyCode == "d" || keyCode == "D" || keyCode == "ArrowRight") horizontalAxisRaw.right = 1;

    if (keyCode == "Shift") sprinting = 1;

    for (let i = 0; i < Object.keys(itemDict).length; i++) {
        if (keyCode == inventory[i].keyCode) {
            switchToItem(i);
        }
    }
}
function onKeyUp(event) {
    let keyCode = event.key;

    if (keyCode == "w" || keyCode == "W" || keyCode == "ArrowUp") verticalAxisRaw.up = 0;
    if (keyCode == "s" || keyCode == "S" || keyCode == "ArrowDown") verticalAxisRaw.down = 0;
    if (keyCode == "a" || keyCode == "A" || keyCode == "ArrowLeft") horizontalAxisRaw.left = 0;
    if (keyCode == "d" || keyCode == "D" || keyCode == "ArrowRight") horizontalAxisRaw.right = 0;

    if (keyCode == "Shift") sprinting = 0;
}

// ========================================================================================

// Utility functions

function twoDecPlaces(value) {
    return Math.round(value * 100) / 100;
}
function groundTilePosition(value) {
    return Math.round(value / groundTiling) * groundTiling;
}
function lerp(a, b, alpha) {
    return a + alpha * (b - a);
}
function exec() {
    let command = document.getElementById('command-prompt').value;
    let commands = {
        "toLimit": () => {playerPosition.set(9223372036854700000, 0, 9223372036854700000)},
        "toSpawn": () => {playerPosition.set(0, 0, 0)}
    }
    try {
        commands[command]();
    }
    catch {
        alert("idiot");
    }
}

// ========================================================================================

let playerPosition = new THREE.Vector3(0, 0, 0);
let playerRotation = new THREE.Vector3(0, 0, 0);
let cameraOffset = new THREE.Vector3(0, 2, 0);

const walkSpeed = 6;
const runSpeed = 12;
const additionalSpeedRun = runSpeed - walkSpeed;

let bobbingOffset = new THREE.Vector2(0, 0);
let bobbingMultiplier = 0;
let bobbingMultiplierLerped = 0;

let timeElapsed = 0;

// ========================================================================================
document.addEventListener("DOMContentLoaded", load, false);

function load() {
    document.getElementById("commands").onsubmit = () => {
        exec();
        return false;
    }
    debug = document.querySelector("#debug");
    viewmodel = document.querySelector("#viewmodel");
    document.getElementById("resume").addEventListener("click", () => {
        controls.lock();
    });

    // Equip firts item

    switchToItem(0, true);
}
function update() {
	requestAnimationFrame(update);
    renderer.setSize(window.innerWidth, window.innerHeight);

    horizontalAxis = horizontalAxisRaw.right - horizontalAxisRaw.left;
    verticalAxis = -verticalAxisRaw.up + verticalAxisRaw.down;

    let deltaTime = cock.getDelta();
    timeElapsed += deltaTime;

    // ========================================================================================

    // Code here ig
    const theta = camera.rotation.y;

    const forwardMovementVector = new THREE.Vector3(0, 0, 1);
    let cameraQuaternion = camera.quaternion.clone();
    cameraQuaternion.x = cameraQuaternion.z = 0;

    forwardMovementVector.applyQuaternion(cameraQuaternion);
    forwardMovementVector.setY(0);
    forwardMovementVector.multiplyScalar(verticalAxis);
    const rightMovementVector = new THREE.Vector3(1, 0, 0);
    rightMovementVector.applyQuaternion(cameraQuaternion);
    rightMovementVector.setY(0);
    rightMovementVector.multiplyScalar(horizontalAxis);

    let movementVector = new THREE.Vector3().addVectors(forwardMovementVector, rightMovementVector);
    movementVector.normalize();
    movementVector.multiplyScalar(deltaTime * (walkSpeed + sprinting * additionalSpeedRun));

    playerPosition.add(movementVector);
    
    // Viewmodel bobbing
    if (horizontalAxis != 0 || verticalAxis != 0) {
        bobbingMultiplier = 0.25 + sprinting * 0.75;
    }
    else {
        bobbingMultiplier = 0;
    }
    bobbingMultiplierLerped = lerp(bobbingMultiplierLerped, bobbingMultiplier, 0.3);
    bobbingOffset.set(
        0.5 * Math.sin(Math.sin(timeElapsed * 7) * Math.PI/2),
        1 - Math.cos(Math.sin(timeElapsed * 7) * Math.PI/2));
    bobbingOffset.multiplyScalar(5 * bobbingMultiplierLerped);
    viewmodelVerticalOffset = lerp(viewmodelVerticalOffset, 0, 0.15);

    if (viewmodel) {
        viewmodel.style.transform = 
            `translate(calc(${bobbingOffset.x + curItem.xOffset}vh - 50%), calc(1px + ${bobbingOffset.y + viewmodelVerticalOffset}vh))`;
        
        // Animate viewmodel
        let spriteIndex = curItem.idle;
        if (animationQueue.length != 0) {
            console.log(animationQueue);
            spriteIndex = animationQueue[0];
            if (frameTick <= 0) {
                animationQueue.shift();
                frameTick = secondsPerFrame;
            }
            else {
                frameTick -= deltaTime;
            }
        }
        viewmodel.style.backgroundPosition = `0 calc(-1px - ${55 * spriteIndex}vh)`;
    }

    // Set camera position
    const finalCameraPosition = new THREE.Vector3(0, 0, 0);
    finalCameraPosition.addVectors(playerPosition, cameraOffset);
    camera.position.set(finalCameraPosition.x, finalCameraPosition.y, finalCameraPosition.z);

    // Set ground position
    ground.position.set(groundTilePosition(playerPosition.x), 0,  groundTilePosition(playerPosition.z));

    // ========================================================================================

    // Display debug info
    if (debug != null) {
        debug.innerHTML = `
            <h3>DEBUG INFO</h3><hr>
            Mov: H: ${horizontalAxis}; V: ${verticalAxis}; S: ${sprinting}<br>
            Pos: (${twoDecPlaces(playerPosition.x)}, ${twoDecPlaces(playerPosition.y)}, ${twoDecPlaces(playerPosition.z)})<br>
            Rot: (${twoDecPlaces(camera.rotation.x)}, ${twoDecPlaces(camera.rotation.y)}, ${twoDecPlaces(camera.rotation.z)})<br>
            Cam: (${twoDecPlaces(finalCameraPosition.x)}, ${twoDecPlaces(finalCameraPosition.y)}, ${twoDecPlaces(finalCameraPosition.z)})<br>`;
    }

    renderer.render(scene, camera);
}
update();