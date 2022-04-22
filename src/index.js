import { dust0 } from './dust-0.js';

class Dust0 {
	constructor() {
		this.active = false;
		this.cache = {
			step: 0
		};
	}

	/**
	 * @param {string} [palette='pineapple32'] .
	 * @returns Dust0 this
	 */
	init(palette = 'pineapple32') {
		this.tiles = document.querySelectorAll('tile');
		this.dbpalette = document.querySelector('db#palette-' + palette);
		this.palette = this.dbpalette.innerHTML.split('\n');

		if (!this.dbpalette) {
			throw new Error(`db#palette-pineapple32 wasn't found`);
		}

		return this;
	}

	exec() {
		this.active = true;

		for(let i = 0; i < this.tiles.length; i++) {
			this.registerTileInteractive(this.tiles[i]);
		}

		this.step();
	}

	registerTileInteractive(tile) {
		tile.addEventListener('click', (event) => tile.classList.toggle('clicked'));
	}

	step() {
		if (!this.active) {
			return;
		}

		this.tiles[this.cache.step].style.backgroundColor = '#' + this.randomColor();

		this.cache.step = (this.cache.step + 1) % this.tiles.length;

		setTimeout(() => this.step(), 707);
	}

	randomColor() {
		return this.palette[Math.floor(this.palette.length * Math.random())];
	}
}

function main() {
	dust0();

	new Dust0().init('tyndustre_220422_00').exec();
}

main();
