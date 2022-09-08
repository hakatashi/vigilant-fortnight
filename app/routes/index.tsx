import {Link} from '@remix-run/react';
import {useCallback, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {useRecoilValue} from 'recoil';
import {ClientOnly} from 'remix-utils';
import {useCreateButtonMutation, useListButtonQuery} from '~/generated/graphql';
import SkywayConnections from '~/lib/SkywayConnections';
import {peerIdsState, idState} from '~/lib/WebsocketConnections';
import {clockOffsetState, ClockSync, rttState} from '~/lib/clockSync';

export default function Index() {
	const [isBigCircle, setIsBigCircle] = useState(false);
	const clockOffset = useRecoilValue(clockOffsetState);
	const peerIds = useRecoilValue(peerIdsState);
	const id = useRecoilValue(idState);
	const rtt = useRecoilValue(rttState);
	const navigate = useNavigate();

	const [{data: listButtonResult}] = useListButtonQuery();

	useEffect(() => {
		const intervalId = setInterval(() => {
			const syncedTime = Date.now() + clockOffset;
			const newIsBigCircle = Math.floor(syncedTime / 3000) % 2 === 0;
			setIsBigCircle(newIsBigCircle);
		}, 10);
		return () => {
			clearInterval(intervalId);
		};
	}, [clockOffset]);

	useEffect(() => {
		const clockSync = new ClockSync();
		return () => {
			clockSync.teardown();
		};
	}, []);

	const [createButtonResult, createButton] = useCreateButtonMutation();

	const handleClickButton = useCallback(async () => {
		const result = await createButton({connectionId: id});
		navigate(`/buttons/${result.data?.createButton?.id}`);
	}, [id, createButton, navigate]);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'}}>
			<p>Clock offset: {clockOffset}ms</p>
			<p>CDN RTT: {rtt}ms</p>
			<p>ID: {id}</p>
			<ClientOnly>
				{() => (
					<SkywayConnections id={id} peerIds={peerIds}/>
				)}
			</ClientOnly>
			{listButtonResult && (
				<>
					<p>Buttons:</p>
					<ul>
						{listButtonResult.listButton?.map((button) => (
							<li key={button?.id}><Link to={`/buttons/${button?.id}`}>{button?.id}</Link></li>
						))}
					</ul>
				</>
			)}
			<button
				type="button"
				onClick={handleClickButton}
				disabled={createButtonResult.fetching}
			>
				Create Button
			</button>
			<p>Result: {JSON.stringify(createButtonResult.data?.createButton)}</p>
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
