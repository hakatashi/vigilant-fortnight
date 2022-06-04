import {useEffect, useState} from 'react';
import {useHydrated} from 'remix-utils';
import type {DataConnection} from 'skyway-js';
import Peer from 'skyway-js';

type Props = {
	id: string,
	peerIds: string[],
}

class ConnectionManager {
	peerIds: Set<string> = new Set();

	peer: Peer | null = null;

	connections: Map<string, {connection: DataConnection, interval: NodeJS.Timer}> = new Map();

	async setId(id: string) {
		if (id && id !== '') {
			if (this.peer) {
				this.peer.disconnect();
			}

			console.log(`PeerJS: Connecting Peers as ID: ${id}`);
			this.peer = new Peer(id, {key: '59d6b4ef-a362-419d-a399-ab2c843cc583'});

			this.peer.on('connection', (connection) => {
				this.onIncomingConnection(connection);
			});

			const newId: string = await new Promise((resolve) => {
				this.peer?.on('open', resolve);
			});
			console.log('PeerJS: New ID', newId);

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
		console.log(`PeerJS: Connecting to ${peerId}`);
		connection.on('open', () => {
			console.log(`PeerJS: Connected to ${peerId}`);
		});
		connection.on('data', (data) => {
			console.log(`PeerJS: Received data from ${peerId}: ${data}`);
		});
		const interval = setInterval(() => {
			if (connection.open) {
				console.log(`PeerJS: Sending ping to ${peerId}`);
				connection.send('ping');
			}
		}, 1000);
		this.connections.set(peerId, {connection, interval});
	}

	onIncomingConnection(connection: DataConnection) {
		console.log(`PeerJS: Incoming connection from ${connection.remoteId}`);

		if (this.connections.has(connection.remoteId)) {
			console.log('PeerJS: Incoming connection overwriting existing connection');
			const existingConnection = this.connections.get(connection.remoteId);
			existingConnection?.connection.close();
			clearInterval(existingConnection?.interval);
		}

		connection.on('data', (data) => {
			console.log(`PeerJS: Received data from ${connection.remoteId}: ${data}`);
		});

		const interval = setInterval(() => {
			if (connection.open) {
				console.log(`PeerJS: Sending ping to ${connection.remoteId}`);
				connection.send('ping');
			}
		}, 1000);

		this.connections.set(connection.id, {connection, interval});
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
}

// eslint-disable-next-line react/function-component-definition
export default function PeerJsConnections({id, peerIds}: Props) {
	const isHydrated = useHydrated();
	// eslint-disable-next-line react/hook-use-state
	const [manager] = useState(() => new ConnectionManager());

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
		<p>Peer IDs: {peerIds.join(', ')}</p>
	);
}
