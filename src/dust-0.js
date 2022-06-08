export class Data {
	/**
	 * @param {HTMLElement} source .
	 */
	constructor(source) {
		this.source = source;
		for (const k in source.attributes) {
			this._interface(source.attributes[k]);
		}
	}

	get(key) {
		return this.source.attributes[key]?.value ?? null;
	}

	set(key, value) {
		if (!this.source.attributes[key]) {
			this.source.setAttribute(key, value);
		}

		this._interface(this.source.attributes[key]);

		return this[key] = value;
	}

	define(key, value) {
		return this.set(key, this.get(key) ?? value);
	}

	_interface(attribute) {
		if (typeof this[attribute.name] !== 'undefined') {
			return;
		}

		Object.defineProperty(this, attribute.name, {
			get() {
				return attribute.value;
			},
			set(value) {
				attribute.value = value;
			}
		});
	}
}
