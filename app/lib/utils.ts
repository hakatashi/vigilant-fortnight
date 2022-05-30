export const median = (array: number[]) => {
	const clonedArray = array.slice();
	clonedArray.sort((a, b) => b - a);
	const {length} = clonedArray;
	if (length % 2 === 0) {
		return (clonedArray[length / 2] + clonedArray[(length / 2) - 1]) / 2;
	}
	return clonedArray[Math.floor(length / 2)];
};
