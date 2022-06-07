import {atom} from 'recoil';
import {setRecoil} from 'recoil-nexus';
import {v4 as uuid} from 'uuid';
import ButtonManager from './ButtonManager';
import {median} from './utils';

export const wsState = atom<WebsocketConnection | null>({
	key: 'lib.websocketConnections.ws',
	default: null,
});

export const rttState = atom<number>({
	key: 'lib.websocketConnections.rtt',
	default: 0,
});

export const idState = atom<string>({
	key: 'lib.websocketConnections.id',
	default: '',
});

export const peerIdsState = atom<string[]>({
	key: 'lib.websocketConnections.peerIds',
	default: [],
});

export const peersState = atom<{[id: string]: number}>({
	key: 'lib.websocketConnections.peers',
	default: {},
});

export class WebsocketConnection {
	ws: WebSocket;

	#intervalId: NodeJS.Timer | null = null;

	pings: Map<number, number> = new Map();

	id: string = uuid();

	#seq = 0;

	rtts: {[id: string]: number[]} = {};

	peerIds: Set<string> = new Set();

	constructor() {
		this.ws = new WebSocket('wss://nlazlgwoch.execute-api.ap-northeast-1.amazonaws.com/dev');
		this.ws.addEventListener('open', () => {
			this.onOpen();
		});
		this.ws.addEventListener('message', (event) => {
			this.onMessage(event);
		});

		setRecoil(idState, this.id);
	}

	onOpen() {
		console.log('connected to websocket');
		this.#intervalId = setInterval(() => {
			this.ping();
		}, 1000);
	}

	ping() {
		const time = Date.now();
		this.send({
			type: 'ping',
			src: this.id,
			seq: this.#seq,
		});

		this.pings.set(this.#seq, time);

		this.#seq++;
	}

	onMessage(event: MessageEvent) {
		const time = Date.now();
		console.log(`Received websocket message: ${event.data}`);

		if (typeof event.data !== 'string') {
			return;
		}

		let data: any = null;
		try {
			data = JSON.parse(event.data);
		} catch (error) {
			console.error('websocket message couldn\'t be parsed');
			return;
		}

		if (data.src !== this.id && !this.peerIds.has(data.src)) {
			this.peerIds.add(data.src);
			setRecoil(peerIdsState, (current) => [...current, data.src]);
			setRecoil(peersState, (state) => ({
				...state,
				[data.src]: 0,
			}));
		}

		if (data.type === 'ping') {
			if (data.src !== this.id) {
				this.send({
					type: 'pong',
					src: data.src,
					dst: this.id,
					seq: data.seq,
				});
			}
		} else if (data.type === 'pong') {
			if (data.src !== this.id) {
				return;
			}

			const sendTime = this.pings.get(data.seq);

			if (sendTime === undefined) {
				return;
			}

			const rtt = time - sendTime;
			console.log(`websocket peer RTT for ${data.dst}: ${rtt}ms`);

			if (!{}.hasOwnProperty.call(this.rtts, data.dst)) {
				this.rtts[data.dst] = [];
			}
			this.rtts[data.dst].push(rtt);

			if (this.rtts[data.dst].length >= 5) {
				this.rtts[data.dst] = this.rtts[data.dst].slice(-15);
				const finalRtt = median(this.rtts[data.dst]);
				setRecoil(peersState, (state) => ({
					...state,
					[data.dst]: finalRtt,
				}));
			}
		}
	}

	send(data: any) {
		this.ws.send(JSON.stringify({
			message: 'sendmessage',
			data: JSON.stringify(data),
		}));
	}

	close() {
		this.ws.close();
		if (this.#intervalId) {
			clearInterval(this.#intervalId);
		}
	}

	getButton(buttonId: string) {
		return new ButtonManager(buttonId);
	}
}
