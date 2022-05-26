import {atom} from 'recoil';
import {setRecoil} from 'recoil-nexus';

export const clockOffsetState = atom<number>({
	key: 'lib.clockSync.clockOffset',
	default: 0,
});

export const rttState = atom<number>({
	key: 'lib.clockSync.rtt',
	default: 0,
});

export class ClockSync {
	private nextTimeoutId: NodeJS.Timer;

	private measuredClockOffsets: number[];

	private measuredRtts: number[];

	private pingCount: number;

	constructor() {
		this.measuredClockOffsets = [];
		this.measuredRtts = [];
		this.pingCount = 0;
		this.nextTimeoutId = setTimeout(() => {
			this.probe();
		}, this.getNextProbeInterval());
	}

	async probe() {
		const {fetchStart, fetchEnd, fetchServerStart} = await this.ping();
		const clockOffset = ((fetchServerStart - fetchStart) + (fetchServerStart - fetchEnd)) / 2;
		const rtt = fetchEnd - fetchStart;

		this.measuredClockOffsets.push(clockOffset);
		this.measuredRtts.push(rtt);

		if (this.measuredClockOffsets.length >= 5) {
			this.measuredClockOffsets = this.measuredClockOffsets.slice(-5);
			// eslint-disable-next-line prefer-destructuring
			const finalClockOffset = this.measuredClockOffsets.slice().sort()[2];
			setRecoil(clockOffsetState, finalClockOffset);
		}

		if (this.measuredRtts.length >= 5) {
			this.measuredRtts = this.measuredRtts.slice(-5);
			// eslint-disable-next-line prefer-destructuring
			const finalRtt = this.measuredRtts.slice().sort()[2];
			setRecoil(rttState, finalRtt);
		}

		this.nextTimeoutId = setTimeout(() => {
			this.probe();
		}, this.getNextProbeInterval());
	}

	async ping() {
		this.pingCount++;

		const fetchStart = Date.now();
		const res = await fetch('/ping');
		const fetchEnd = Date.now();

		const text = await res.text();
		const fetchServerStart = parseInt(text);

		return {fetchStart, fetchEnd, fetchServerStart};
	}

	private getNextProbeInterval() {
		if (this.pingCount <= 5) {
			return 1000;
		}
		const interval = 1000 + (this.pingCount - 5) * 1000;
		return Math.min(interval, 60 * 1000);
	}

	teardown() {
		if (this.nextTimeoutId) {
			clearTimeout(this.nextTimeoutId);
		}
	}
}
