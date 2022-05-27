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

		this.parse();

		return this;
	}

	parse() {
		this.simple = !this.entry.children.length;

		if (this.simple) {
			this.contentNode = this.entry;
		} else {
			this.contentNode = this.entry.querySelector('content') || this.entry;
			this.showonNode = this.entry.querySelector('showon');
			this.hideonNode = this.entry.querySelector('hideon');
			this.showwhileNode = this.entry.querySelector('showwhile');
		}

		this.mutable = this.contentNode.classList.contains('mutable');
	}

	show() {
		this.entry.classList.add('show');
	}

	hide() {
		this.entry.classList.remove('show');
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

		const id = entry.id || `i${this.guids++}`;
		const message = (this.messages[id] = new Message(id).init(entry));

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
		if(!place) {
			throw new Error(`draw(${where}, ${what})  -> error. Can't find entry ${where}`);
		}
		place.write(what);
	}
}
