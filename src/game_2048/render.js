import { vec2 } from 'gl-matrix';
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

		const style = new PIXI.TextStyle({
			fontFamily: 'Zyzol',
			fontSize: 24,
			fontWeight: 'bold',
			fill: '#fff',
			dropShadow: true,
			dropShadowColor: '#000a',
			dropShadowBlur: 2,
			dropShadowAngle: 0,
			dropShadowDistance: 0,
			wordWrap: true,
			wordWrapWidth: 440,
			lineJoin: 'round'
		});

		this._style = style;

		return this;
	}

	text(content) {
		return new PIXI.Text(content, this._style);
	}

	sprite(name) {
		const sprite = new PIXI.Sprite(this.textures[name]);

		return sprite;
	}

	preload() {
		const loader = PIXI.Loader.shared;
		const toload = [];

		for (const k in this.atlases) {
			if (this.textures[k]) {
				continue;
			}
			if (!loader.resources[k]) {
				const src = document.querySelector(`db images #${k}`).src;
				loader.add(k, src);
				toload.push(src);
			}
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
	init(controls) {
		this.controls = controls;
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
		core.stage.sortableChildren = true;

		this.core = core;

		this.sprites = [];

		let timestamp = Date.now();
		this.core.ticker.add(() => {
			const stamp = Date.now();
			const delta = stamp - timestamp;
			timestamp = stamp;

			//this.controls.draw('devlog', 'delta: ' + delta);

			let sprites = 0;
			for (const i in this.sprites) {
				const s = this.sprites[i];
				if (!s) {
					continue;
				}

				const deltax = s.goalpositionX - s.position.x;
				const deltay = s.goalpositionY - s.position.y;
				const shiftx = (deltax / 512) * 100;
				const shifty = (deltay / 512) * 100;
				s.position.x += shiftx;
				s.position.y += shifty;

				const deltalen = vec2.squaredLength([deltax, deltay]);
				const shiftlen = vec2.squaredLength([shiftx, shifty]);

				if (s.disposeIndex !== null) {
					s.alpha = Math.max(0, deltalen - 128) / 512;
				}

				s.sprite.scale.x = lerp(s.sprite.scale.x, 1 - Math.abs(shifty / 128), 0.2);
				s.sprite.scale.y = lerp(s.sprite.scale.y, 1 - Math.abs(shiftx / 128), 0.2);
				s.zIndex = -Math.round(shiftlen);

				if (deltalen < 64) {
					let sprite = s;
					let texture = s.goaltexture;
					let title = s.tile.title;

					if (s.disposeIndex !== null) {
						delete this.sprites[i];
						this.core.stage.removeChild(s);

						sprite = this.sprites[s.disposeIndex];

						if (sprite && s.texturepriority < sprite.texturepriority) {
							texture = sprite.goaltexture;
							title = sprite.tile.title;
						}
					}

					if (sprite && texture) {
						const newtexture = Assets.instance.textures[texture];
						if (sprite.sprite.texture !== newtexture) {
							sprite.sprite.texture = newtexture;
							sprite.sprite.scale.x -= 0.2;
							sprite.sprite.scale.y -= 0.2;
						}
						sprite.title.text = title;
						sprite.goaltexture = null;
						s.goaltexture = null;
					}
				}
			}
		});

		return this;
	}

	draw(data) {
		for (const i in data) {
			const tiledata = data[i];
			let tile = this.sprites[tiledata.posi];
			if (!tile) {
				tile = new PIXI.Container();
				const sprite = Assets.instance.sprite(tiledata.sprite);
				sprite.anchor.set(0.5, 0.5);
				sprite.scale.set(1.2, 1.2);
				sprite.position.set(64, 64);
				const text = Assets.instance.text(tiledata.tile.title);
				tile.addChild(sprite);
				tile.addChild(text);
				tile.title = text;
				tile.sprite = sprite;
				this.core.stage.addChild(tile);
			}

			tile.goalpositionX = tiledata.movetox * 128;
			tile.goalpositionY = tiledata.movetoy * 128;
			if (tiledata.posx === tiledata.movetox && tiledata.posy === tiledata.movetoy) {
				tile.position.x = tiledata.posx * 128;
				tile.position.y = tiledata.posy * 128;
			}
			tile.goaltexture = tiledata.sprite;
			tile.texturepriority = tiledata.tile.pow;
			tile.tile = tiledata.tile;

			tile.disposeIndex = null;
			delete this.sprites[tiledata.posi];
			if (this.sprites[tiledata.movetoi]) {
				this.sprites.push(tile);
				tile.disposeIndex = tiledata.movetoi;
			} else {
				this.sprites[tiledata.movetoi] = tile;
			}
		}
	}

	resize(width, height) {}
}

export class StepData {
	constructor(params) {
		this.sprite = params.sprite;
		this.tile = params.tile;

		this.posx = params.posx;
		this.posy = params.posy;
		this.posi = params.posi;
		this.movetox = params.movetox ?? this.posx;
		this.movetoy = params.movetoy ?? this.posy;
		this.movetoi = params.movetoi ?? this.posi;

		this.stepstamp = params.stepstamp;
	}
}

/**
 * @param {number} a initial value
 * @param {number} b target value
 * @param {number} t factor
 * @returns {number} .
 */
export function lerp(a, b, t) {
	return a + t * (b - a);
}
