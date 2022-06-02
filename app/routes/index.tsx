/* eslint-disable react/react-in-jsx-scope */

import {Link} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {useRecoilValue} from 'recoil';
import {ClientOnly} from 'remix-utils';
import PeerJsConnections from '~/lib/PeerJsConnections';
import {clockOffsetState, ClockSync, rttState} from '~/lib/clockSync';
import WebsocketConnection, {rttState as websocketPeerRttState, peerIdsState, idState} from '~/lib/websocketConnection';

// import Youtube from 'react-player/youtube';

// eslint-disable-next-line react/function-component-definition
export default function Index() {
	const [isBigCircle, setIsBigCircle] = useState(false);
	const clockOffset = useRecoilValue(clockOffsetState);
	const websocketPeerRtt = useRecoilValue(websocketPeerRttState);
	const peerIds = useRecoilValue(peerIdsState);
	const id = useRecoilValue(idState);
	const rtt = useRecoilValue(rttState);

	useEffect(() => {
		const intervalId = setInterval(() => {
			const syncedTime = Date.now() + clockOffset;
			const newIsBigCircle = Math.floor(syncedTime / 3000) % 2 === 0;
			if (isBigCircle !== newIsBigCircle) {
				setIsBigCircle(newIsBigCircle);
			}
		}, 10);
		return () => {
			clearInterval(intervalId);
		};
	}, [isBigCircle, setIsBigCircle, clockOffset]);

	useEffect(() => {
		const clockSync = new ClockSync();
		return () => {
			clockSync.teardown();
		};
	}, []);

	useEffect(() => {
		const con = new WebsocketConnection();
		return () => {
			con.close();
		};
	}, []);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'}}>
			<h1>Welcome to Remix</h1>
			<ul>
				<li>
					<a
						target="_blank"
						href="https://remix.run/tutorials/blog"
						rel="noreferrer"
					>
						15m Quickstart Blog Tutorial
					</a>
				</li>
				<li>
					<a
						target="_blank"
						href="https://remix.run/tutorials/jokes"
						rel="noreferrer"
					>
						Deep Dive Jokes App Tutorial
					</a>
				</li>
				<li>
					<Link to="/other">Other page</Link>
				</li>
			</ul>
			<p>Clock offset: {clockOffset}ms</p>
			<p>RTT: {rtt}ms</p>
			<p>WebSocket Peer RTT: {websocketPeerRtt}ms</p>
			<ClientOnly>
				{() => <PeerJsConnections id={id} peerIds={peerIds}/>}
			</ClientOnly>
			<div style={{
				width: '10rem',
				height: '10rem',
				borderRadius: '5rem',
				background: 'black',
				transform: isBigCircle ? 'scale(1)' : 'scale(0.5)',
			}}
			/>
		</div>
	);
}
