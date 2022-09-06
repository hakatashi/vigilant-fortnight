import {useParams} from '@remix-run/react';
import {useCallback, useEffect, useState} from 'react';
import {useGetButtonQuery} from '~/generated/graphql';
import ButtonManager from '~/lib/ButtonManager';

export default function Button() {
	const {id} = useParams();
	const [button, setButton] = useState<ButtonManager | null>(null);

	const [{data: buttonData}] = useGetButtonQuery({
		variables: {
			id: id!,
		},
	});

	useEffect(() => {
		if (id !== undefined) {
			setButton(new ButtonManager(id));
		}
	}, [id]);

	const handleClickButton = useCallback(() => {
		const timestamp = Date.now();
		button?.push(timestamp);
	}, [button]);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'}}>
			<h1>Button ID: {id}</h1>
			<p>Data: {JSON.stringify(buttonData)}</p>
			<button
				type="button"
				onClick={handleClickButton}
				style={{
					width: '10rem',
					height: '10rem',
					borderRadius: '100%',
				}}
			>
				Slash!
			</button>
		</div>
	);
}

