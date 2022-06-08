import { Messages } from './messages.js';
import Game2048 from './game_2048/index.js';
import * as Tone from 'tone';

function main() {
	const synth = new Tone.Synth().toDestination();

	const sequence = document.querySelector('sequence#dust-220523');
	const controls = new Messages().init(sequence);

	controls.event('postinit');

	let game = null;
	controls.on('state game', () => {
		if (game) {
			game.dispose();
		}

		game = Game2048(controls);
	});
	controls.on('gameover', () => {
		ysdk.adv.showFullscreenAdv();
	});

	const achievementsRaw = document.querySelector('sequence#game2048-achievements');
	const achievements = new Messages().init(achievementsRaw);

	let maxpow = 0;
	controls.on('step', () => {
		for (const i in game.tiles) {
			const tile = game.tiles[i];
			if (tile && tile.pow > maxpow) {
				maxpow = tile.pow;
				achievements.step();
				break;
			}
		}
	});

	controls.event('devmode');
	controls.state('game');
}

function sound(controls) {
	const octaves = ['3', '3', '4', '3'];
	const notes = ['C', 'D', 'F#', 'C', 'G', 'A'];

	const noise = (timescale) => {
		const time = Date.now() * timescale;
		const sin = (Math.sin(time) + 1) * 0.5;

		return sin;
	};

	let timestamp = Tone.now();
	controls.on('step', () => {
		const now = Tone.now();
		const delta = Math.min(0.3, now - timestamp);

		const octave = Math.floor(noise(0.0001) * octaves.length);
		const note = Math.floor(noise(0.1) * noise(0.05) * notes.length);

		synth.triggerAttack(notes[note] + octaves[octave], now);
		synth.triggerRelease(now + delta / 2);

		timestamp = now;
	});
}

if (document.readyState == 'loading') {
	// loading yet, wait for the event
	document.addEventListener('DOMContentLoaded', main);
} else {
	// DOM is ready!
	main();
}
