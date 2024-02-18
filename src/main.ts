import { AmbientLight, EquirectangularReflectionMapping, Scene } from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";

const root = document.getElementById("root")!;

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("/loader/dracoGltf/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const fontLoader = new FontLoader();

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

camera.position.z = 3;
camera.position.y = 3;
camera.position.x = 0;

const controls = new OrbitControls(camera, renderer.domElement);

//controls.update() must be called after any manual changes to the camera's transform
controls.update();

const ambientLight = new AmbientLight(0xffffff);

scene.add(ambientLight);

scene.background = new THREE.Color("#ccc");

new RGBELoader()
  .setPath("./textures/")
  .load("table_mountain_1_puresky_2k.hdr", function (texture) {
    texture.mapping = EquirectangularReflectionMapping;
    texture.flipY = false;
  });

const promiseMap = new Map<THREE.AnimationMixer, ((v: any) => any)[]>();

const geometry = new THREE.PlaneGeometry(5, 5);
const material = new THREE.MeshBasicMaterial({
  color: 0xfffff0,
  side: THREE.DoubleSide,
});
const groud = new THREE.Mesh(geometry, material);
groud.rotateX(Math.PI / 2);
scene.add(groud);

let gltf = await loader.loadAsync("/models/runway.glb");
const runway = gltf.scene;
// scene.add(runway)

const labelGltf = await loader.loadAsync("/models/label.glb");

const label = labelGltf.scene;
// scene.add(label)
const labelMixer = new THREE.AnimationMixer(label);
labelMixer.addEventListener("finished", (evt) => {
  const arr = promiseMap.get(labelMixer);
  if (arr) {
    console.log('labelMixer: ', arr);
    arr.forEach((r) => r(true));
    arr.length = 0;
  }
});

const markerGltf = await loader.loadAsync("/models/newModels/marker.glb");

const marker = markerGltf.scene;
const markerMixer = new THREE.AnimationMixer(marker);

markerMixer.addEventListener("finished", (evt) => {
  const arr = promiseMap.get(markerMixer);
  if (arr) {
    console.log('markerMixer: ', arr);
    arr.forEach((r) => r(true));
    arr.length = 0;
  }
});

scene.add(marker);
marker.visible = false;

gltf = await loader.loadAsync("/models/newModels/plane.glb");

const plane = gltf.scene;
// scene.add(plane)

const fontPromise = fontLoader
  .loadAsync(
    "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json"
  )
  .then((font) => {
    const textGeometry = new TextGeometry("Text", {
      font: font,
      size: 0.25,
      height: 0.01,
    });

    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const cityTextMesh = new THREE.Mesh(textGeometry, textMaterial);

    cityTextMesh.name="text"
    textGeometry.center();
    cityTextMesh.rotation.set(-Math.PI / 2, 0, 0);
    cityTextMesh.position.set(0, 0.18, 0);

    return cityTextMesh;
  });

const clock = new THREE.Clock();
const clock2 = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // required if controls.enableDamping or controls.autoRotate are set to true
  controls.update();

  renderer.render(scene, camera);

  labelMixer.update(clock.getDelta());
  markerMixer.update(clock2.getDelta());
}
animate();

async function waitAnimationEnd(mixer: THREE.AnimationMixer) {
  return new Promise((res) => {
    let arr = promiseMap.get(mixer);

    if (!arr) {
      arr = [res];
      promiseMap.set(mixer, arr);
    } else {
      arr.push(res);
    }
  });
}

document.getElementById("startBTN")!.onclick = async (e) => {
    console.log('scene: ', scene);
  //add label
  scene.add(label);
  const labelClips = labelGltf.animations;
  const clip = THREE.AnimationClip.findByName(labelClips, "Cube.001Action.002");
  console.log('clip: ', clip);
  clip.duration = 0.5;
  const action = labelMixer.clipAction(clip);
  action.reset();
  action.clampWhenFinished = true;
  action.loop = THREE.LoopOnce;
  action.play();
  await waitAnimationEnd(labelMixer);

  const text = await fontPromise;
  label.add(text);

  //add marker

  const markerClips = markerGltf.animations;

  const defaultMarkerClip = THREE.AnimationClip.findByName(
    markerClips,
    "marker_idle_scale_0"
  );

  const markerDefaultAction = markerMixer.clipAction(defaultMarkerClip);

  markerDefaultAction.loop = THREE.LoopOnce;

  //   markerDefaultAction.time=0.03
  markerDefaultAction.reset()
  markerDefaultAction.play();
  markerDefaultAction.clampWhenFinished=true
  await waitAnimationEnd(markerMixer)

  marker.visible = true;

  const showMarkerClip = THREE.AnimationClip.findByName(
    markerClips,
    "marker_appearing_animation"
  );
  const hiddenMarkerClip = THREE.AnimationClip.findByName(
      markerClips,
      "marker_disappearing_animation"
      );

  const showMackerAction = markerMixer.clipAction(showMarkerClip);

  showMackerAction.loop = THREE.LoopOnce;

  showMackerAction.clampWhenFinished=true
  showMackerAction.reset();
  showMackerAction.play();

  await waitAnimationEnd(markerMixer);


  console.log('hiddenMarkerClip: ', hiddenMarkerClip);
  const hiddenMarkerAction = markerMixer.clipAction(hiddenMarkerClip);
  hiddenMarkerAction.loop = THREE.LoopOnce;
  hiddenMarkerAction.clampWhenFinished=true
  hiddenMarkerAction.reset();
  hiddenMarkerAction.play();
  
  
  clip.duration = 2.4;
  action.reset();
  action.time = 1.5;
  action.play();
  label.remove(text)

  await Promise.all([waitAnimationEnd(labelMixer),waitAnimationEnd(markerMixer)])
  marker.visible=false
  scene.remove(label);

};

function sleep(t: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, t);
  });
}
