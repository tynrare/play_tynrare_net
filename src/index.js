import { Messages } from './messages.js';
import Game2048 from './game_2048/index.js';

function main() {
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

	controls.state('game');
	controls.event('devmode');
}

main();
