import { Messages } from './messages.js';
import Game2048 from './game_2048/index.js';

function main() {
	const sequence = document.querySelector('sequence#dust-220523');
	const messages = new Messages().init(sequence);

	messages.event('postinit');

	let game = null;
	messages.on('state game', () => {
		if (game) {
			game.dispose();
		}

		game = Game2048(messages);
	});

	messages.state('game');
}

main();
