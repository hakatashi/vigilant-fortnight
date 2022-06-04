export const median = (array: number[]) => {
	const clonedArray = array.slice();
	clonedArray.sort((a, b) => b - a);
	const {length} = clonedArray;
	if (length % 2 === 0) {
		return (clonedArray[length / 2] + clonedArray[(length / 2) - 1]) / 2;
	}
	return clonedArray[Math.floor(length / 2)];
};

export class Deferred<T> {
	promise: Promise<T>;

	isResolved: boolean;

	isRejected: boolean;

	private nativeReject!: (...args: any[]) => any;

	private nativeResolve!: (...args: any[]) => any;

	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.nativeReject = reject;
			this.nativeResolve = resolve;
		});
		this.isResolved = false;
		this.isRejected = false;
	}

	resolve(value: T) {
		this.nativeResolve(value);
		this.isResolved = true;
		return this.promise;
	}

	reject(...args: any[]) {
		this.nativeReject(...args);
		this.isRejected = true;
		return this.promise;
	}
}
