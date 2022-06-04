import {useEffect} from 'react';
import {atom, useRecoilValue} from 'recoil';
import {setRecoil} from 'recoil-nexus';
import {v4 as uuid} from 'uuid';
import {Deferred, median} from './utils';

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

class WebsocketConnection {
	ws: WebSocket;

	intervalId: NodeJS.Timer | null = null;

	pings: Map<number, number> = new Map();

	id: string = uuid();

	seq = 0;

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
		this.intervalId = setInterval(() => {
			this.ping();
		}, 1000);
	}

	ping() {
		const time = Date.now();
		this.send({
			type: 'ping',
			src: this.id,
			seq: this.seq,
		});

		this.pings.set(this.seq, time);

		this.seq++;
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
			console.error('websocket message couldn\'t parsed');
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
			if (data.src !== this.id || !this.pings.has(data.seq)) {
				return;
			}

			const sendTime = this.pings.get(data.seq)!;

			const rtt = time - sendTime;
			console.log(`websocket peer RTT for ${data.dst}: ${rtt}ms`);

			if (!{}.hasOwnProperty.call(this.rtts, data.dst)) {
				this.rtts[data.dst] = [];
			}
			this.rtts[data.dst].push(rtt);

			if (this.rtts[data.dst].length >= 5) {
				this.rtts[data.dst] = this.rtts[data.dst].slice(-15);
				// eslint-disable-next-line prefer-destructuring
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
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
	}
}

// eslint-disable-next-line react/function-component-definition
export default function WebsocketConnections() {
	// eslint-disable-next-line react/hook-use-state
	const peers = useRecoilValue(peersState);

	useEffect(() => {
		const con = new WebsocketConnection();
		return () => {
			con.close();
		};
	}, []);

	return (
		<>
			<p>WebSocket Peers:</p>
			<ul>
				{Object.entries(peers).map(([peerId, rtt]) => (
					<li key={peerId}>{peerId}: {rtt}ms</li>
				))}
			</ul>
		</>
	);
}
