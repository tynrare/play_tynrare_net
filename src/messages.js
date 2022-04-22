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
		this.contentNode = this.entry.querySelector('content');
		this.simple = !Boolean(this.entry.childNodes.length);

		// Root node mutable
		this.mutable = this.entry.classList.contains('mutable');
		// Content mutable
		this.mutable =
			this.mutable || (!this.simple && this.contentNode?.classList.contains('mutable'));

		if (this.simple) {
			this.contentNode = this.entry;
		} else {
			this.showonNode = this.entry.querySelector('showon');
			this.hideonNode = this.entry.querySelector('hideon');
			this.showwhileNode = this.entry.querySelector('showwhile');
		}
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
		return (this[this.simple ? 'entry' : 'contentNode'].innerHTML = value);
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

		for (let i = 0; i < this.content.childNodes.length; i++) {
			this.parse(this.content.childNodes[i]);
		}

		return this;
	}

	/**
	 * @param {string} id .
	 * @returns {Message?}
	 */
	find(id) {
		return this.messages[id] ?? null;
	}

	/**
	 * @param {HTMLElement} entry .
	 */
	parse(entry) {
		// TODO: validate entry type

		const id = entry.id || `i${this.guids++}`;
		this.messages[id] = new Message(id).init(entry);

		const buttons = entry.querySelectorAll('button');
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			if (!button.id) {
				continue;
			}

			button.addEventListener('click', () => {
				this.event('button ' + button.id);
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
	}
}
