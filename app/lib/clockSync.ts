import {atom} from 'recoil';
import {setRecoil} from 'recoil-nexus';

export const clockOffsetState = atom<number>({
	key: 'lib.clockSync.clockOffset',
	default: 0,
});

export class ClockSync {
	constructor() {
		setTimeout(() => {
			setRecoil(clockOffsetState, 100);
		}, 1000);
	}
}
