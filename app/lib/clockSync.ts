import {atom} from 'recoil';
import {setRecoil} from 'recoil-nexus';

export const clockOffsetState = atom<number>({
	key: 'lib.clockSync.clockOffset',
	default: 0,
});

export class ClockSync {
	private nextTimeoutId: NodeJS.Timer;

	private measuredClockOffsets: number[];

	constructor() {
		this.measuredClockOffsets = [];
		this.nextTimeoutId = setTimeout(() => {
			this.probe();
		}, 1000);
	}

	async probe() {
		const {fetchStart, fetchEnd, fetchServerStart} = await this.ping();
		const clockOffset = ((fetchServerStart - fetchStart) + (fetchServerStart - fetchEnd)) / 2;
		this.measuredClockOffsets.push(clockOffset);

		if (this.measuredClockOffsets.length >= 5) {
			this.measuredClockOffsets = this.measuredClockOffsets.slice(-5);
			// eslint-disable-next-line prefer-destructuring
			const finalClockOffset = this.measuredClockOffsets.sort()[2];
			setRecoil(clockOffsetState, finalClockOffset);
		}

		this.nextTimeoutId = setTimeout(() => {
			this.probe();
		}, 1000);
	}

	async ping() {
		const fetchStart = Date.now();
		const res = await fetch('/ping');
		const fetchEnd = Date.now();

		const text = await res.text();
		const fetchServerStart = parseInt(text);

		return {fetchStart, fetchEnd, fetchServerStart};
	}

	teardown() {
		if (this.nextTimeoutId) {
			clearTimeout(this.nextTimeoutId);
		}
	}
}
