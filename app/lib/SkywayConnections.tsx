import {useEffect, useState} from 'react';
import {atom, useRecoilValue} from 'recoil';
import {setRecoil} from 'recoil-nexus';
import {useHydrated} from 'remix-utils';
import type {DataConnection} from 'skyway-js';
import Peer from 'skyway-js';
import {Deferred, median} from './utils';

export const peersState = atom<{[id: string]: number}>({
	key: 'lib.skywayConnections.peers',
	default: {},
});

type Props = {
	id: string,
	peerIds: string[],
}

class ConnectionManager {
	peerIds: Set<string> = new Set();

	peer: Peer | null = null;

	connections: Map<string, {connection: DataConnection, interval: NodeJS.Timer, rtts: number[]}> = new Map();

	seq = 0;

	pings: Map<string, Deferred<number>> = new Map();

	rtts: number[] = [];

	async setId(id: string) {
		if (id && id !== '') {
			if (this.peer) {
				this.peer.disconnect();
			}

			console.log(`SkyWay: Connecting Peers as ID: ${id}`);
			this.peer = new Peer(id, {key: '59d6b4ef-a362-419d-a399-ab2c843cc583'});

			this.peer.on('connection', (connection) => {
				this.onIncomingConnection(connection);
			});

			const newId: string = await new Promise((resolve) => {
				this.peer?.on('open', resolve);
			});
			console.log('SkyWay: New ID', newId);

			for (const [peerId, {connection, interval}] of this.connections) {
				if (interval) {
					clearInterval(interval);
				}
				connection.close();
				this.connections.delete(peerId);
			}

			for (const peerId of this.peerIds) {
				this.connect(peerId);
			}
		}
	}

	connect(peerId: string) {
		if (this.connections.has(peerId)) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const connection = this.peer!.connect(peerId, {serialization: 'json'});
		console.log(`SkyWay: Connecting to ${peerId}`);
		connection.on('open', () => {
			console.log(`SkyWay: Connected to ${peerId}`);

			setRecoil(peersState, (state) => ({
				...state,
				[connection.remoteId]: 0,
			}));
		});

		connection.on('data', (data) => {
			const now = Date.now();
			console.log(`SkyWay: Received data from ${peerId}: ${JSON.stringify(data)}`);

			if (typeof data === 'object') {
				if (data.type === 'ping') {
					connection.send({
						type: 'pong',
						id: data.id,
						seq: data.seq,
					});
				}
				if (data.type === 'pong') {
					const deferred = this.pings.get(`${data.seq}\0${connection.remoteId}`);
					if (deferred) {
						deferred.resolve(now);
					}
				}
			}
		});

		const interval = setInterval(() => {
			if (connection.open) {
				console.log(`SkyWay: Sending ping to ${peerId}`);
				this.ping(connection);
			}
		}, 2000);

		this.connections.set(peerId, {connection, interval, rtts: []});
	}

	onIncomingConnection(connection: DataConnection) {
		console.log(`SkyWay: Incoming connection from ${connection.remoteId}`);

		if (this.connections.has(connection.remoteId)) {
			console.log('SkyWay: Incoming connection overwriting existing connection');
			const existingConnection = this.connections.get(connection.remoteId);
			existingConnection?.connection.close();
			clearInterval(existingConnection?.interval);
		}

		setRecoil(peersState, (state) => ({
			...state,
			[connection.remoteId]: 0,
		}));

		connection.on('data', (data) => {
			const now = Date.now();
			console.log(`SkyWay: Received data from ${connection.remoteId}: ${JSON.stringify(data)}`);

			if (typeof data === 'object') {
				if (data.type === 'ping') {
					connection.send({
						type: 'pong',
						id: data.id,
						seq: data.seq,
					});
				}
				if (data.type === 'pong') {
					const deferred = this.pings.get(`${data.seq}\0${connection.remoteId}`);
					if (deferred) {
						deferred.resolve(now);
					}
				}
			}
		});

		const interval = setInterval(() => {
			console.log(`SkyWay: Sending ping to ${connection.remoteId}`);
			this.ping(connection);
		}, 2000);

		this.connections.set(connection.id, {connection, interval, rtts: []});
	}

	setPeerIds(ids: string[]) {
		for (const peerId of ids) {
			if (!this.peerIds.has(peerId)) {
				this.peerIds.add(peerId);
				if (this.peer && this.peer.open) {
					this.connect(peerId);
				}
			}
		}
	}

	async ping(connection: DataConnection) {
		const time = Date.now();
		connection.send({
			type: 'ping',
			id: this.peer!.id,
			seq: this.seq,
		});

		const deferred = new Deferred<number>();
		this.pings.set(`${this.seq}\0${connection.remoteId}`, deferred);

		this.seq++;

		const respTime = await deferred.promise;

		const rtt = respTime - time;
		console.log(`SkyWay peer RTT: ${rtt}ms`);

		const connectionData = this.connections.get(connection.remoteId)!;
		connectionData.rtts.push(rtt);

		if (connectionData.rtts.length >= 5) {
			connectionData.rtts = connectionData.rtts.slice(-15);
			// eslint-disable-next-line prefer-destructuring
			const finalRtt = median(connectionData.rtts);
			setRecoil(peersState, (state) => ({
				...state,
				[connection.remoteId]: finalRtt,
			}));
		}
	}
}

// eslint-disable-next-line react/function-component-definition
export default function SkyWayConnections({id, peerIds}: Props) {
	const isHydrated = useHydrated();
	// eslint-disable-next-line react/hook-use-state
	const [manager] = useState(() => new ConnectionManager());
	const peers = useRecoilValue(peersState);

	useEffect(() => {
		if (isHydrated) {
			manager.setPeerIds(peerIds);
		}
	}, [manager, peerIds, isHydrated]);

	useEffect(() => {
		if (isHydrated) {
			manager.setId(id);
		}
	}, [manager, id, isHydrated]);

	return (
		<>
			<p>P2P Peers:</p>
			<ul>
				{Object.entries(peers).map(([peerId, rtt]) => (
					<li key={peerId}>{peerId}: {rtt}ms</li>
				))}
			</ul>
		</>
	);
}
