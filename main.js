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
const groundTexture = loadTexture("textures/ground.png");
groundTexture.repeat.set(250 / 4, 250 / 4);
// const skyboxTexture = loadTexture("textures/skybox.png");

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

// const skyboxGeometry = new THREE.BoxGeometry(500, 500, 500);
// const skyboxMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: skyboxTexture });
// const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);

const groundGeometry = new THREE.PlaneGeometry(250, 250);
const groundMaterial = new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: groundTexture });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.set(Math.PI/2, 0, Math.PI);

// scene.add(skybox);
scene.add(ground);

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
function lerp(a, b, alpha) {
    return a + alpha * (b - a);
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



class Item {
    constructor(name, spritesheet, idle, useAnim) {
        this.name = name;
        this.spritesheet = spritesheet;
        this.idle = idle;
        this.useAnim = useAnim;
        this.hasSecondUse = false;
    }   
}
let itemDict = {
    "pistol": new Item("Pistol", "textures/pistol.png", 0, [0, 1, 2, 3, 0])
}

let animationQueue = [];
let inventory = ["pistol"];
let slot = 0;
let curItem = itemDict[inventory[slot]];

const secondsPerFrame = 0.075;
let frameTick = secondsPerFrame;
document.addEventListener("mousedown", () => {
    animationQueue = [...curItem.useAnim];
    frameTick = secondsPerFrame;
});

// ========================================================================================
document.addEventListener("DOMContentLoaded", load, false);

function load() {
    debug = document.querySelector("#debug");
    viewmodel = document.querySelector("#viewmodel");
    document.getElementById("resume").addEventListener("click", () => {
        controls.lock();
    });

    // remvov later

    viewmodel.style.background = `url("${curItem.spritesheet}")`;
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

    if (viewmodel) {
        viewmodel.style.transform = 
            `translate(calc(${bobbingOffset.x}vh - 50%), calc(1px + ${bobbingOffset.y}vh))`;
        
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
    // skybox.position.set(finalCameraPosition.x, finalCameraPosition.y, finalCameraPosition.z);
    // skybox.rotation.set(-timeElapsed * 0.005, -timeElapsed * 0.005, 0);

    // ========================================================================================

    // Display debug info
    // console.log(debug);
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