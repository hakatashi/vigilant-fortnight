import {RemixBrowser} from '@remix-run/react';
import React, {useEffect} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {RecoilRoot, useSetRecoilState} from 'recoil';
import RecoilNexus from 'recoil-nexus';
import {WebsocketConnection, wsState} from './lib/WebsocketConnections';

const ClientRoot = ({children}: React.PropsWithChildren<unknown>) => {
	const setWs = useSetRecoilState(wsState);

	useEffect(() => {
		const ws = new WebsocketConnection();
		setWs(ws);

		return () => {
			ws.close();
			setWs(null);
		};
	}, [setWs]);

	return (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<>
			{children}
		</>
	);
};

hydrateRoot(
	document,
	<RecoilRoot>
		<ClientRoot>
			<RecoilNexus/>
			<RemixBrowser/>
		</ClientRoot>
	</RecoilRoot>,
);
