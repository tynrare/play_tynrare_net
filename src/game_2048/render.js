import * as PIXI from 'pixi.js';

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

	sprite(name) {
		const sprite = new PIXI.Sprite(this.textures[name]);

		return sprite;
	}

	preload() {
		const loader = PIXI.Loader.shared;

		for (const k in this.atlases) {
			if (this.textures[k]) {
				continue;
			}
			const src = document.querySelector(`db images #${k}`).src;
			loader.add(k, src);
		}

		return new Promise((resolve) => {
			loader.load(() => {
				for (const k in this.rects) {
					const rect = this.rects[k];
					this.textures[k] = new PIXI.Texture(
						loader.resources[rect.atlas].texture,
						new PIXI.Rectangle(rect.x, rect.y, rect.w, rect.h)
					);
				}
				resolve();
			});
		});
	}

	static get instance() {
		if (!Assets._instance) {
			Assets._instance = new Assets().init();
		}

		return Assets._instance;
	}
}
export class Render {
	init() {
		const view = document.querySelector('canvas#pixi_canvas');
		const core = new PIXI.Application({
			view,
			backgroundAlpha: 0,
			width: 512,
			height: 512,
			autoStart: true
		});
		view.width = 512;
		view.height = 512;

		this.core = core;

		this.sprites = [];

		return this;
	}

	draw(data) {
		for (const i in data) {
			const tile = data[i];
			let sprite = null;
			if (tile.movedfromi !== null) {
				sprite = this.sprites[tile.movedfromi];
			} else {
				sprite = Assets.instance.sprite(tile.sprite);
				this.core.stage.addChild(sprite);
			}

			this.sprites[i] = sprite;
			sprite.position.x = tile.posx * 128;
			sprite.position.y = tile.posy * 128;
		}
	}

	resize(width, height) {}
}

export class StepData {
	constructor(params) {
		this.posx = params.posx;
		this.posy = params.posy;
		this.posi = params.posi;
		this.movedfromx = params.movedfromx ?? null;
		this.movedfromy = params.movedfromy ?? null;
		this.movedfromi = params.movedfromi ?? null;
		this.stepstamp = params.stepstamp;
		this.sprite = params.sprite;
	}
}
