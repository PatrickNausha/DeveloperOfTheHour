import { Scene, PerspectiveCamera, WebGLRenderer, ShaderMaterial, Mesh, BoxGeometry, Vector2, Color } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { updateStats, toggleStats } from "./debug-stats";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

const renderer = new WebGLRenderer({ antialias: true });
const devicePixelRatio = window.devicePixelRatio || 1;
const clearColor = new Color(0.07, 0.07, 0.15);
renderer.setPixelRatio();
renderer.setClearColor(clearColor);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// In the beginning ...
const scene = new Scene();

// Camera
const camera = new PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;
new OrbitControls(camera, renderer.domElement);

const uniforms = {
	time: { value: 1.0 },
	scanLineWidth: { value: 3 * devicePixelRatio },
	scanLineSpeed: { value: 10 },
	clearColor: { value: clearColor },
};
const material = new ShaderMaterial({
	uniforms,
	transparent: true,
	vertexShader: `
		varying vec2 vUv;
		varying vec3 vNormal;
		void main()
		{
			vUv = uv;
			vNormal = normal;
			vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			gl_Position = projectionMatrix * mvPosition;
		}`,
	fragmentShader: `
		uniform float scanLineWidth;
		uniform float scanLineSpeed;
		uniform float devicePixelRatio;
		uniform float time;
		uniform vec3 clearColor;
		varying vec2 vUv;	// Interpolated UV coordinate passed in from vertex shader
		varying vec3 vNormal;	// Interpolated Normal vector passed in from vertex shader

		// Psuedo-random generator from https://thebookofshaders.com/10/
		float random(vec2 st) {
			return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
		}

		void main() {
			float lightingBrightness = max(dot(vNormal, vec3(1, 0.7, 0.1)), 0.0);	// Poor man's lighting

			// For some "noise," use an exponential sin-based equation with some prime numbers thrown in.
			float adderX = (gl_FragCoord.y + time * scanLineSpeed * 40.0) / (scanLineWidth * 10.0);
			float constructiveInterference = 0.95 * sin(adderX) * sin(adderX / 3.0) * sin(adderX / 13.0) / 3.0;

			float scanLineMultiplier = min(abs(sin(gl_FragCoord.y * scanLineWidth - time * scanLineSpeed)) + 0.5, 1.0);
			float filmGrain = random(gl_FragCoord.xy / 100.0 * time) / 2.0;
			float brightness = (lightingBrightness + constructiveInterference) * scanLineMultiplier + filmGrain;

			// We want to occlude ourselves, so let's cheat instead of using opacity. This demo only has holograms on screen
			// so we can just interpolate between desired color and clear color :)
			vec3 color = mix(clearColor.xyz, vec3(0.1, 0.2, 1.0), brightness);
			
			gl_FragColor = vec4(color, 1.0);
		}
	`,
});

const box = new Mesh(new BoxGeometry(2, 2, 2), material);
scene.add(box);

// Show stats
toggleStats();

// Add render passes
const composer = new EffectComposer(renderer);
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 0.75, 1, 0.2);
composer.addPass(bloomPass);

const fxaaPass = new ShaderPass(FXAAShader);
const pixelRatio = renderer.getPixelRatio();
fxaaPass.material.uniforms["resolution"].value.x = 1 / (window.innerWidth * pixelRatio);
fxaaPass.material.uniforms["resolution"].value.y = 1 / (window.innerHeight * pixelRatio);
composer.addPass(fxaaPass);

// Main loop
function animate(time) {
	const timeSeconds = time / 1000;
	uniforms.time.value = timeSeconds;
	requestAnimationFrame(animate);
	composer.render(scene, camera);
	updateStats();
}
animate();