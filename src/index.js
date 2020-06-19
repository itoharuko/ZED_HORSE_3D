import * as THREE from 'three'

import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import {
	Lensflare,
	LensflareElement,
} from 'three/examples/jsm/objects/Lensflare.js'
import { DDSLoader } from 'three/examples/jsm/loaders/DDSLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector'

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var light1, light2, light3, light4
var sphereLeft, sphereRight, eyeLeft, eyeRight
var scene, renderer, camera, stats, controls
var model, skeleton, mixer, clock
var shadMat
var shadMat1
var crossFadeControls = []
var mixers = []
var idleAction, walkAction, runAction
var idleWeight, walkWeight, runWeight
var actions, settings
var enableSelection
var singleStepMode = false
var sizeOfNextStep = 0
var mouse = new THREE.Vector2(),
	raycaster = new THREE.Raycaster()

var materialShader, uniforms, uniforms1, uniforms2
var uniformsHorse = []
var sound
var soundVolue = 1.0
var shaderHorse = []

var bg
var ground
var horseMirror
var signs = []
var movingLight
var horseModel
var horseMesh
var horseAnimations = []
var horses = []

var particles = []
var horseShadows = []
var composer, renderPass, bloomPass
var params = {
	exposure: 1,
	bloomStrength: 1.5,
	bloomThreshold: 0.25,
	bloomRadius: 0.6,
	volume: 0.0,
	texture: 1
}
var screenShake = ScreenShake()
var foots = []
var footsBone = []
var crystalFogTex
var noiseTex
var aura
var lookAtPos = new THREE.Vector3(0, 1.0, 0)
var newLookAtPos = lookAtPos
var horseModelpositions
var renderTarget = new THREE.WebGLRenderTarget(512, 512)

const auramaterial = new THREE.RawShaderMaterial({
	uniforms: {
		time: {
			type: 'f',
			value: 0,
		},
		alpha: {
			type: 'f',
			value: 0,
		},
		outlineTex: {
			type: 't',
			value: null,
		},
		noiseTex: {
			type: 't',
			value: null,
		},
	},
	vertexShader: document.getElementById('aura_vertexShader').textContent,
	fragmentShader: document.getElementById('aura_fragmentShader').textContent,
	transparent: true,
})

var manager = new THREE.LoadingManager()
const progressBar = document.querySelector('#progress')
const loadingOverlay = document.querySelector('#loading-overlay')
const zedLogo = document.querySelector('#logo')
const footer = document.querySelector('#footer')
const vhsLogo = document.querySelector('#vhsFooter')

let percentComplete = 1
let frameID = null

const updateAmount = 1.5 // in percent of bar width, should divide 100 evenly

const animateBar = (target) => {
	percentComplete += updateAmount

	// if the bar fills up, just reset it.
	// I'm changing the color only once, you
	// could get fancy here and set up the colour to get "redder" every time
	if (percentComplete < target) {
		// progressBar.style.backgroundColor = "blue";
		progressBar.style.width = percentComplete + '%'
	}

	frameID = requestAnimationFrame(animateBar)
}

// function addRandomPlaceHoldItImage() {
// 	var r = Math.round(Math.random() * 4000);
// 	new THREE.ImageLoader(manager).load("http://placehold.it/" + r + "x" + r);
// }

// for (var i = 0; i < 10; i++) addRandomPlaceHoldItImage();

manager.onStart = function (url, itemsLoaded, itemsTotal) {
	if (frameID !== null) return

	animateBar(80 % ((itemsLoaded / itemsTotal) * 80))
}

manager.onLoad = function () {
	animateBar(100)
	setTimeout(() => {
		cancelAnimationFrame(frameID)
		zedLogo.style.visibility = 'visible'
		footer.style.visibility = 'visible'
		vhsLogo.style.visibility = 'visible'
		loadingOverlay.style.opacity = '0'
	}, 1000);
	setTimeout(() => {
		loadingOverlay.style.display = 'none'
	}, 2000);
}

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
	progressBar.style.width = 80 % ((itemsLoaded / itemsTotal) * 80) + '%'
}

manager.onError = function (url) {
	console.log('There was an error loading ' + url)
	progressBar.style.backgroundColor = 'red'
}

var MODELS = [
	{ name: 'newhorse1' }, //1
	{ name: 'newhorse2' },
	{ name: 'newhorse3' },
	{ name: 'newhorse4' },
	{ name: 'newhorse5' },
	{ name: 'newhorse6' },
	{ name: 'newhorse7' },
	{ name: 'newhorse8' },
	{ name: 'newhorse9' },
	{ name: 'newhorse10' }, //10
]
var UNITS = [
	{
		modelName: 'newhorse1', // Will use the 3D model from file models/gltf/Soldier.glb
		meshName: 'Horse_E_SkiningHorse', // Name of the main mesh to animate
		position: { x: 0.8, y: 0, z: 0.5 }, // Where to put the unit in the scene
		scale: 0.4, // Scaling of the unit. 1.0 means: use original size, 0.1 means "10 times smaller", etc.
		animationName: 'gallop1', // Name of animation to run
		textureName: '1',
	},
	{
		modelName: 'newhorse2',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: 1.6, y: 0, z: 0.6 },
		scale: 0.4,
		animationName: 'gallop2',
		textureName: '2',
	},
	{
		modelName: 'newhorse3',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: -0.8, y: 0, z: 0.4 },
		scale: 0.4,
		animationName: 'gallop3',
		textureName: '3',
	},
	{
		modelName: 'newhorse4',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: -1.6, y: 0, z: 0.7 },
		scale: 0.4,
		animationName: 'gallop1',
		textureName: '4',
	},
	{
		modelName: 'newhorse5',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: 2, y: 0, z: 2 },
		scale: 0.4,
		animationName: 'gallop2',
		textureName: '5',
	},
	{
		modelName: 'newhorse6',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: 0.4, y: 0, z: 1.9 },
		scale: 0.4,
		animationName: 'gallop3',
		textureName: '6',
	},
	{
		modelName: 'newhorse7',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: -0.4, y: 0, z: 2.1 },
		scale: 0.4,
		animationName: 'gallop1',
		textureName: '7',
	},
	{
		modelName: 'newhorse8',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: -1.2, y: 0, z: 2.3 },
		scale: 0.4,
		animationName: 'gallop2',
		textureName: '8',
	},
	{
		modelName: 'newhorse9',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: 1.2, y: 0, z: 2.2 },
		scale: 0.4,
		animationName: 'gallop3',
		textureName: '9',
	},
	{
		modelName: 'newhorse10',
		meshName: 'Horse_E_SkiningHorse',
		position: { x: 0, y: 0, z: 0.6 },
		scale: 0.4,
		animationName: 'gallop2',
		textureName: '10',
	},
]
const updateVelocity = (velocity, acceleration, mass) => {
	acceleration.multiplyScalar(1 / mass)
	velocity.add(acceleration)
}

function AuraStart(alpha, outlineTex, noiseTex) {
	aura.material.uniforms.alpha.value = 0.5
	aura.material.uniforms.outlineTex.value = outlineTex
	aura.material.uniforms.noiseTex.value = noiseTex
}
function AuraUpdate(time) {
	//aura.rotation.copy(camera.rotation);
	aura.material.uniforms.time.value += time
}
function InitShaders() {
	uniforms = {
		time: { value: 1.0 },
		u_resolution: { value: new THREE.Vector2() },
		u_mouse: { value: new THREE.Vector2() },
		u_helmet_texture: { value: null },
	}
	//addWorld();

	uniforms1 = {
		time: { type: 'f', value: 1.0 },
		resolution: { type: 'v2', value: new THREE.Vector2() },
		u_helmet_texture: { value: null },
	}
	uniforms2 = {
		time: { type: 'f', value: 1.0 },
		resolution: { type: 'v2', value: new THREE.Vector2() },
		u_helmet_texture: { value: null },
	}
	shadMat = new THREE.ShaderMaterial({
		uniforms: uniforms1,
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader').textContent,
		// wireframe: true,
		skinning: true,
	})
	shadMat1 = new THREE.ShaderMaterial({
		uniforms: uniforms2,
		vertexShader: document.getElementById('vertexShader').textContent,
		fragmentShader: document.getElementById('fragmentShader111').textContent,
		skinning: true,
	})
	uniformsHorse = [
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
		{
			time: { type: 'f', value: 1.0 },
			resolution: { type: 'v2', value: new THREE.Vector2() },
			u_helmet_texture: { value: null },
		},
	]
	shaderHorse = [
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[0],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader1').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[1],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader2').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[2],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader3').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[3],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader4').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[4],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader5').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[5],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader6').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[6],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader6').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[7],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader6').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[8],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader6').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[9],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader6').textContent,
			skinning: true,
		}),
		new THREE.ShaderMaterial({
			uniforms: uniformsHorse[10],
			vertexShader: document.getElementById('vertexShader').textContent,
			fragmentShader: document.getElementById('fragmentShader').textContent,
			skinning: true,
		}),
	]
}
var numLoadedModels = 0
function loadModels() {
	for (var i = 0; i < MODELS.length; ++i) {
		var m = MODELS[i]

		loadGltfModel(m, function () {
			++numLoadedModels

			if (numLoadedModels === MODELS.length) {
				console.log('All models loaded, time to instantiate units...')
				instantiateUnits()
			}
		})
	}
}
function instantiateUnits() {
	var numSuccess = 0
	var textureLoader = new THREE.TextureLoader(manager)
	for (var i = 0; i < UNITS.length; ++i) {
		var u = UNITS[i]
		var model = getModelByName(u.modelName)

		if (model) {
			model.textureName = UNITS[i].textureName
			var clonedScene = SkeletonUtils.clone(model.scene)
			horses[i] = clonedScene
			horses[i].speed = 0
			if (clonedScene) {
				// THREE.Scene is cloned properly, let's find one mesh and launch animation for it
				var clonedMesh = clonedScene.getObjectByName(u.meshName)

				if (clonedMesh) {
					var mixer = startAnimation(
						clonedMesh,
						model.animations,
						u.animationName
					)

					// Save the animation mixer in the list, will need it in the animation loop
					mixers.push(mixer)
					numSuccess++
				}

				// Different models can have different configurations of armatures and meshes. Therefore,
				// We can't set position, scale or rotation to individual mesh objects. Instead we set
				// it to the whole cloned scene and then add the whole scene to the game world
				// Note: this may have weird effects if you have lights or other items in the GLTF file's scene!

				model.texture = textureLoader.load(
					'./public/models/newhorse/' + model.textureName + '.jpg'
				)
				clonedScene.traverse(function (child) {
					if (child.isMesh) {
						child.castShadow = true
						child.material.map = model.texture
					}
				})
				uniformsHorse[i].u_helmet_texture.value = model.texture
				clonedMesh.material = shaderHorse[i]
				scene.add(clonedScene)

				if (u.position) {
					clonedScene.position.set(u.position.x, u.position.y, u.position.z)
				}

				if (u.scale) {
					clonedScene.scale.set(u.scale, u.scale, u.scale)
				}

				if (u.rotation) {
					clonedScene.rotation.x = u.rotation.x
					clonedScene.rotation.y = u.rotation.y
					clonedScene.rotation.z = u.rotation.z
				}
			}
		} else {
			console.error('Can not find model', u.modelName)
		}
	}

	console.log(`Successfully instantiated ${numSuccess} units`)
}
function startAnimation(skinnedMesh, animations, animationName) {
	var mixer = new THREE.AnimationMixer(skinnedMesh)
	var clip = THREE.AnimationClip.findByName(animations, animationName)

	if (clip) {
		var action = mixer.clipAction(clip)
		action.play()
	}

	return mixer
}
function getModelByName(name) {
	for (var i = 0; i < MODELS.length; ++i) {
		if (MODELS[i].name === name) {
			return MODELS[i];
		}
	}

	return null
}
function loadGltfModel(model, onLoaded) {
	var loader = new GLTFLoader(manager)
	var modelName = '/public/models/newhorse/newhorse.gltf'

	if (horseModel == null) {
		loader.load(modelName, function (gltf) {
			horseModel = gltf.scene

			model.animations = gltf.animations
			horseAnimations = model.animations
			model.scene = horseModel

			// Enable Shadows

			model.scene.traverse(function (child) {
				if (child.isMesh) {
					child.castShadow = true
				}
			})

			console.log('Done loading model', model.name)

			onLoaded()
		})
	} else {
		model.scene = horseModel
		model.animations = horseAnimations
		// Enable Shadows

		model.scene.traverse(function (child) {
			if (child.isMesh) {
				child.castShadow = true
			}
		})

		console.log('Done created unit', model1.name)

		onLoaded()
	}
}
InitShaders()
init()
var TapCounter = 0
function ChangeAnimation() {
	TapCounter++
	if (idleWeight === 1 && TapCounter === 1) {
		prepareCrossFade(idleAction, walkAction, 0.2)
	} else if (walkWeight === 1 && TapCounter === 2) {
		prepareCrossFade(walkAction, runAction, 0.2)
		setTimeout(() => {
			prepareCrossFade(runAction, walkAction, 0.1)
		}, 700)
	} else if (walkWeight === 1 && TapCounter >= 3) {
		TapCounter = 0
		prepareCrossFade(walkAction, idleAction, 0.2)
	}

	if (TapCounter >= 3) TapCounter = 0
}
function moveParticles(time) {
	particles.forEach((particle) => {
		particle.position.z += particle.speed * time
		if (particle.position.z > particle.maxZ) {
			particle.position.z = particle.minZ
		}
	})
}
function createParicles() {
	var particleMaterial = new THREE.MeshBasicMaterial({
		color: 0xffaaf1,
		opacity: 0.5,
	})

	var particle1 = new THREE.Mesh(
		new THREE.BoxGeometry(0.03, 0.02, 1),
		particleMaterial
	)
	particle1.moving = false
	particle1.speed = RandonInt(6, 30)
	particle1.maxZ = RandonInt(20, 30)
	particle1.minZ = RandonInt(-30, -20)
	particleMaterial.color.setHex(Math.random() * 0x101010)
	particleMaterial.opacity = 0.5
	particle1.receiveShadow = true
	scene.add(particle1)
	var sr = RandonInt(3, 6)
	var r = RandonInt(0, 360)
	var x = sr * Math.cos(r)
	var y = Math.abs(sr * Math.sin(r)) - 1
	var z = particle1.minZ
	particle1.position.set(x, y, z)

	// console.log(particle1);
	particles.push(particle1)
}
function createPariclesYellow() {
	var particleMaterial = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		opacity: 0.5,
	})

	var particle1 = new THREE.Mesh(
		new THREE.BoxGeometry(0.03, 0.02, 1),
		particleMaterial
	)
	particle1.moving = false
	particle1.speed = RandonInt(6, 30)
	particle1.maxZ = RandonInt(20, 30)
	particle1.minZ = RandonInt(-30, -20)
	// particleMaterial.color.setHex(Math.random() * 0x101010)
	particleMaterial.opacity = 0.5
	particle1.receiveShadow = true
	scene.add(particle1)
	var sr = RandonInt(3, 6)
	var r = RandonInt(0, 360)
	var x = sr * Math.cos(r)
	var y = Math.abs(sr * Math.sin(r)) - 1
	var z = particle1.minZ
	particle1.position.set(x, y, z)

	// console.log(particle1);
	particles.push(particle1)
}

function createRenderPass() {
	var renderScene = new RenderPass(scene, camera)

	var bloomPass = new UnrealBloomPass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		1.5,
		0.4,
		0.85
	)

	bloomPass.threshold = params.bloomThreshold
	bloomPass.strength = params.bloomStrength
	bloomPass.radius = params.bloomRadius

	composer = new EffectComposer(renderer)
	composer.addPass(renderScene)
	composer.addPass(bloomPass)
	var gui = new GUI()

	gui.add(params, 'exposure', 0.1, 2).onChange(function (value) {
		renderer.toneMappingExposure = Math.pow(value, 4.0)
	})

	gui.add(params, 'bloomThreshold', 0.0, 1.0).onChange(function (value) {
		bloomPass.threshold = Number(value)
	})

	gui.add(params, 'bloomStrength', 0.0, 3.0).onChange(function (value) {
		bloomPass.strength = Number(value)
	})

	gui
		.add(params, 'bloomRadius', 0.0, 1.0)
		.step(0.01)
		.onChange(function (value) {
			bloomPass.radius = Number(value)
		})

	gui.add(params, 'volume', 0.0, 1.0).onChange(function (value) {
		soundVolue = value
		sound.setVolume(soundVolue)
		if (sound != null) sound.play()
	})
	gui.add(params, 'texture', 1, 5)
		.step(1)
		.onChange(function (value) {
			changeTexture(value);
		})
}

function combineBuffer(model, bufferName) {
	let count = 0

	model.traverse(function (child) {
		if (child.isMesh) {
			var buffer = child.geometry.attributes[bufferName]

			count += buffer.array.length
		}
	})

	var combined = new Float32Array(count)

	let offset = 0

	model.traverse(function (child) {
		if (child.isMesh) {
			var buffer = child.geometry.attributes[bufferName]

			combined.set(buffer.array, offset)
			offset += buffer.array.length
		}
	})

	return new THREE.BufferAttribute(combined, 3)
}
function createMesh(positions, scene, scale, x, y, z, color) {
	var geometry = new THREE.BufferGeometry()
	geometry.setAttribute('position', positions.clone())
	geometry.setAttribute('initialPosition', positions.clone())

	geometry.attributes.position.setUsage(THREE.DynamicDrawUsage)

	var clones = [
		// [6000, 0, -4000],
		// [5000, 0, 0],
		// [1000, 0, 5000],
		// [1000, 0, -5000],
		// [4000, 0, 2000],
		// [-4000, 0, 1000],
		// [-5000, 0, -5000],

		[0, 0, 0],
	]

	for (var i = 0; i < clones.length; i++) {
		var c = i < clones.length - 1 ? 0x252525 : color

		var mesh = new THREE.Points(
			geometry,
			new THREE.PointsMaterial({ size: 0.02, color: c })
		)
		mesh.scale.x = mesh.scale.y = mesh.scale.z = scale

		mesh.position.x = x + clones[i][0]
		mesh.position.y = y + clones[i][1]
		mesh.position.z = z + clones[i][2]

		scene.add(mesh)
		return mesh

		//clonemeshes.push({ mesh: mesh, speed: 0.5 + Math.random() });
	}

	// meshes.push({
	// 	mesh: mesh,
	// 	verticesDown: 0,
	// 	verticesUp: 0,
	// 	direction: 0,
	// 	speed: 15,
	// 	delay: Math.floor(200 + 200 * Math.random()),
	// 	start: Math.floor(100 + 200 * Math.random()),
	// });
}

function updateHorseShadowPos(time) {
	var tt = performance.now()
	horseShadows.forEach((hs) => {
		hs.position.z += time * 3
		updatePositionsHorseShadow(hs)
		// hs.material.uniforms.time.value = tt * 0.005;
		if (hs.position.z > 4) {
			hs.position.z = 0
		}
	})
}

function createHorseShadows(mesh, z) {
	// var mesh1 = mesh.clone();
	// var vertexCount = 20 * 3;

	// var geometry = new THREE.BufferGeometry();

	// var positions = [];
	// var colors = [];

	// for (var i = 0; i < vertexCount; i++) {
	// 	// adding x,y,z
	// 	positions.push(Math.random() - 0.5);
	// 	positions.push(Math.random() - 0.5);
	// 	positions.push(Math.random() - 0.5);

	// 	// adding r,g,b,a
	// 	colors.push(Math.random() * 255);
	// 	colors.push(Math.random() * 255);
	// 	colors.push(Math.random() * 255);
	// 	colors.push(Math.random() * 255);
	// }

	// var positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
	// var colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);

	// colorAttribute.normalized = true; // this will map the buffer values to 0.0f - +1.0f in the shader

	// geometry.setAttribute("position", positionAttribute);
	// geometry.setAttribute("color", colorAttribute);
	// mesh1.setAttribute("position", positionAttribute);
	// mesh1.setAttribute("color", colorAttribute);
	// // material

	// var material = new THREE.RawShaderMaterial({
	// 	uniforms: {
	// 		time: { value: 1.0 },
	// 	},
	// 	vertexShader: document.getElementById("vertexShaderRR").textContent,
	// 	fragmentShader: document.getElementById("fragmentShaderRR").textContent,
	// 	side: THREE.DoubleSide,
	// 	transparent: true,
	// });
	// // var mesh = new THREE.Mesh( geometry, material );

	// var hs = new THREE.Mesh(mesh, shadMat1);
	// var hs = new THREE.Mesh(
	// 	mesh,
	// 	// shadMat
	// 	new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
	// );

	// var hs = new THREE.Mesh(mesh, material);
	// var hs = new THREE.Mesh(geometry, material);
	var hs = createMesh(horseModelpositions, scene, 0.65, 0, 0, 0, 0xff7744)

	hs.speed = 0.005 + Math.random()
	hs.verticesDown = 0
	hs.verticesUp = 0
	hs.direction = 0
	hs.speed = 0.015
	hs.delay = Math.floor(0 + 0.2 * Math.random())
	hs.start = Math.floor(0 + 0.2 * Math.random())

	horseShadows.push(hs)

	// hs.scale.set(0.7, 0.7, 0.7);
	// hs.position.set(0, 0, 0);
	// scene.add(hs);
}

function updatePositionsHorseShadow(data, time) {
	var delta = 0.02
	var positions = data.geometry.attributes.position
	var initialPositions = data.geometry.attributes.initialPosition

	var count = positions.count

	var resetPos = false
	if (data.position.z > 4) {
		resetPos = true
		// console.log("resetpos");
	}
	for (var i = 0; i < count; i++) {
		if (resetPos) {
			var ix = initialPositions.getX(i)
			var iy = initialPositions.getY(i)
			var iz = initialPositions.getZ(i)
			positions.setXYZ(i, ix, iy, iz)
		} else {
			var px = positions.getX(i)
			var py = positions.getY(i)
			var pz = positions.getZ(i)

			positions.setXYZ(
				i,
				px,
				py,
				pz + Math.abs(pz + 3) * RandomFloat(0.01, 0.03)
			)
		}
		// rising up
	}

	positions.needsUpdate = true
}

function createLensFlare() {
	// lensflares
	var textureLoader = new THREE.TextureLoader(manager)

	var textureFlare0 = textureLoader.load(
		'./public/textures/lensflare/lensflare0_alpha1.png'
	)
	var textureFlare1 = textureLoader.load(
		'./public/textures/lensflare/sun9.png'
	)
	var textureFlare2 = textureLoader.load(
		'./public/textures/lensflare/sun3.png'
	)
	var textureFlare3 = textureLoader.load(
		'./public/textures/lensflare/lensflare3.png'
	)

	addLight1(0.095, 0.5, 0.9, 0, 0.5, 20)

	addLight(0.08, 0.8, 0.5, -5, 1, 10)

	function addLight1(h, s, l, x, y, z) {
		var movingLight1 = new THREE.PointLight(0xffffff, 0.1, 20)
		movingLight1.color.setHSL(h, s, l)
		movingLight1.position.set(x, y, z)
		scene.add(movingLight1)

		var lensflare = new Lensflare()
		lensflare.addElement(
			new LensflareElement(textureFlare2, 770, 0, movingLight1.color)
		)
		lensflare.addElement(
			new LensflareElement(textureFlare1, 200, 0, movingLight1.color)
		)
		lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6))
		lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7))
		lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9))
		lensflare.addElement(new LensflareElement(textureFlare3, 70, 1))
		movingLight1.add(lensflare)
	}
	function addLight(h, s, l, x, y, z) {
		movingLight = new THREE.PointLight(0xffffff, 1.5, 2000)
		movingLight.color.setHSL(h, s, l)
		movingLight.position.set(x, y, z)
		scene.add(movingLight)

		var lensflare = new Lensflare()
		lensflare.addElement(
			new LensflareElement(textureFlare0, 70, 0, movingLight.color)
		)
		lensflare.addElement(new LensflareElement(textureFlare3, 60, 0.6))
		lensflare.addElement(new LensflareElement(textureFlare3, 70, 0.7))
		lensflare.addElement(new LensflareElement(textureFlare3, 120, 0.9))
		lensflare.addElement(new LensflareElement(textureFlare3, 70, 1))
		movingLight.add(lensflare)
	}
}
function init() {
	var container = document.getElementById('container')

	camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		1,
		1000
	)

	camera.position.set(3.4, 2.8, -2)
	camera.lookAt(lookAtPos)
	// window.onload = function () {
	var listener = new THREE.AudioListener()
	camera.add(listener)
	//lights

	// create a global audio source
	sound = new THREE.Audio(listener)

	// load a sound and set it as the Audio object's buffer
	var audioLoader = new THREE.AudioLoader(manager)
	audioLoader.load('./public/sounds/IntrostandbyLoop.mp3', function (buffer) {
		sound.setBuffer(buffer)
		sound.setLoop(true)
		sound.setVolume(1.0)
	})

	clock = new THREE.Clock()

	scene = new THREE.Scene()
	scene.background = new THREE.Color(0xa0a0a0)
	scene.fog = new THREE.Fog(0x000000, 10, 70)

	var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
	hemiLight.position.set(0, 10, 0)
	scene.add(hemiLight)

	var dirLight = new THREE.DirectionalLight(0xffffff)
	dirLight.position.set(-3, 1, 10)
	dirLight.castShadow = true
	dirLight.shadow.camera.top = 1
	dirLight.shadow.camera.bottom = -1
	dirLight.shadow.camera.left = -1
	dirLight.shadow.camera.right = 1
	dirLight.shadow.camera.near = 0.1
	dirLight.shadow.camera.far = 40
	// dirLight.color.setHSL(0.1, 0.7, 0.5);
	scene.add(dirLight)

	// scene.add( new CameraHelper( light.shadow.camera ) );

	// ground
	var textureLoader1 = new THREE.TextureLoader(manager)
	var groundTexture = textureLoader1.load(
		'./public/models/newhorse/textures/neon2.jpg'
	)


	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping
	groundTexture.anisotropy = 16
	groundTexture.repeat.set(30, 5)

	var material = new THREE.MeshPhongMaterial({
		map: groundTexture,
		transparent: true,
		// side: THREE.DoubleSide,
		opacity: 0.6,
	})
	ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(100, 5), material)
	ground.rotation.x = -Math.PI / 2
	ground.rotation.z = Math.PI / 2
	ground.receiveShadow = true
	scene.add(ground)

	// Add Reflection to route
	var geometry = new THREE.PlaneBufferGeometry(5, 20);
	horseMirror = new Reflector(geometry, {
		clipBias: 0.003,
		textureWidth: WIDTH * window.devicePixelRatio,
		textureHeight: HEIGHT * window.devicePixelRatio,
		color: 0x777777
	})
	horseMirror.rotateX(- Math.PI / 2);
	horseMirror.position.y = -0.001
	scene.add(horseMirror);

	var geometry1 = new THREE.CubeGeometry(50, 50, 50)
	var cubeMaterials = [
		new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader(manager).load(
				'./public/img/nightsky_ft.png'
			),
			side: THREE.DoubleSide,
		}), //front side
		new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader(manager).load(
				'./public/img/nightsky_bk.png'
			),
			side: THREE.DoubleSide,
		}), //back side
		new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader(manager).load(
				'./public/img/nightsky_up.png'
			),
			side: THREE.DoubleSide,
		}), //up side
		new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader(manager).load(
				'./public/img/nightsky_dn.png'
			),
			side: THREE.DoubleSide,
		}), //down side
		new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader(manager).load(
				'./public/img/nightsky_rt.png'
			),
			side: THREE.DoubleSide,
		}), //right side
		new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader(manager).load(
				'./public/img/nightsky_lf.png'
			),
			side: THREE.DoubleSide,
		}), //left side
	]

	var cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials)
	var cube = new THREE.Mesh(geometry1, cubeMaterial)
	scene.add(cube)

	// dds

	var loader = new THREE.TextureLoader(manager)

	var map4 = loader.load('./public/textures/compressed/azuri-t64ev.png')
	// map4.anisotropy = 4

	var material4 = new THREE.MeshBasicMaterial({
		map: map4,
		side: THREE.DoubleSide,
		blending: THREE.AdditiveBlending,
		depthTest: false,
		transparent: true,
		opacity: 0.7,
	})

	var loader = new GLTFLoader(manager)
	loader.load('./public/models/newhorse1/newhorse.gltf', function (gltf) {
		model = gltf.scene

		horseModelpositions = combineBuffer(model, 'position')

		var particle1Material = new THREE.MeshBasicMaterial({
			color: 0xffaaf1,
			opacity: 0.1,
		})

		var aaaa = 0

		model.traverse(function (child) {
			var bfoot = false

			if (child.isMesh && child.name == 'Horse_E_SkiningHorse') {
				uniforms1.u_helmet_texture.value = child.material.map
				// console.log(child.material.map);
				// materialShader = new THREE.ShaderMaterial({
				// 	uniforms: uniforms,
				// 	vertexShader: document.getElementById("vertexShader")
				// 		.textContent,
				// 	fragmentShader: document.getElementById("fragment_shader1")
				// 		.textContent,
				// });
				// console.log(materialShader);
				// materialShader.skinning = true;

				//for (var kk = 1; kk <= 4; kk++) {
				createHorseShadows(child.geometry, 1)
				// }
				horseMesh = child.geometry
				child.material = shadMat
			} else if (child.name == 'Horse_E_SkiningHorsi__L_Toe') {
				bfoot = true
			} else if (child.name == 'Horse_E_SkiningHorsi__R_Toe') {
				bfoot = true
			} else if (child.name == 'Horse_E_SkiningHorsi__L_Finger') {
				bfoot = true
			} else if (child.name == 'Horse_E_SkiningHorsi__R_Finger') {
				bfoot = true
			} else if (child.name == 'Horse_E_SkiningEyes') {
				console.log(child.skeleton.bones[0])

				// Add Bloomming Eyes
				eyeLeft = child.skeleton.bones[0];
				eyeRight = child.skeleton.bones[1];
				var sphere = new THREE.SphereBufferGeometry(0.016, 16, 8)
				sphereLeft = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x3fffff }))
				sphereRight = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x3fffff }))
				scene.add(sphereLeft)
				scene.add(sphereRight)
				child.material = shadMat;
				child.visible = false
			}


			if (bfoot) {
				footsBone.push(child)

				var footParticle = new THREE.Mesh(
					new THREE.PlaneBufferGeometry(0.25, 0.25),
					material4
				)
				footParticle.rotation.x = -Math.PI / 2
				footParticle.rotation.z = Math.PI / 2
				foots.push(footParticle)
				scene.add(footParticle)
				var pos11 = child.getWorldPosition(new THREE.Vector3())
				footParticle.position.set(pos11.x, pos11.y, pos11.z)

				if (aaaa % 2 == 0) {
					//footParticle.position.y = -0.09;
				} else {
					//footParticle.position.y = 0.09;
				}
				aaaa++
			}
		})

		model.scale.set(0.7, 0.7, 0.7)
		model.position.set(0, 0, 0)
		scene.add(model)
		console.log(model);
		model.traverse(function (object) {
			if (object.isMesh) object.castShadow = true
		})

		skeleton = new THREE.SkeletonHelper(model)
		skeleton.visible = false
		scene.add(skeleton)

		createbackground()
		createPanel()

		var animations = gltf.animations

		mixer = new THREE.AnimationMixer(model)
		var gallopActions = [
			mixer.clipAction(animations[1]),
			mixer.clipAction(animations[2]),
			mixer.clipAction(animations[4]),
		]
		var actionIDs = [1, 2, 4]
		idleAction = mixer.clipAction(animations[0])
		walkAction = mixer.clipAction(animations[actionIDs[0]])
		runAction = mixer.clipAction(animations[3])

		actions = [idleAction, walkAction, runAction]

		for (var i = 0; i < 320; i++) {
			createParicles()
		}
		for (var i = 0; i < 80; i++) {
			createPariclesYellow()
		}
		createRenderPass()
		activateAllActions()

		CreateLights()
		createLensFlare()
		animate()
	})
	window.scene = scene;

	renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.toneMapping = THREE.ReinhardToneMapping

	renderer.setClearColor(0xffffff, 0)

	// renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.shadowMap.enabled = true

	container.appendChild(renderer.domElement)
	uniforms1.resolution.value.x = renderer.domElement.width
	uniforms1.resolution.value.y = renderer.domElement.height

	for (var i = 0; i < uniformsHorse.length; i++) {
		uniformsHorse[i].resolution.value.x = renderer.domElement.width
		uniformsHorse[i].resolution.value.y = renderer.domElement.height
	}
	// controls

	controls = new OrbitControls(camera, renderer.domElement)

	//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

	controls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
	controls.dampingFactor = 0.05
	controls.screenSpacePanning = false
	controls.minDistance = 3
	controls.maxDistance = 10
	controls.maxPolarAngle = Math.PI / 2
	controls.enablePan = false
	window.addEventListener('touchend', onTouchEnd, false)
	document.addEventListener('click', onClick, false)
	window.addEventListener('resize', onWindowResize, false)
	window.addEventListener('mousemove', onMouseMove, false)
	window.addEventListener('mousewheel', OnMouseWheel, false)

	// ground
	var textureLoader2 = new THREE.TextureLoader(manager)
	var groundTexture2 = textureLoader2.load(
		'./public/models/newhorse/textures/neon2.jpg'
	)

	// Preload skin textures
	var textureLoader7 = new THREE.TextureLoader(manager)
	var groundTexture3 = textureLoader7.load(
		'./public/models/newhorse1/1.jpg'
	)
	var textureLoader3 = new THREE.TextureLoader(manager)
	var groundTexture3 = textureLoader3.load(
		'./public/models/newhorse1/2.jpg'
	)
	var textureLoader4 = new THREE.TextureLoader(manager)
	var groundTexture3 = textureLoader4.load(
		'./public/models/newhorse1/3.jpg'
	)
	var textureLoader5 = new THREE.TextureLoader(manager)
	var groundTexture3 = textureLoader5.load(
		'./public/models/newhorse1/4.jpg'
	)
	var textureLoader6 = new THREE.TextureLoader(manager)
	var groundTexture3 = textureLoader6.load(
		'./public/models/newhorse1/5.jpg'
	)
	console.log("TEXTURES LOADED")

}

function onTouchEnd() {
	if (idleWeight == 1 || runWeight == 1 || walkWeight == 1) {
		//(idleWeight == 1 || (runWeight == 1 && walkWeight == 1);
		//	var object = intersections[0].object;
		// if (
		// 	object.type === "LineSegments" ||
		// 	object.type === "SkinnedMesh" ||
		// 	object.type === "SkeletonHelper"
		// ) {
		ChangeAnimation()
		// }
		// object.material.emissive.set(0x000000);
	}
}

////////////////////////
///  SCREEN SHAKE
////////////////////////

function ScreenShake() {
	return {
		// When a function outside ScreenShake handle the camera, it should
		// always check that ScreenShake.enabled is false before.
		enabled: false,

		_timestampStart: undefined,

		_timestampEnd: undefined,

		_startPoint: undefined,

		_endPoint: undefined,

		// update(camera) must be called in the loop function of the renderer,
		// it will repositioned the camera according to the requested shaking.
		update: function update(camera) {
			if (this.enabled == true) {
				const now = Date.now()
				if (this._timestampEnd > now) {
					let interval =
						(Date.now() - this._timestampStart) /
						(this._timestampEnd - this._timestampStart)
					this.computePosition(camera, interval)
				} else {
					camera.position.copy(this._startPoint)
					this.enabled = false
				}
			}
		},

		// This initialize the values of the shaking.
		// vecToAdd param is the offset of the camera position at the climax of its wave.
		shake: function shake(camera, vecToAdd, milliseconds) {
			this.enabled = true
			this._timestampStart = Date.now()
			this._timestampEnd = this._timestampStart + milliseconds
			this._startPoint = new THREE.Vector3().copy(camera.position)
			this._endPoint = new THREE.Vector3().addVectors(camera.position, vecToAdd)
		},

		computePosition: function computePosition(camera, interval) {
			// This creates the wavy movement of the camera along the interval.
			// The first bloc call this.getQuadra() with a positive indice between
			// 0 and 1, then the second call it again with a negative indice between
			// 0 and -1, etc. Variable position will get the sign of the indice, and
			// get wavy.
			if (interval < 0.4) {
				var position = this.getQuadra(interval / 0.4)
			} else if (interval < 0.7) {
				var position = this.getQuadra((interval - 0.4) / 0.3) * -0.6
			} else if (interval < 0.9) {
				var position = this.getQuadra((interval - 0.7) / 0.2) * 0.3
			} else {
				var position = this.getQuadra((interval - 0.9) / 0.1) * -0.1
			}

			// Here the camera is positioned according to the wavy 'position' variable.
			camera.position.lerpVectors(this._startPoint, this._endPoint, position)
		},

		// This is a quadratic function that return 0 at first, then return 0.5 when t=0.5,
		// then return 0 when t=1 ;
		getQuadra: function getQuadra(t) {
			return 9.436896e-16 + 4 * t - 4 * (t * t)
		},
	}
}
//////////////////////
////  EVENT
//////////////////////

function shake() {
	//screenShake.shake(camera, new THREE.Vector3(0.3, -0.8, 1.5), 150);
}

function calcFootsPos() {
	var i = 0
	foots.forEach((foot) => {
		var pos = footsBone[i].getWorldPosition(new THREE.Vector3())
		if (pos.y < 0.04) {
			foot.visible = true
			if (i == 1 && (walkWeight == 1 || runWeight == 1)) {
				// screenShake.shake(
				// 	camera,
				// 	new THREE.Vector3(
				// 		RandomFloat(0.0, 0.01),
				// 		RandomFloat(0.0, 0.01),
				// 		RandomFloat(0.02, 0.05)
				// 	),
				// 	100
				// );
			}
			var pos11 = new THREE.Vector3()
			pos11.y -= 0.01
			footsBone[i].getWorldPosition(pos11)
			foot.position.set(pos11.x, pos11.y - 0.05, pos11.z)
			// console.log(Date.now());
		} else {
			foot.visible = false
		}
		i++
	})
}
function CreateLights() {
	// return;
	var sphere = new THREE.SphereBufferGeometry(0.01, 1, 1)
	light1 = new THREE.PointLight(0xff0040, 0.1, 1)
	light1.add(
		new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 }))
	)
	scene.add(light1)
	// light2 = new THREE.PointLight(0x0040ff, 0.1, 1);
	// light2.add(
	// 	new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x0040ff }))
	// );
	// scene.add(light2);
	// light3 = new THREE.PointLight(0x80ff80, 0.1, 1);
	// light3.add(
	// 	new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0x80ff80 }))
	// );
	// scene.add(light3);
	// light4 = new THREE.PointLight(0xffaa00, 0.1, 1);
	// light4.add(
	// 	new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffaa00 }))
	// );
	// scene.add(light4);
}
function OnMouseWheel(event) {
}
var prevPosX = 0
function onMouseMove(event) {
	event.preventDefault()
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
	// console.log(mouse.x);
	if (prevPosX == 0) prevPosX = mouse.x
	newLookAtPos.z += prevPosX - mouse.x
	prevPosX = mouse.x

	camera.lookAt(newLookAtPos)

	var vec = new THREE.Vector3()
	var pos = new THREE.Vector3()
	vec.set(
		(event.clientX / window.innerWidth) * 2 - 1,
		-(event.clientY / window.innerHeight) * 2 + 1,
		0.5
	)
	vec.unproject(camera)
	vec.sub(camera.position).normalize()
	const distance = -camera.position.z / vec.z
	pos.copy(camera.position).add(vec.multiplyScalar(distance))
	if (movingLight == null) return
	movingLight.position.set(pos.x, pos.y, pos.z)
	// if( sound.i)

	// console.log(camera.position);
}
function onClick(event) {
	if (horseShadows.length < 3) return
	event.preventDefault()
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
	raycaster.setFromCamera(mouse, camera)

	var intersections = raycaster.intersectObjects(scene.children, true)

	if (
		intersections.length > 0 &&
		(idleWeight == 1 || runWeight == 1 || walkWeight == 1)
	) {
		//(idleWeight == 1 || (runWeight == 1 && walkWeight == 1);
		var object = intersections[0].object
		if (
			object.type === 'LineSegments' ||
			object.type === 'SkinnedMesh' ||
			object.type === 'SkeletonHelper'
		) {
			ChangeAnimation()
		}
		// object.material.emissive.set(0x000000);
	}
	if (sound != null) sound.play()
}
function createbackground() {
	const geometry = new THREE.SphereBufferGeometry(100, 12, 12)

	// Define Material
	const material = new THREE.RawShaderMaterial({
		uniforms: {
			time: {
				type: 'f',
				value: 0,
			},
			hex: {
				type: 'f',
				value: 0,
			},
		},
		vertexShader: document.getElementById('background_vertexShader')
			.textContent,
		fragmentShader: document.getElementById('background_fragmentShader')
			.textContent,
		side: THREE.BackSide,
	})
	bg = new THREE.Mesh(geometry, material)
	// scene.add(bg);
}
function createPanel() {
	var panel = new GUI({ width: 310 })

	var folder4 = panel.addFolder('Crossfading')

	settings = {
		'show model': true,
		'show skeleton': false,
		'deactivate all': deactivateAllActions,
		'activate all': activateAllActions,
		'pause/continue': pauseContinue,
		'make single step': toSingleStepMode,
		'modify step size': 0.05,
		'from gallop to walk': function () {
			prepareCrossFade(walkAction, idleAction, 0.2)
		},
		'from walk to gallop': function () {
			prepareCrossFade(idleAction, walkAction, 0.2)
		},
		'from gallop to jump': function () {
			prepareCrossFade(walkAction, runAction, 0.2)
		},
		'from jump to gallop': function () {
			prepareCrossFade(runAction, walkAction, 0.9)
		},
		'use default duration': true,
		'set custom duration': 0.1,
		'modify idle weight': 1.0,
		'modify walk weight': 0.0,
		'modify run weight': 0.0,
		'modify time scale': 1.0,
	}

	crossFadeControls.push(folder4.add(settings, 'from gallop to walk'))
	crossFadeControls.push(folder4.add(settings, 'from walk to gallop'))
	crossFadeControls.push(folder4.add(settings, 'from gallop to jump'))
	crossFadeControls.push(folder4.add(settings, 'from jump to gallop'))
	folder4.add(settings, 'use default duration')
	folder4.add(settings, 'set custom duration', 0, 10, 0.01)

	crossFadeControls.forEach(function (control) {
		control.classList1 =
			control.domElement.parentElement.parentElement.classList
		control.classList2 = control.domElement.previousElementSibling.classList

		control.setDisabled = function () {
			control.classList1.add('no-pointer-events')
			control.classList2.add('control-disabled')
		}

		control.setEnabled = function () {
			control.classList1.remove('no-pointer-events')
			control.classList2.remove('control-disabled')
		}
	})
	panel.close()
}

function showModel(visibility) {
	model.visible = visibility
}
function showSkeleton(visibility) {
	skeleton.visible = visibility
}
function modifyTimeScale(speed) {
	mixer.timeScale = speed
}
function deactivateAllActions() {
	actions.forEach(function (action) {
		action.stop()
	})
}
function activateAllActions() {
	setWeight(idleAction, settings['modify idle weight'])
	setWeight(walkAction, settings['modify walk weight'])
	setWeight(runAction, settings['modify run weight'])

	actions.forEach(function (action) {
		action.play()
	})
}
function pauseContinue() {
	if (singleStepMode) {
		singleStepMode = false
		unPauseAllActions()
	} else {
		if (idleAction.paused) {
			unPauseAllActions()
		} else {
			pauseAllActions()
		}
	}
}
function pauseAllActions() {
	actions.forEach(function (action) {
		action.paused = true
	})
}
function unPauseAllActions() {
	actions.forEach(function (action) {
		action.paused = false
	})
}

function toSingleStepMode() {
	unPauseAllActions()

	singleStepMode = true
	sizeOfNextStep = settings['modify step size']
}
function prepareCrossFade(startAction, endAction, defaultDuration) {
	// Switch default / custom crossfade duration (according to the user's choice)

	var duration = setCrossFadeDuration(defaultDuration)

	// Make sure that we don't go on in singleStepMode, and that all actions are unpaused

	singleStepMode = false
	unPauseAllActions()

	// If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
	// else wait until the current action has finished its current loop

	if (startAction === idleAction) {
		executeCrossFade(startAction, endAction, duration)
	} else {
		synchronizeCrossFade(startAction, endAction, duration)
	}
}
function setCrossFadeDuration(defaultDuration) {
	// Switch default crossfade duration <-> custom crossfade duration

	if (settings['use default duration']) {
		return defaultDuration
	} else {
		return settings['set custom duration']
	}
}

function synchronizeCrossFade(startAction, endAction, duration) {
	mixer.addEventListener('loop', onLoopFinished)

	function onLoopFinished(event) {
		if (event.action === startAction) {
			mixer.removeEventListener('loop', onLoopFinished)

			executeCrossFade(startAction, endAction, duration)
		}
	}
}
function executeCrossFade(startAction, endAction, duration) {
	// Not only the start action, but also the end action must get a weight of 1 before fading
	// (concerning the start action this is already guaranteed in this place)

	setWeight(endAction, 1)
	endAction.time = 0

	// Crossfade with warping - you can also try without warping by setting the third parameter to false

	startAction.crossFadeTo(endAction, duration, true)
}
function setWeight(action, weight) {
	action.enabled = true
	action.setEffectiveTimeScale(1)
	action.setEffectiveWeight(weight)
}
function updateWeightSliders() {
	settings['modify idle weight'] = idleWeight
	settings['modify walk weight'] = walkWeight
	settings['modify run weight'] = runWeight
}

function updateCrossFadeControls() {
	crossFadeControls.forEach(function (control) {
		control.setDisabled()
	})

	if (idleWeight === 1 && walkWeight === 0 && runWeight === 0) {
		crossFadeControls[1].setEnabled()
	}

	if (idleWeight === 0 && walkWeight === 1 && runWeight === 0) {
		crossFadeControls[0].setEnabled()
		crossFadeControls[2].setEnabled()
	}

	if (idleWeight === 0 && walkWeight === 0 && runWeight === 1) {
		crossFadeControls[3].setEnabled()
	}
}

function onWindowResize() {
	var width = window.innerWidth
	var height = window.innerHeight

	composer.setSize(width, height)

	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	uniforms1.resolution.value.x = renderer.domElement.width
	uniforms1.resolution.value.y = renderer.domElement.height

	for (var i = 0; i < uniformsHorse.length; i++) {
		uniformsHorse[i].resolution.value.x = renderer.domElement.width
		uniformsHorse[i].resolution.value.y = renderer.domElement.height
	}
	renderer.setSize(window.innerWidth, window.innerHeight)
}
var lastCreatedHorseShadowTime = 0
function CreateHorseShadow() {
	if (horseShadows.length > 2) return
	var nowTime = Date.now()

	if (nowTime - lastCreatedHorseShadowTime > 2000) {
		lastCreatedHorseShadowTime = nowTime
		// console.log(nowTime);
		createHorseShadows(horseMesh, 1)
	}
}
function animate() {
	// Render loop
	// scene.updateMatrixWorld();
	calcFootsPos()
	if (materialShader) {
		var delta = 0.01
		var aa = materialShader.uniforms.time.value
		materialShader.uniforms.time.value += delta * 5
		materialShader.uniforms.time.value = clock.elapsedTime
	}
	// raycaster.setFromCamera(mouse, camera);

	// // calculate objects intersecting the picking ray
	// var intersects = raycaster.intersectObjects(scene.children);

	// for (var i = 0; i < intersects.length; i++) {
	// 	intersects[i].object.material.color.set(0xff0000);
	// }

	requestAnimationFrame(animate)


	idleWeight = idleAction.getEffectiveWeight()
	walkWeight = walkAction.getEffectiveWeight()
	runWeight = runAction.getEffectiveWeight()

	// Update the panel values if weights are modified from "outside" (by crossfadings)

	updateWeightSliders()

	// Enable/disable crossfade controls according to current weight values

	updateCrossFadeControls()

	// Get the time elapsed since the last frame, used for mixer update (if not in single step mode)

	var mixerUpdateDelta = clock.getDelta()

	// If in single step mode, make one step and then do nothing (until the user clicks again)

	if (singleStepMode) {
		mixerUpdateDelta = sizeOfNextStep
		sizeOfNextStep = 0
	}

	// Update the animation mixer, the stats panel, and render this frame

	for (var i = 0; i < mixers.length; ++i) {
		mixers[i].update(mixerUpdateDelta)
	}
	mixer.update(mixerUpdateDelta)
	controls.update()
	//stats.update();
	uniforms1.time.value += mixerUpdateDelta * 5
	uniforms2.time.value += mixerUpdateDelta * 4
	var aa
	for (var i = 0; i < uniformsHorse.length; i++) {
		aa = i - 5
		if (aa == 0) aa = 1
		uniformsHorse[i].time.value += mixerUpdateDelta * (3 / (i + 2))
		aa = Math.cos(uniformsHorse[i].time.value) * 0.004 * (1.0 / aa)

		if (horses[i] != null) {
			horses[i].translateZ(aa)
		}
	}
	var groundOffSet = mixerUpdateDelta / 3

	groundOffSet +=
		mixerUpdateDelta * walkWeight * 2 + mixerUpdateDelta * runWeight

	// horseShadows.forEach((horseshadow) => {
	//     horseshadow.update(groundOffSet);
	// });
	// CreateHorseShadow();
	moveParticles(groundOffSet)
	ground.material.map.offset.x += groundOffSet
	updateHorseShadowPos(groundOffSet)
	// paricles.update(groundOffSet);
	bg.material.uniforms.time.value += mixerUpdateDelta
	bg.material.uniforms.hex.value =
		Math.atan2(camera.position.y, camera.position.x) / radians(360)

	screenShake.update(camera)
	camera.lookAt(newLookAtPos)

	var time = Date.now() * 0.0005

	light1.position.x = Math.sin(time * 0.7) * 3
	light1.position.y = Math.abs(Math.cos(time * 0.5) * 1)
	light1.position.z = Math.cos(time * 0.3) * 3

	updateEyeLights()

	// light2.position.x = Math.cos(time * 0.3) * 3;
	// light2.position.y = Math.abs(Math.sin(time * 0.5) * 1);
	// light2.position.z = Math.sin(time * 0.7) * 3;

	// light3.position.x = Math.sin(time * 0.7) * 3;
	// light3.position.y = Math.abs(Math.cos(time * 0.3) * 1);
	// light3.position.z = Math.sin(time * 0.5) * 3;

	// light4.position.x = Math.sin(time * 0.3) * 3;
	// light4.position.y = Math.abs(Math.cos(time * 0.7) * 1);
	// light4.position.z = Math.sin(time * 0.5) * 3;
	CreateHorseShadow()
	composer.render()
	// renderer.render(scene, camera);
}
function RandonInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}
function RandomFloat(min, max) {
	return Math.random() * (max - min) + min
}
function randomArbitrary(min, max) {
	return Math.random() * (max - min) + min
}
function spherical(radian1, radian2, radius) {
	return [
		Math.cos(radian1) * Math.cos(radian2) * radius,
		Math.sin(radian1) * radius,
		Math.cos(radian1) * Math.sin(radian2) * radius,
	]
}
function smoothstep(e0, e1, x) {
	if (e0 >= e1) return undefined
	var t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1)
	return t * t * (3 - 2 * t)
}
function step(e, x) {
	return x >= e ? 1 : 0
}
function mix(x1, x2, a) {
	return x1 * (1 - a) + x2 * a
}

function degrees(radian) {
	return (radian / Math.PI) * 180
}
function radians(degree) {
	return (degree * Math.PI) / 180
}
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
}
//	loadModels();

//////////////////////////////////////////////////////////////////
let sun, core, shell, points, sunShine, bg1

function initSun() {
	var textureLoader = new THREE.TextureLoader(manager)
	var coreTexture = textureLoader.load("./public/img/sun/core.png'")
	var coreNormalTexture = textureLoader.load(
		"./public/img/sun/core_normal.png'"
	)
	var sunshineTexture = textureLoader.load("./public/img/sun/sunshine.png'")
}

// Switch Texture Option
function changeTexture(textureValue) {
	var textureLoader = new THREE.TextureLoader();
	textureLoader.load("./public/models/newhorse1/" + textureValue + ".jpg", function (map) {
		uniforms1.u_helmet_texture.value = map
		model.traverse(function (child) {
			if (child.isMesh) {
				child.material.map = map
				map.flipY = false;
				if (child.name == "Horse_E_SkiningHorse" || child.name == "Horse_E_SkiningEyes") {
					child.material = shadMat
				}
				child.material.needsUpdate = true
			}
		})
	});
}

// Update Bloomming Eye Position on Amimation
function updateEyeLights() {
	var eyeLeftPos = eyeLeft.getWorldPosition(new THREE.Vector3())
	sphereLeft.position.x = eyeLeftPos.x
	sphereLeft.position.y = eyeLeftPos.y
	sphereLeft.position.z = eyeLeftPos.z
	var eyeRightPos = eyeRight.getWorldPosition(new THREE.Vector3())
	sphereRight.position.x = eyeRightPos.x
	sphereRight.position.y = eyeRightPos.y
	sphereRight.position.z = eyeRightPos.z
}