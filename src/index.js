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

const palette = new Palette('pineapple32');

class Game2048Tile {
	constructor(turnstamp, pow = 1) {
		this.pow = pow;
		this.turnstamp = turnstamp;
	}

	get score() {
		return Math.pow(2, this.pow);
	}

	get title() {
		return Game2048Tile.titles[this.pow - 1] || '◌';
	}

	get color() {
		return '#' + palette.colors[this.pow];
	}
}

Game2048Tile.titles = [
	' ∙',
	' ∙ ∙',
	' ∙ ∙ ∙',
	'◉',
	'◉◉',
	'◉◉◉',
	'✦',
	'✦✦',
	'✦✦✦',
	'★',
	'★★',
	'★★★'
];

class Game2048 {
	constructor(messages, container, gridsize = 4) {
		this.container = container;
		this.messages = messages;
		this.gridsize = gridsize;
	}

	init() {
		this.turn = 0;
		this.score = 0;
		this.tiles = Array.apply(null, Array(Math.pow(this.gridsize, 2))).map(() => null);
		this.tilesBuffer = [];

		return this;
	}

	run() {
		this.addNewTile();
		this.calcScore();
		this.draw(false);

		return this;
	}

	step(dirx = 0, diry = 0) {
		this.turn += 1;

		this.tilesBuffer.length = 0;
		const moved = this.moveTiles(dirx, diry, this.tiles, this.tilesBuffer);

		for (const i in this.tilesBuffer) {
			if (this.tilesBuffer[i] === -1) {
				this.tiles[i] = null;
			} else if (this.tilesBuffer) {
				this.tiles[i] = this.tilesBuffer[i].tile;
			}
		}

		if (moved) {
			this.addNewTile();
			this.calcScore();
			this.draw();
		} else if (this.isGameOver()) {
			this.messages.state('gameover');
		}
	}

	calcScore() {
		for (const i in this.tiles) {
			const tile = this.tiles[i];
			if (tile && tile.turnstamp === this.turn) {
				this.score += tile.score;
			}
		}
	}

	isGameOver() {
		const hasSpace = this.tiles.includes(null);
		const hasMoves =
			hasSpace ||
			this.moveTiles(-1, 0, this.tiles) ||
			this.moveTiles(1, 0, this.tiles) ||
			this.moveTiles(0, -1, this.tiles) ||
			this.moveTiles(0, 1, this.tiles);

		return !hasMoves;
	}

	/**
	 * @param {Array<Game2048Tile?>} tiles array to get tiles from
	 * @param {Array<Game2048Tile?>?} buffer array to write results to
	 */
	moveTiles(dirx, diry, tiles, buffer) {
		let moved = false;
		for (let y = 0; y < this.gridsize; y++) {
			const cy = diry <= 0 ? y : this.gridsize - y - 1;
			for (let x = 0; x < this.gridsize; x++) {
				const cx = dirx <= 0 ? x : this.gridsize - x - 1;
				const goal = cy * this.gridsize + cx;

				for (let i = 1; dirx && i + x < this.gridsize; i++) {
					const posx = cx + i * -dirx;
					const target = cy * this.gridsize + posx;

					const code = this.moveTile(target, goal, tiles, buffer);
					moved = moved || code === 1 || code === 3;

					if (code >= 2) {
						break;
					}
				}

				for (let i = 1; diry && i + y < this.gridsize; i++) {
					const posy = cy + i * -diry;
					const target = posy * this.gridsize + cx;

					const code = this.moveTile(target, goal, tiles, buffer);
					moved = moved || code === 1 || code === 3;
					if (code >= 2) {
						break;
					}
				}
			}
		}

		return moved;
	}

	_getTile(index, tiles, buffer = []) {
		if (buffer[index] === -1) {
			return null;
		}

		return buffer[index]?.tile || tiles[index];
	}

	/**
	 * @param {Array<Game2048Tile?>} tiles array to get tiles from
	 * @param {Array<Game2048Tile?>?} buffer array to write results to
	 * @returns {number} operation code. 0 - no target, 1 - tile moved, 2 - space already taken,  3 - tile merged
	 */
	moveTile(from, to, tiles, buffer) {
		if (!this._getTile(from, tiles, buffer)) {
			return 0;
		}

		const movedfromy = Math.floor(from / this.gridsize);
		const movedfromx = from % this.gridsize;

		if (!this._getTile(to, tiles, buffer)) {
			if (buffer) {
				buffer[to] = {
					tile: this._getTile(from, tiles, buffer),
					fromx: movedfromx,
					fromy: movedfromy,
					fromi: from
				};
				buffer[from] = -1;
			}

			return 1;
		} else if (this._getTile(to, tiles, buffer).pow === this._getTile(from, tiles, buffer).pow) {
			if (buffer) {
				buffer[to] = {
					tile: new Game2048Tile(this.turn, this._getTile(to, tiles, buffer).pow + 1),
					fromx: movedfromx,
					fromy: movedfromy,
					fromi: from,
					merged: true
				};
				buffer[from] = -1;
			}

			return 3;
		}

		return 2;
	}

	draw(animate = true) {
		if (animate) {
			this._drawAnimations();
			const turn = this.turn;
			setTimeout(() => {
				if (this.turn === turn) {
					this._drawTiles();
				}
			}, 100);
		} else {
			this._drawTiles();
		}

		this.messages.find('gamescore').write(this.score);
		this.messages.find('leaderscore').write(this.writeLeaderScore(this.score));
	}

	_drawAnimations() {
		for (let i = 0; i < this.tilesBuffer.length; i++) {
			const movedata = this.tilesBuffer[i];
			if (!movedata || movedata === -1) {
				continue;
			}

			const y = Math.floor(i / this.gridsize);
			const x = i % this.gridsize;
			const el = this.container.children[movedata.fromi];
			const deltax = x - movedata.fromx;
			const deltay = y - movedata.fromy;
			const bouncex = 16 * Math.sign(deltax);
			const bouncey = 16 * Math.sign(deltay);
			el.style.transform = `translate(${deltax * 128 + bouncex}px, ${deltay * 128 + bouncey}px)`;
			el.classList.add('animate-transition');
		}
	}

	_drawTiles() {
		for (const i in this.tiles) {
			const el = this.container.children[i];
			el.style.transform = 'initial';
			el.classList.remove('animate-transition');

			const tile = this.tiles[i];
			if (tile) {
				el.dataset.title = tile.title;
				el.dataset.pow = tile.pow;
				el.style.setProperty('--color', tile.color);

				if (tile.turnstamp === this.turn && !this.tilesBuffer[i]?.merged) {
					cssAnimate(el, 'animate-appear', 400);
				}
				if (this.tilesBuffer[i]?.merged) {
					cssAnimate(el, 'animate-merge', 500);
				}
				if (tile.turnstamp === this.turn) {
					const vfx = document.createElement('vfx');
					vfx.innerHTML = '+' + tile.score;
					vfx.classList.add('scoreNumber');
					el.appendChild(vfx);
					setTimeout(() => {
						el.removeChild(vfx);
					}, 700);
				}
			} else {
				delete el.dataset.title;
			}
		}
	}

	addNewTile() {
		let pos = Math.floor(random.next() * this.tiles.length);
		while (this.tiles[pos]) {
			pos = (pos + 1) % this.tiles.length;
		}

		const tile = new Game2048Tile(this.turn);
		if (random.next() > 0.9) {
			tile.pow += 1;
		}
		this.tiles[pos] = tile;
	}

	writeLeaderScore(score) {
		let leaderscore = this.getLeaderScore();

		if (score > leaderscore) {
			leaderscore = score;
			localStorage.setItem('game.leaderscore', score);
		}

		return leaderscore;
	}

	getLeaderScore() {
		const leaderscore = localStorage.getItem('game.leaderscore') || 0;

		return Number(leaderscore);
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

function Palette(name) {
	const str = document.querySelector('db#palette-' + name).innerHTML;
	const separator = str.includes('\n') ? '\n' : ' ';

	this.colors = str.split(separator);
}

function main() {
	const sequence = document.querySelector('sequence#dust-220523');
	const messages = new Messages().init(sequence);

	messages.event('postinit');

	genTiles(messages);

	let game2048;
	messages.on('state game', () => {
		game2048 = new Game2048(messages, messages.find('game').contentNode).init().run();
	});

	messages.state('game');

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

			if (Math.abs(longestDelta) < 50) {
				return;
			}

			game2048.step(
				Math.abs(deltaX) === longestDelta ? -Math.sign(deltaX) : 0,
				Math.abs(deltaY) === longestDelta ? -Math.sign(deltaY) : 0
			);
		});
	}

	{
		const frontdoor = document.querySelector('#frontdoor');
		function resize() {
			const width = window.innerWidth;
			const height = window.innerHeight;
			const min = Math.min(width, height);
			frontdoor.style.transform = `scale(${Math.min(1, min / frontdoor.clientWidth)})`;
			if (width < height) {
				frontdoor.style.transformOrigin = 'left';
			} else {
				frontdoor.style.transformOrigin = 'top';
			}
		}

		resize();
		window.addEventListener('resize', resize);
	}
}

main();
