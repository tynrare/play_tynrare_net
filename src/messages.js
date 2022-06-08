import { Data } from './dust-0.js';

export class Message {
	/**
	 *
	 * @param {string} id .
	 */
	constructor(id) {
		this.id = id;

		this.contentNode = null;
		this.showonNode = null;
		this.hideonNode = null;
		this.toggleonNode = null;
		this.showwhileNode = null;

		this.simple = true;
	}
	/**
	 *
	 * @param {HTMLElement} content .
	 * @returns {Message} this
	 */
	init(entry) {
		this.entry = entry;
		this.data = new Data(entry);

		this.parse();

		return this;
	}

	parse() {
		this.simple = !this.entry.children.length;

		if (this.simple) {
			this.contentNode = this.entry;
		} else {
			this.contentNode = this.entry.querySelector(':scope > content') || this.entry;
			this.showonNode = this.entry.querySelector(':scope > showon');
			this.hideonNode = this.entry.querySelector(':scope > hideon');
			this.toggleonNode = this.entry.querySelector(':scope > toggleon');
			this.showwhileNode = this.entry.querySelector(':scope > showwhile');
		}

		this.mutable = this.contentNode.classList.contains('mutable');
	}

	show() {
		this.entry.classList.add('show');
	}

	hide() {
		this.entry.classList.remove('show');
	}

	get visible() {
		return this.entry.classList.contains('show');
	}

	set visible(value) {
		this[value ? 'show' : 'hide']();
	}

	/**
	 * @param {string} data data to write into content
	 */
	write(data) {
		if (!this.mutable) {
			throw new Error(`Message entry #${this.id} wasn't set to '.mutable'`);
		}

		this._content = data;
	}

	get showson() {
		return this.showonNode?.innerHTML;
	}

	get displayswhile() {
		return this.showwhileNode?.innerHTML;
	}

	get hideson() {
		return this.hideonNode?.innerHTML;
	}

	get content() {
		return this.simple ? this.entry.innerHTML : this.contentNode.innerHTML;
	}

	get toggleson() {
		return this.toggleonNode?.innerHTML;
	}

	/**
	 * Use write() instead
	 *
	 * @private
	 */
	set _content(value) {
		this[this.simple ? 'entry' : 'contentNode'].innerHTML = value;
	}
}

export class Messages {
	/**
	 *
	 * @param {HTMLElement} content .
	 * @returns {Messages} this
	 */
	init(content) {
		this.guids = 0;
		this.content = content;
		this.data = new Data(content);
		this.messages = {};

		this.listeners = {};

		this.parseEntries(this.content);

		return this;
	}

	/**
	 * @param {string} id .
	 * @returns {Message?}
	 */
	find(id) {
		return this.messages[id] ?? null;
	}

	step() {
		const step = Number(this.data.define('step', 0))
		this.data.step = step + 1;
		for (const k in this.messages) {
			const message = this.messages[k];
			message.visible = message.data.index == step;
		}
	}

	parseEntries(container) {
		for (let i = 0; i < container.children.length; i++) {
			const el = container.children[i];
			this.parse(el);
		}
	}

	/**
	 * @param {HTMLElement} entry .
	 */
	parse(entry) {
		// TODO: validate entry type

		const index = this.guids++;
		const id = entry.id || `i${index}`;
		const message = (this.messages[id] = new Message(id).init(entry));

		message.data.define('index', index);

		if (message.simple) {
			return;
		}

		for (let i = 0; i < message.contentNode.children.length; i++) {
			const el = message.contentNode.children[i];
			if (el.tagName.toLowerCase() === 'entry') {
				this.parse(el);
			}
		}

		const buttons = entry.querySelectorAll('button');
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			if (!button.id) {
				continue;
			}

			button.addEventListener('click', () => {
				this.event('button ' + button.id);

				if (button.classList.contains('stateswitch')) {
					this.state(button.id);
				}
			});
		}
	}

	/**
	 * @param {string} type type of triggered event
	 */
	event(type) {
		for (const k in this.messages) {
			const message = this.messages[k];

			if (message.showson === type) {
				message.show();
			}

			if (message.hideson === type) {
				message.hide();
			}

			if (message.toggleson === type) {
				message[message.visible ? 'hide' : 'show']();
			}
		}

		for (const k in this.listeners) {
			const l = this.listeners[k];
			if (l.type === type) {
				l.callback();
			}
		}
	}

	on(type, callback) {
		const id = 'ev-' + this.guids++;
		this.listeners[id] = { callback, type };

		return id;
	}

	off(type) {
		delete this.listeners[id];
	}

	/**
	 * @param {string} type type of current state
	 */
	state(type) {
		for (const k in this.messages) {
			const message = this.messages[k];
			if (message.displayswhile) {
				const action = message.displayswhile === type ? 'show' : 'hide';
				message[action]();
			}
		}

		this.event('state ' + type);
	}

	draw(where, what) {
		const place = this.find(where);
		if (!place) {
			throw new Error(`draw(${where}, ${what})  -> error. Can't find entry ${where}`);
		}
		place.write(what);
	}
}
