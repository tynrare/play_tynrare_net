import { Messages } from './messages.js';

function main() {
	const sequence = document.querySelector('sequence#frontdoor');
	const controls = new Messages().init(sequence);

	controls.event('postinit');

	let game = null;
	controls.on('state game', () => {
		if (game) {
			game.dispose();
		}

	});
	controls.on('gameover', () => {
	});

	controls.state('root');
	controls.event('devmode');
}

if (document.readyState == 'loading') {
	// loading yet, wait for the event
	document.addEventListener('DOMContentLoaded', main);
  } else {
	// DOM is ready!
	main();
  }
