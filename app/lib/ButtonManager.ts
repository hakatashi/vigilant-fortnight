import noop from 'lodash/noop';

export interface WebsocketEvent {
	type: string,
}

export default class ButtonManager {
	pushTime: number | null = null;

	onMessageSend: (message: WebsocketEvent) => void;

	constructor(onMessageSend = noop) {
		this.pushTime = null;
		this.onMessageSend = onMessageSend;
	}

	onMessage(event: WebsocketEvent) {
	}

	push(time = Date.now()) {
		this.pushTime = time;
		this.push();
	}

	get isPushed() {
		return this.pushTime !== null;
	}
}
