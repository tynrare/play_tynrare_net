import { Messages } from './messages.js';
import initHilo from './render/index.js';

export function dust0() {
	const sequence = document.querySelector('sequence#dust-0');
	const messages = new Messages().init(sequence);

	messages.event('postinit');
	messages.state('game');

	initHilo();

	const pixels = 512;
	const tile = 64;
	const tiles =  Math.pow(pixels / tile, 2);

	let content = '';
	for (let i = 0; i < tiles; i++) {
		content += '<tile></tile>';
	}

	messages.find('game').write(content);
}