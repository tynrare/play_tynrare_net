import {
	AmbientLight,
	BasicMaterial,
	BoxGeometry,
	BasicLoader,
	PlaneGeometry,
	Color,
	DirectionalLight,
	Mesh,
	PerspectiveCamera,
	Stage,
	Ticker,
	Vector3
} from 'hilo3d';

import BillboardMaterial from './BillboardMaterial.js';

//import OrbitControls from './OrbitControls.js';

export class Sprite extends Mesh {
	constructor(name, rect, material) {
		const geometry = new PlaneGeometry();
		super({
			useInstanced: true,
			geometry,
			material,
			id: name
		});
		this.rect = rect;
	}
}

class Data {
	constructor(source) {
		this.source = source;
		for (const k in source.attributes) {
			const attr = source.attributes[k];
			Object.defineProperty(this, attr.name, {
				get() {
					return attr.value;
				},
				set(value) {
					attr.value = value;
				}
			});
		}
	}
}

export class Assets {
	init() {
		this.textures = {};
		this.atlases = {};
		this.rects = {};
		this.materials = {};
		this.sprites = {};

		const atlases = document.body.querySelectorAll('db textureatlas');
		for (let i = 0; i < atlases.length; i++) {
			const atlas = new Data(atlases[i]);
			const atlasname = atlas.imagepath.split('.')[0];
			const rects = atlas.source.querySelectorAll('sprite');
			for (let ii = 0; ii < rects.length; ii++) {
				const rect = new Data(rects[ii]);

				// --- |:
				this.rects[rect.n] = rect;
				rect.atlas = atlasname;
			}
			this.atlases[atlasname] = atlas;
			// ----- |.
		}

		return this;
	}

	preload() {
		this.loader = new BasicLoader();
		const loads = [];

		for (const k in this.atlases) {
			if (this.textures[k]) {
				continue;
			}

			const l = this.loader
				.load({
					src: document.querySelector(`db images #${k}`).src,
					useInstanced: true,
				})
				.then(
					function (image) {
						return new Hilo3d.Texture({ image: image, flipY: true });
					},
					function (err) {
						return new Hilo3d.Color(1, 0, 0);
					}
				)
				.then((diffuse) => {
					this.textures[k] = diffuse;
					//this.materials[k] = new BillboardMaterial(this.textures[k]);
					this.materials[k] = new BasicMaterial({
						lightType: 'NONE',
						side: Hilo3d.constants.FRONT_AND_BACK,
						diffuse,
					});
					console.log(this.materials[k]);
				});

			loads.push(l);
		}

		return Promise.all(loads);
	}

	sprite(name) {
		if (!this.sprites[name]) {
			const rect = this.rects[name];
			this.sprites[name] = new Sprite(name, rect, this.materials[rect.atlas]);
		}

		return this.sprites[name];
	}

	static get instance() {
		if (!Assets._instance) {
			Assets._instance = new Assets().init();
		}

		return Assets._instance;
	}
}

export class StepData {
	constructor(params) {
		this.posx = params.posx;
		this.posy = params.posy;
		this.posi = params.posi;
		this.movedfromx = params.movedfromx;
		this.movedfromy = params.movedfromy;
		this.movedfromi = params.movedfromi;
		this.stepstamp = params.stepstamp;
		this.sprite = params.sprite;
	}
}

export default class Render {
	init() {
		this.drawdata = [];

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

		renderer = stage.renderer;

		directionLight = new DirectionalLight({
			color: new Color(1, 1, 1),
			direction: new Vector3(0, -1, 0)
		}).addTo(stage);

		ambientLight = new AmbientLight({ color: new Color(1, 0, 1), amount: 0.5 }).addTo(stage);

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

		setTimeout(function () {
			ticker.start(true);
			gl = renderer.gl;
		}, 10);

		this.core = {
			camera,
			stage,
			renderer,
			gl,
			directionLight,
			ambientLight,
			ticker,
			stats,
			orbitControls
		};

		return this;
	}

	resize(width, height) {
		this.core.camera.aspect = width / height;
		this.core.stage.resize(width, height);
	}
}
