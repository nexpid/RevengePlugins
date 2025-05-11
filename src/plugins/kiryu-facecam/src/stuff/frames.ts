import { frameSet, scaleSet } from "../components/Kiryu";

const actions = {
	left: [1, 2, 1, 0],
	right: [3, 4, 3, 0],
	nod: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
};

let curInt: any;

export function sendAction(action: keyof typeof actions, fps = 1000 / 20) {
	const act = actions[action];
	scaleSet();

	let index = 0;

	clearInterval(curInt);
	curInt = setInterval(() => {
		index++;
		frameSet(act[index - 1]);
		if (index >= act.length) clearInterval(curInt);
	}, fps);
}
