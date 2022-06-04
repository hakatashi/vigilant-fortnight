/* eslint-disable react/react-in-jsx-scope */

import {Link} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {useRecoilValue} from 'recoil';
import {ClientOnly} from 'remix-utils';
import SkywayConnections from '~/lib/SkywayConnections';
import WebsocketConnections, {rttState as websocketPeerRttState, peerIdsState, idState} from '~/lib/WebsocketConnections';
import {clockOffsetState, ClockSync, rttState} from '~/lib/clockSync';

// import Youtube from 'react-player/youtube';

// eslint-disable-next-line react/function-component-definition
export default function Index() {
	const [isBigCircle, setIsBigCircle] = useState(false);
	const clockOffset = useRecoilValue(clockOffsetState);
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


	return (
		<div style={{fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'}}>
			<h1>Connection test page</h1>
			<p>Clock offset: {clockOffset}ms</p>
			<p>CDN RTT: {rtt}ms</p>
			<p>ID: {id}</p>
			<ClientOnly>
				{() => (<>
					<WebsocketConnections/>
					<SkywayConnections id={id} peerIds={peerIds}/>
				</>)}
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
