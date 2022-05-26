/* eslint-disable react/react-in-jsx-scope */

import {json} from '@remix-run/cloudflare';
import {Link, useLoaderData} from '@remix-run/react';
import {useEffect, useState} from 'react';
import {useRecoilValue} from 'recoil';
import {clockOffsetState, ClockSync} from '~/lib/clockSync';

// import Youtube from 'react-player/youtube';

export const loader = async () => {
	console.log('loading server-side time');

	return json({
		serverSideClock: Date.now(),
	});
};

// eslint-disable-next-line react/function-component-definition, require-jsdoc
export default function Index() {
	const {serverSideClock} = useLoaderData();

	const [clientSideClock, setClientSideClock] = useState(0);
	const [fetchStart, setFetchStart] = useState(0);
	const [fetchEnd, setFetchEnd] = useState(0);
	const [fetchServerStart, setFetchServerStart] = useState(0);
	const [fetchServerEnd, setFetchServerEnd] = useState(0);
	const [isBigCircle, setIsBigCircle] = useState(false);
	const clockOffsetTarget = useRecoilValue(clockOffsetState);

	useEffect(() => {
		console.log('loading client-side time');
		setClientSideClock(Date.now());
	}, [setClientSideClock]);

	useEffect(() => {
		(async () => {
			setFetchStart(Date.now());
			const res = await fetch('/ping');
			setFetchEnd(Date.now());

			const dateHeader = res.headers.get('Date');
			if (dateHeader) {
				setFetchServerEnd(new Date(dateHeader).getTime());
			}

			const text = await res.text();
			setFetchServerStart(parseInt(text));
		})();
	}, []);

	useEffect(() => {
		const intervalId = setInterval(() => {
			const clockOffset = ((fetchServerStart - fetchStart) + (fetchServerStart - fetchEnd)) / 2;
			const syncedTime = Date.now() + clockOffset;
			const newIsBigCircle = Math.floor(syncedTime / 3000) % 2 === 0;
			if (isBigCircle !== newIsBigCircle) {
				setIsBigCircle(newIsBigCircle);
			}
		}, 10);
		return () => {
			clearInterval(intervalId);
		};
	}, [isBigCircle, setIsBigCircle, fetchServerStart, fetchStart, fetchEnd]);

	useEffect(() => {
		new ClockSync();
	}, []);

	const offset = Math.min(
		...[serverSideClock, clientSideClock, fetchStart, fetchEnd, fetchServerStart, fetchServerEnd]
			.filter((t) => t !== 0),
	);

	const rtt = fetchEnd - fetchStart;
	const clockOffset = ((fetchServerStart - fetchStart) + (fetchServerStart - fetchEnd)) / 2;

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
			<p>Server-side clock: +{serverSideClock - offset}ms</p>
			<p>Client-side clock: +{clientSideClock - offset}ms</p>
			<p>Ping client start: +{fetchStart - offset}ms</p>
			<p>Ping server start: +{fetchServerStart - offset}ms</p>
			<p>Ping server end: +{fetchServerEnd - offset}ms</p>
			<p>Ping client end: +{fetchEnd - offset}ms</p>
			<p>RTT: +{rtt}ms</p>
			<p>Clock offset: {clockOffset}ms</p>
			<p>Clock offset test: {clockOffsetTarget}ms</p>
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
