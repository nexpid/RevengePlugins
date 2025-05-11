import { React } from "@vendetta/metro/common";

type PromiseRet<Res> =
	| {
		fulfilled: false;
	}
	| {
		fulfilled: true;
		success: false;
		error: any;
	}
	| {
		fulfilled: true;
		success: true;
		response: Res;
	};

export default function usePromise<Res>(
	promise: (signal: AbortSignal) => Promise<Res>,
	deps: any[] = [],
): PromiseRet<Res> {
	const [res, setRes] = React.useState<PromiseRet<Res>>({
		fulfilled: false,
	});
	const tracker = React.useRef(0);

	React.useEffect(() => {
		const id = Date.now();
		tracker.current = id;

		const controller = new AbortController();

		setRes({
			fulfilled: false,
		});
		promise(controller.signal)
			.then(
				response =>
					tracker.current === id
					&& setRes({
						fulfilled: true,
						success: true,
						response,
					}),
			)
			.catch(
				error =>
					tracker.current === id
					&& setRes({
						fulfilled: true,
						success: false,
						error,
					}),
			);

		return () => {
			controller.abort();
		};
	}, deps);

	return res;
}
