import type {Peer, DataConnection} from 'peerjs';
import {useEffect, useState} from 'react';
import {useHydrated} from 'remix-utils';

type Props = {
	id: string,
	peerIds: string[],
}

class ConnectionManager {
	peerIds: Set<string> = new Set();

	peer: Peer | null = null;

	connections: DataConnection[] = [];

	async setId(id: string) {
		if (id && id !== '') {
			if (this.peer) {
				this.peer.disconnect();
			}
			// eslint-disable-next-line no-shadow
			const {Peer} = await import('peerjs');
			this.peer = new Peer(id);
			this.connections = Array.from(this.peerIds).map((peerId) => (
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				this.peer!.connect(peerId)
			));
			console.log(`Connecting Peers as ID: ${id}`);
		}
	}

	setPeerIds(ids: string[]) {
		for (const id of ids) {
			if (!this.peerIds.has(id)) {
				this.peerIds.add(id);
				if (this.peer) {
					this.connections.push(this.peer.connect(id));
					console.log(`Connected to peer: ${id}`);
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
