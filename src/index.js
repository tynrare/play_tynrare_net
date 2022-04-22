import { dust0 } from './dust-0.js';
import { Messages } from './messages.js';
import initHilo from './render/index.js';

function parseArgList(str) {
	const separator = str.includes('\n') ? '\n' : ' ';
	return str.split(separator);
}
const dustdb = {};

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

		if (!this.dbpalette) {
			throw new Error(`db#palette-${palette} wasn't found`);
		}

		this.palette = parseArgList(this.dbpalette.innerHTML);

		//console.log(`Palette "${palette}" loaded`, this.palette);

		return this;
	}

	exec() {
		this.active = true;

		for (let i = 0; i < this.tiles.length; i++) {
			this.registerTileInteractive(this.tiles[i], i);
		}

		this.step();
	}

	registerTileInteractive(tile, index) {
		tile.addEventListener('click', (event) => {
			this.cache.step = index;
			tile.classList.toggle('clicked');

			const palette = dustdb.palettes[Math.floor(Math.random() * dustdb.palettes.length)];
			this.init(palette);
		});
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
	const sequence = document.querySelector('sequence#dust-0');
	const messages = new Messages().init(sequence);

	messages.event('postinit');
	messages.state('game');

	const pixels = 512;
	const tile = 64;
	const tiles = Math.pow(pixels / tile, 2);

	let content = '';
	for (let i = 0; i < tiles; i++) {
		content += '<tile></tile>';
	}

	messages.find('game').write(content);

	dust0();
	dustdb.palettes = parseArgList(document.querySelector('db#palette_list').innerHTML);
	new Dust0().init('tyndustre_220422_00').exec();

	//initHilo();
}

main();
