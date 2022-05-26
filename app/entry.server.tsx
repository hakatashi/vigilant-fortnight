import type {EntryContext} from '@remix-run/node';
import {RemixServer} from '@remix-run/react';
import {renderToString} from 'react-dom/server';
import {RecoilRoot} from 'recoil';

export default function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	const markup = renderToString(
		<RecoilRoot>
			<RemixServer context={remixContext} url={request.url}/>,
		</RecoilRoot>,
	);

	responseHeaders.set('Content-Type', 'text/html');

	return new Response(`<!DOCTYPE html>${markup}`, {
		status: responseStatusCode,
		headers: responseHeaders,
	});
}
