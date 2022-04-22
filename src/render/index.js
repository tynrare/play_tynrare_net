import {
	PerspectiveCamera,
	Stage,
	Color,
	DirectionalLight,
	Vector3,
	AmbientLight,
	Ticker,
	BoxGeometry,
	Mesh,
	BasicMaterial
} from 'hilo3d';

import OrbitControls from './OrbitControls.js';

export default function main() {
	let camera, stage, renderer, gl, directionLight, ambientLight, ticker, stats, orbitControls;
	const frontdoor = document.querySelector('#frontdoor');

	camera = new PerspectiveCamera({
		aspect: frontdoor.clientWidth / frontdoor.clientHeight,
		far: 100,
		near: 0.1,
		z: 3
	});

	stage = new Stage({
		container: document.getElementById('hilo_container'),
		camera: camera,
		clearColor: new Color(1, 1, 1, 0),
		alpha: true,
		width: innerWidth,
		height: innerHeight
	});

	window.onresize = function () {
		camera.aspect = frontdoor.clientWidth / frontdoor.clientHeight;
		stage.resize(frontdoor.clientWidth, frontdoor.clientHeight);
	};
	
	camera.aspect = frontdoor.clientWidth / frontdoor.clientHeight;
	stage.resize(frontdoor.clientWidth, frontdoor.clientHeight);

	renderer = stage.renderer;

	directionLight = new DirectionalLight({
		color: new Color(1, 1, 1),
		direction: new Vector3(0, -1, 0)
	}).addTo(stage);

	ambientLight = new AmbientLight({
		color: new Color(1, 0, 1),
		amount: 0.5
	}).addTo(stage);

	ticker = new Ticker(60);
	ticker.addTick(stage);

	/*
	orbitControls = new OrbitControls(stage, {
		isLockMove: true,
		isLockZ: true
	});

	ticker.addTick(Tween);
	ticker.addTick(Animation);
	stats = new Stats(ticker, stage.renderer.renderInfo);


	['init', 'initFailed'].forEach(function (eventName) {
		stage.renderer.on(eventName, function (e) {
			console.log(e.type, e);
		});
	});
	*/

	var boxGeometry = new BoxGeometry();
	boxGeometry.setAllRectUV([
		[0, 1],
		[1, 1],
		[1, 0],
		[0, 0]
	]);

	var colorBox = new Mesh({
		geometry: boxGeometry,
		material: new BasicMaterial({
			diffuse: new Color(0.8, 0, 0)
		}),
		onUpdate: function () {
			this.rotationX += 0.5;
			this.rotationY += 0.5;
		}
	});
	stage.addChild(colorBox);

	setTimeout(function () {
		ticker.start(true);
		gl = renderer.gl;
	}, 10);
}
