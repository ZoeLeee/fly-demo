import { AmbientLight, EquirectangularReflectionMapping, Scene } from "three";

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import * as dat from "dat.gui";

const root = document.getElementById('root')!

let guiDebug = new dat.GUI();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath('/loader/dracoGltf/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);



const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);


camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
controls.update();

const ambientLight = new AmbientLight(0xffffff);

scene.add(ambientLight)

new RGBELoader()
    .setPath('./textures/')
    .load('table_mountain_1_puresky_2k.hdr', function (texture) {
        texture.mapping = EquirectangularReflectionMapping;
        texture.flipY = false;
    });

let gltf = await loader.loadAsync('/models/runway.glb')
const runway = gltf.scene
scene.add(runway)

gltf = await loader.loadAsync('/models/label.glb')

const label = gltf.scene
scene.add(label)

gltf = await loader.loadAsync('/models/newModels/marker.glb')

const marker = gltf.scene
scene.add(marker)

gltf = await loader.loadAsync('/models/newModels/plane.glb')

const plane = gltf.scene
scene.add(plane)


function animate() {
    requestAnimationFrame(animate);

    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();

    renderer.render(scene, camera);
}
animate();

