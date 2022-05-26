import {RemixBrowser} from '@remix-run/react';
import {hydrateRoot} from 'react-dom/client';
import {RecoilRoot} from 'recoil';
import RecoilNexus from 'recoil-nexus';

hydrateRoot(
	document,
	<RecoilRoot>
		<RecoilNexus/>
		<RemixBrowser/>
	</RecoilRoot>,
);
