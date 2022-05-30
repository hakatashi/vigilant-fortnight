import {atom} from 'recoil';
import {setRecoil} from 'recoil-nexus';
import {v4 as uuid} from 'uuid';
import {median} from './utils';

export class Deferred<T> {
	promise: Promise<T>;

	isResolved: boolean;

	isRejected: boolean;

	private nativeReject!: (...args: any[]) => any;

	private nativeResolve!: (...args: any[]) => any;

	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.nativeReject = reject;
			this.nativeResolve = resolve;
		});
		this.isResolved = false;
		this.isRejected = false;
	}

	resolve(value: T) {
		this.nativeResolve(value);
		this.isResolved = true;
		return this.promise;
	}

	reject(...args: any[]) {
		this.nativeReject(...args);
		this.isRejected = true;
		return this.promise;
	}
}

export const rttState = atom<number>({
	key: 'lib.websocketConnection.rtt',
	default: 0,
});

export const peerIdsState = atom<string[]>({
	key: 'lib.websocketConnection.peerIds',
	default: [],
});

export default class WebsocketConnection {
	ws: WebSocket;

	intervalId: NodeJS.Timer | null = null;

	pings: Map<number, Deferred<number>> = new Map();

	id: string = uuid();

	seq = 0;

	rtts: number[] = [];

	peerIds: Set<string> = new Set();

	constructor() {
		this.ws = new WebSocket('wss://nlazlgwoch.execute-api.ap-northeast-1.amazonaws.com/dev');
		this.ws.addEventListener('open', () => {
			this.onOpen();
		});
		this.ws.addEventListener('message', (event) => {
			this.onMessage(event);
		});
	}

	onOpen() {
		console.log('connected to websocket');
		this.intervalId = setInterval(() => {
			this.ping();
		}, 1000);
	}

	async ping() {
		const time = Date.now();
		this.send({
			type: 'ping',
			id: this.id,
			seq: this.seq,
		});

		const deferred = new Deferred<number>();
		this.pings.set(this.seq, deferred);

		this.seq++;

		const respTime = await deferred.promise;

		const rtt = respTime - time;
		console.log(`websocket peer RTT: ${rtt}ms`);

		this.rtts.push(rtt);

		if (this.rtts.length >= 5) {
			this.rtts = this.rtts.slice(-15);
			// eslint-disable-next-line prefer-destructuring
			const finalRtt = median(this.rtts);
			setRecoil(rttState, finalRtt);
		}
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
		} catch (e) {
			console.error('websocket message couldn\'t parsed');
			return;
		}

		if (!this.peerIds.has(data.id)) {
			setRecoil(peerIdsState, (current) => [...current, data.id]);
		}

		if (data.type === 'ping') {
			if (data.id !== this.id) {
				this.send({
					type: 'pong',
					id: this.id,
					seq: data.seq,
				});
			}
		} else if (data.type === 'pong') {
			if (data.id === this.id || !this.pings.has(data.seq)) {
				return;
			}
			const deferred = this.pings.get(data.seq);
			if (deferred?.isResolved) {
				return;
			}
			deferred?.resolve(time);
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
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
	}
}
