import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	MeshStandardMaterial,
	Mesh,
	PointLight,
	SphereGeometry,
	AmbientLight,
	PlaneBufferGeometry,
	VSMShadowMap,
	PCFShadowMap,
	PCFSoftShadowMap,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { updateStats, toggleStats } from "./debug-stats";
import { addLight, setDebugLightsOn } from "./lights";
import { slamItOnTheGround } from "./positioning";
import { GUI } from "dat.gui";

const shadowMaps = [PCFSoftShadowMap, VSMShadowMap, PCFShadowMap];

const ambientLightColor = 0x111111;

const renderer = new WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = shadowMaps[0];
renderer.setClearColor(ambientLightColor);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// In the beginning ...
const scene = new Scene();

// Camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 5;
camera.position.y = 5;
camera.position.z = 5;
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = Math.PI * 0.45;

const plainMaterial = new MeshStandardMaterial();

// Add the ground
const groundMesh = new Mesh(new PlaneBufferGeometry(1000, 1000), plainMaterial);
groundMesh.receiveShadow = true;
groundMesh.rotation.x = -Math.PI / 2;
scene.add(groundMesh);

// Tons of spheres for fun
for (let x = -10; x <= 10; x += 5) {
	for (let z = -10; z <= 10; z += 5) {
		const sphere = new Mesh(new SphereGeometry(1, 20, 20), plainMaterial);
		sphere.position.set(x, 0, z);
		sphere.castShadow = true;
		sphere.receiveShadow = true;
		slamItOnTheGround(sphere, x, z, 0);
		scene.add(sphere);
	}
}

// Lights
const whiteLight = new PointLight(0xffffff, 1, 10, 2);
whiteLight.castShadow = true;
whiteLight.shadow.camera.near = 0.001;
whiteLight.shadow.camera.far = 10;
whiteLight.shadow.mapSize.width = 512;
whiteLight.shadow.mapSize.height = 512;
whiteLight.shadow.radius = 4;
const redLight = new PointLight(0xff0000, 1, 10, 2);
redLight.castShadow = true;
redLight.shadow.camera.near = 0.001;
redLight.shadow.camera.far = 10;
redLight.shadow.mapSize.width = 512;
redLight.shadow.mapSize.height = 512;
redLight.shadow.radius = 4;
redLight.castShadow = true;

addLight(scene, whiteLight);
addLight(scene, redLight);

const ambientLight = new AmbientLight(ambientLightColor);
scene.add(ambientLight);

const guiParams = {
	debugLights: true,
	showLight0: true,
	showLight1: true,
};
const gui = new GUI();
gui.add(guiParams, "debugLights").onChange((value) => {
	setDebugLightsOn(value);
});
gui.add(guiParams, "showLight0").onChange((value) => {
	whiteLight.visible = value;
});
gui.add(guiParams, "showLight1").onChange((value) => {
	redLight.visible = value;
});
setDebugLightsOn(guiParams.debugLights);

// Show stats
toggleStats();

// Main loop
function animate() {
	requestAnimationFrame(animate);
	step();
	renderer.render(scene, camera);
	updateStats();
}
animate();

function step() {
	whiteLight.position.set(2 * Math.sin(new Date().getTime() / 1000), 3, 2 * Math.cos(new Date().getTime() / 1000));
	redLight.position.set(1, 3 + 2 * Math.sin(new Date().getTime() / 1000), 3);
}
