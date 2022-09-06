import {useParams} from '@remix-run/react';
import {useCallback} from 'react';

export default function Button() {
	const {id} = useParams();

	const handleClickButton = useCallback(async () => {
	}, []);

	return (
		<div style={{fontFamily: 'system-ui, sans-serif', lineHeight: '1.4'}}>
			<h1>Button ID: {id}</h1>
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

