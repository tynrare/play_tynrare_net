import { Messages } from './messages.js';
import initHilo from './render/index.js';
import Alea from './lib/Alea.js';

const random = new Alea(0);

function cssAnimate(element, name, duration) {
	element.classList.add(name);
	setTimeout(() => {
		element.classList.remove(name);
	}, duration);
}

class Game2048Tile {
	constructor() {
		this.pow = 1;
	}

	get title() {
		return Math.pow(2, this.pow);
	}
}

class Game2048 {
	constructor(container, gridsize = 4) {
		this.container = container;
		this.gridsize = gridsize;
	}

	init() {
		this.turn = 0;
		this.tiles = Array.apply(null, Array(Math.pow(this.gridsize, 2))).map(() => null);

		return this;
	}

	run() {
		this.addNewTile();
		this.draw();

		return this;
	}

	step(dirx = 0, diry = 0) {
		this.turn += 1;

		const hasSpace = this.tiles.includes(null);

		let moved = true;
		let movedAny = false;
		while (moved) {
			moved = false;
			const direction = Math.sign(dirx || 1) * Math.sign(diry || 1) * -1;
			for (
				let i = direction > 0 ? 0 : this.tiles.length - 1;
				i < this.tiles.length && i >= 0;
				i += direction
			) {
				if (this.tiles[i]) {
					moved = this.moveTile(i, dirx, diry) || moved;
				}
			}

			if (!hasSpace && !moved) {
				return;
			}

			movedAny = moved || movedAny;
		}

		if (movedAny) {
			this.addNewTile();
			this.draw();
		}
	}

	moveTile(index, dirx, diry) {
		const xpos = index % this.gridsize;
		const ypos = Math.floor(index / this.gridsize);

		let x = xpos;
		let y = ypos;
		if (dirx && x + dirx >= 0 && x + dirx < this.gridsize) {
			x += dirx;
		}

		if (diry && y + diry >= 0 && y + diry < this.gridsize) {
			y += diry;
		}

		const newindex = y * this.gridsize + x;
		if (newindex !== index) {
			let allowmove = true;
			if (this.tiles[newindex]) {
				allowmove = this.tiles[newindex].pow === this.tiles[index].pow;
				if (allowmove) {
					this.tiles[index].pow += 1;
					cssAnimate(this.container.children[newindex], 'animate-merge', 500);
				}
			}

			if (allowmove) {
				this.tiles[newindex] = this.tiles[index];
				this.tiles[index] = null;
			}

			return allowmove;
		}

		return false;
	}

	draw() {
		for (const i in this.tiles) {
			const el = this.container.children[i];

			const tile = this.tiles[i];
			if (tile) {
				el.dataset.tile = tile.title;
			} else {
				delete el.dataset.tile;
			}
		}
	}

	addNewTile() {
		let pos = Math.floor(random.next() * this.tiles.length);
		while (this.tiles[pos]) {
			pos = (pos + 1) % this.tiles.length;
		}

		const tile = new Game2048Tile();
		if (random.next() > 0.9) {
			tile.pow += 1;
		}
		this.tiles[pos] = tile;
		cssAnimate(this.container.children[pos], 'animate-appear', 500);
	}
}

function genTiles(messages) {
	const pixels = 512;
	const tile = 128;
	const tiles = Math.pow(pixels / tile, 2);

	let content = '';
	for (let i = 0; i < tiles; i++) {
		content += '<tile></tile>';
	}

	messages.find('game').write(content);
}

function main() {
	const sequence = document.querySelector('sequence#dust-0');
	const messages = new Messages().init(sequence);

	messages.event('postinit');
	messages.state('game');

	genTiles(messages);
	const game2048 = new Game2048(messages.find('game').contentNode).init().run();
	document.addEventListener('keydown', (ev) => {
		switch (ev.code) {
			case 'ArrowRight':
				game2048.step(1, 0);
				break;
			case 'ArrowLeft':
				game2048.step(-1, 0);
				break;
			case 'ArrowUp':
				game2048.step(0, -1);
				break;
			case 'ArrowDown':
				game2048.step(0, 1);
				break;
		}
	});

	{
		let startX, startY, moveX, moveY;
		document.body.addEventListener('touchstart', (ev) => {
			startX = ev.touches[0].clientX;
			startY = ev.touches[0].clientY;
		});
		document.body.addEventListener('touchmove', (ev) => {
			moveX = ev.touches[0].clientX;
			moveY = ev.touches[0].clientY;
		});
		document.body.addEventListener('touchend', (ev) => {
			const deltaX = startX - moveX;
			const deltaY = startY - moveY;
			const longestDelta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
			
			if (Math.abs(longestDelta) < 100) {
				return;
			}

			game2048.step(
				Math.abs(deltaX) === longestDelta ? -Math.sign(deltaX) : 0,
				Math.abs(deltaY) === longestDelta ? -Math.sign(deltaY) : 0
			);
		});
	}
}

main();
