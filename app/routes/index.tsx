/* eslint-disable react/react-in-jsx-scope */

import noop from 'lodash/noop';
import {useCallback, useEffect, useState} from 'react';
import {useRecoilValue} from 'recoil';
import {ClientOnly} from 'remix-utils';
import {useQuery} from 'urql';
import {GetButtonDocument, useCreateButtonMutation, useGetButtonQuery} from '~/generated/graphql';
import SkywayConnections from '~/lib/SkywayConnections';
import {peerIdsState, idState, wsState} from '~/lib/WebsocketConnections';
import {clockOffsetState, ClockSync, rttState} from '~/lib/clockSync';

// import Youtube from 'react-player/youtube';


const useFriendStatus = (friendID) => {
	const [isOnline, setIsOnline] = useState<boolean>(false);

	const handleStatusChange = (status: boolean) => {
		setIsOnline(status);
	};

	useEffect(() => {
		console.log(`Subscribed to ${friendID}`, handleStatusChange);
		return () => {
			console.log(`Unsubscribed to ${friendID}`, handleStatusChange);
		};
	}, [friendID]);

	return isOnline;
};

const Friend = ({friendID}: {friendID: number}) => {
	const isOnline = useFriendStatus(friendID);
	return (
		<p>{friendID}: {isOnline}</p>
	);
};

// eslint-disable-next-line react/function-component-definition
export default function Index() {
	const [isBigCircle, setIsBigCircle] = useState(false);
	const clockOffset = useRecoilValue(clockOffsetState);
	const peerIds = useRecoilValue(peerIdsState);
	const id = useRecoilValue(idState);
	const rtt = useRecoilValue(rttState);
	const ws = useRecoilValue(wsState);

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
		if (!ws) {
			return noop;
		}

		const button = ws.getButton('hoge');
		return () => {
			button.quit();
		};
	}, [ws]);

	useEffect(() => {
		const clockSync = new ClockSync();
		return () => {
			clockSync.teardown();
		};
	}, []);

	const [{data}] = useGetButtonQuery({
		variables: {
			id: '07920555-db03-4f5b-93ca-2f00425d8538',
		},
	});

	const [createButtonResult, createButton] = useCreateButtonMutation();

	const handleClickButton = useCallback(async () => {
		const result = await createButton({connectionId: id});
		console.log(result);
	}, [id]);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'}}>
			<h1>Connection test page</h1>
			<p>Data: {JSON.stringify(data)}</p>
			<Friend friendID={1}/>
			<Friend friendID={2}/>
			<Friend friendID={2}/>
			<Friend friendID={1}/>
			<Friend friendID={1}/>
			<Friend friendID={3}/>
			<Friend friendID={1}/>
			<p>Clock offset: {clockOffset}ms</p>
			<p>CDN RTT: {rtt}ms</p>
			<p>ID: {id}</p>
			<ClientOnly>
				{() => (
					<SkywayConnections id={id} peerIds={peerIds}/>
				)}
			</ClientOnly>
			<button
				type="button"
				onClick={handleClickButton}
				disabled={createButtonResult.fetching}
			>
				Create Button
			</button>
			<p>Result: {JSON.stringify(createButtonResult)}</p>
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
