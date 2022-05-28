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
	controls.on('gameover', () => {
	});

	controls.state('game');
	controls.event('devmode');
}

if (document.readyState == 'loading') {
	// loading yet, wait for the event
	document.addEventListener('DOMContentLoaded', main);
  } else {
	// DOM is ready!
	main();
  }
