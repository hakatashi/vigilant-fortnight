import {createEventHandler} from '@remix-run/cloudflare-workers';
import * as build from '@remix-run/dev/server-build';

const remixEventHandler = createEventHandler({build, mode: process.env.NODE_ENV});

addEventListener(
	'fetch',
	(event) => {
		const url = new URL(event.request.url);
		const path = url.pathname;

		if (path === '/ping') {
			return event.respondWith(
				new Response(Date.now().toString(), {
					headers: {
						'Content-Type': 'text/plain;charset=UTF-8',
						'Cache-Control': 'private',
					},
				}),
			);
		}

		return remixEventHandler(event);
	},
);
