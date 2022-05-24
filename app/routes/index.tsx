/* eslint-disable react/react-in-jsx-scope */

import {json} from '@remix-run/cloudflare';
import {Link, useLoaderData} from '@remix-run/react';
import {useEffect, useState} from 'react';
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

	useEffect(() => {
		console.log('loading client-side time');
		setClientSideClock(Date.now());
	}, [setClientSideClock]);

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
			<p>aaaa</p>
			<p>Server-side clock: {serverSideClock}</p>
			<p>Client-side clock: {clientSideClock}</p>
		</div>
	);
}
