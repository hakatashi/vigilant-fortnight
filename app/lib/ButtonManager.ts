import noop from 'lodash/noop';
import {getRecoil} from 'recoil-nexus';
import {wsState} from './WebsocketConnections';

export interface WebsocketEvent {
	message: string,
	data: string,
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
		this.sendEvent({
			message: 'bidbutton',
			data: JSON.stringify({
				buttonId: this.buttonId,
				timestamp: time,
			}),
		});
	}

	get isPushed() {
		return this.pushTime !== null;
	}

	quit() {
	}

	private sendEvent(message: WebsocketEvent) {
		const ws = getRecoil(wsState);
		ws?.send(message);
	}
}
