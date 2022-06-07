import noop from 'lodash/noop';

export interface WebsocketEvent {
	type: string,
}

export default class ButtonManager {
	buttonId: string;

	pushTime: number | null = null;

	onMessageSend: (message: WebsocketEvent) => void;

	constructor(buttonId: string, onMessageSend = noop) {
		this.buttonId = buttonId;
		this.pushTime = null;
		this.onMessageSend = onMessageSend;
	}

	onMessage(event: WebsocketEvent) {
	}

	push(time = Date.now()) {
		this.pushTime = time;
	}

	get isPushed() {
		return this.pushTime !== null;
	}

	quit() {
	}
}
