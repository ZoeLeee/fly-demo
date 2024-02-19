import { AmbientLight, EquirectangularReflectionMapping, Scene } from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const root = document.getElementById("root")!;

const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath("/loader/dracoGltf/");
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const fontLoader = new FontLoader();

const renderer = new THREE.WebGLRenderer();

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

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

ambientLight.intensity = 0.5

scene.add(ambientLight);

scene.background = new THREE.Color("#ccc");

const pmremGenerator = new THREE.PMREMGenerator(renderer); // 使用hdr作为背景色
pmremGenerator.compileEquirectangularShader();

const direction = new THREE.DirectionalLight(0xffffff, 2);

direction.position.set(0.3, 1.018, -2.7)

scene.add(direction)

direction.castShadow = true

direction.shadow.autoUpdate = true

direction.shadow.normalBias = 0
direction.shadow.bias = 0.000055
direction.shadow.radius = 40

// scene.add(new THREE.DirectionalLightHelper(direction, 1))


new RGBELoader()
  .setPath("./textures/")
  .load("table_mountain_1_puresky_2k.hdr", function (texture) {
    texture.mapping = EquirectangularReflectionMapping;
    // texture.flipY = false;

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;


    // scene.environment = envMap; // 给场景添加环境光效果
    scene.background = envMap; // 给场景添加背景图

    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    pmremGenerator.dispose();
  });

const promiseMap = new Map<THREE.AnimationMixer, ((v: any) => any)[]>();

const geometry = new THREE.PlaneGeometry(50, 50);
const material = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  // side: THREE.DoubleSide,
});
const groud = new THREE.Mesh(geometry, material);
groud.rotateX(-Math.PI / 2);
groud.receiveShadow = true
// scene.add(groud);

let gltf = await loader.loadAsync(BASE_URL + "/models/runway.glb");
const runway = gltf.scene;
// scene.add(runway)

const labelGltf = await loader.loadAsync(BASE_URL + "/models/label.glb");

const label = labelGltf.scene;

label.receiveShadow = true


label.traverse((child: any) => {
  const material = child["material"];
  if (material) {
    // material.envMapIntensity = 1.5;
    // material.color = new THREE.Color(0xd66b00);
    // material.metalness = 0.2;
    // material.roughness = 0.1;
  }
  (child as THREE.Mesh).receiveShadow = true
});
// scene.add(label)

const labelMixer = new THREE.AnimationMixer(label);
labelMixer.addEventListener("finished", (evt) => {
  const arr = promiseMap.get(labelMixer);
  if (arr) {
    arr.forEach((r) => r(true));
    arr.length = 0;
  }
});

const markerGltf = await loader.loadAsync(BASE_URL + "/models/newModels/marker.glb");
const marker = markerGltf.scene;
const markerMixer = new THREE.AnimationMixer(marker);

const hiddenMarkerAction = markerMixer.clipAction(markerGltf.animations[1]);
hiddenMarkerAction.loop = THREE.LoopOnce;
hiddenMarkerAction.clampWhenFinished = true

const showMackerAction = markerMixer.clipAction(markerGltf.animations[0]);

showMackerAction.loop = THREE.LoopOnce;

showMackerAction.clampWhenFinished = true

markerMixer.addEventListener("finished", (evt) => {
  const arr = promiseMap.get(markerMixer);
  if (arr) {
    arr.forEach((r) => r(true));
    arr.length = 0;
  }
});

marker.castShadow = true

marker.traverse((child: any) => {
  if (child.geometry) {
    (child as THREE.Mesh).castShadow = true;
  }
});

marker.position.z = -0.3

// scene.add(marker);

gltf = await loader.loadAsync(BASE_URL + "/models/newModels/plane.glb");

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

    cityTextMesh.name = "text"
    textGeometry.center();
    cityTextMesh.rotation.set(-Math.PI / 2, 0, 0);
    cityTextMesh.position.set(0, 0.1, 0);

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

const btn = document.getElementById("startBTN")!

btn.onclick = async (e) => {
  btn.style.display = "none"
  const text = await fontPromise;

  //add label
  scene.add(label);
  const labelAnRoot = label.getObjectByName("Cube001") as THREE.Mesh


  const labelClips = labelGltf.animations;
  const clip = THREE.AnimationClip.findByName(labelClips, "Cube.001Action.002");

  clip.duration = 0.3;
  const action = labelMixer.clipAction(clip);
  action.clampWhenFinished = true;
  action.loop = THREE.LoopOnce;
  action.reset();
  action.play();
  await waitAnimationEnd(labelMixer);

  labelAnRoot.add(text);
  //add marker

  scene.add(marker)
  marker.getObjectByName("Bone")?.scale.set(0, 0, 0)
  marker.position.y = 0.12


  showMackerAction.reset();
  showMackerAction.play();

  await waitAnimationEnd(markerMixer);

  showMackerAction.stop()

  action.reset();
  clip.duration = 2.3;
  action.time = 1.8;
  action.play();

  hiddenMarkerAction.reset();
  hiddenMarkerAction.play();


  await Promise.all([
    waitAnimationEnd(labelMixer).then(() => {
      labelAnRoot.remove(text)
      scene.remove(label);
      action.stop()
      return true
    }),
    waitAnimationEnd(markerMixer).then(() => {
      scene.remove(marker);
      hiddenMarkerAction.stop()
      return true
    })
  ])

  btn.style.display = "block"
};


