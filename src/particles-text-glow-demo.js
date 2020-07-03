import {
	Scene,
	PerspectiveCamera,
	WebGLRenderer,
	Mesh,
	Group,
	MeshNormalMaterial,
	FontLoader,
	TextGeometry,
	BoxGeometry,
	Box3,
	Vector3,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import helvetikerRegularJson from "three/examples/fonts/helvetiker_regular.typeface.json"; // TODO: Add font license if published to web. https://github.com/mrdoob/three.js/blob/master/examples/fonts/LICENSE
import { makeCentered } from "./positioning";
import { updateStats, toggleStats } from "./debug-stats";

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// In the beginning ...
const scene = new Scene();

// Camera
const camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.z = 160;
new OrbitControls(camera, renderer.domElement);

const font = new FontLoader().parse(helvetikerRegularJson);
const fontGeometry = new TextGeometry("GLOW", {
	font,
	size: 80,
	height: 5,
	curveSegments: 12,
	bevelEnabled: false,
});
const fontMaterial = new MeshNormalMaterial();
const fontMesh = new Mesh(fontGeometry, fontMaterial);
makeCentered(fontMesh);

const fontGroup = new Group();
fontGroup.add(fontMesh);
scene.add(fontGroup);

const confettiBox = new Box3(new Vector3(-1000, -1000, -1000), new Vector3(1000, 1000, 100)); // Box within which to render confetti
const confetti = [];
const confettiPieceCount = 100;
const confettiPieceSize = 20;
for (let pieceCount = 0; pieceCount < confettiPieceCount; pieceCount++) {
	const boxGroup = new Group();
	const material = new MeshNormalMaterial({
		transparent: true,
	});
	const box = new Mesh(new BoxGeometry(confettiPieceSize, confettiPieceSize, confettiPieceSize), material);
	boxGroup.add(box);

	const orientation = getConfettiStartOrientation();
	boxGroup.position.copy(orientation.position);
	boxGroup.rotation.x += orientation.rotationX;
	boxGroup.rotation.y += orientation.rotationX;

	scene.add(boxGroup);
	confetti.push({ group: boxGroup, material });
}

function getConfettiStartOrientation() {
	const confettiBoxSize = confettiBox.getSize(new Vector3());
	return {
		position: new Vector3(
			Math.floor(Math.random() * confettiBoxSize.x) + confettiBox.min.x,
			Math.floor(Math.random() * confettiBoxSize.y) + confettiBox.min.y,
			Math.floor(Math.random() * confettiBoxSize.z) + confettiBox.min.z
		),
		rotationX: Math.random(),
		rotationY: Math.random(),
	};
}

function step(duration) {
	for (const piece of confetti) {
		piece.group.position.y += duration * 100;
		piece.group.rotation.x += duration;
		piece.group.rotation.y += duration;
		if (piece.group.position.y > confettiBox.max.y) {
			const orientation = getConfettiStartOrientation();
			piece.group.position.copy(orientation.position);
			piece.group.rotation.x += orientation.rotationX;
			piece.group.rotation.y += orientation.rotationX;
		}

		// Make more opaque when pointed at us
		const rotatedVector = new Vector3(0, 0, 1);
		rotatedVector.applyEuler(piece.group.rotation);
		piece.material.opacity = new Vector3(0, 0, 1).dot(rotatedVector);
	}
}

// Show stats
toggleStats();

// Main loop
let lastTimeStamp;
function animate(timeStamp) {
	requestAnimationFrame(animate);

	if (!lastTimeStamp) {
		lastTimeStamp = timeStamp;
	}
	const duration = timeStamp - lastTimeStamp;
	step(duration / 1000);

	renderer.render(scene, camera);
	lastTimeStamp = timeStamp;
	updateStats();
}
requestAnimationFrame(animate);
