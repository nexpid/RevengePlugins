import { without } from "@vendetta/utils";

import { modalCloseButton, Navigator, popModal } from "../types";

export default function Modal(
	props: React.PropsWithChildren<{
		mkey: string;
		headerRight?: React.FunctionComponent;
		title?: string;
	}>,
) {
	if (!Navigator || !modalCloseButton) return null;
	return (
		<Navigator
			initialRouteName={props.mkey}
			screens={{
				[props.mkey]: Object.assign(
					without(props, "mkey", "children"),
					{
						headerLeft: modalCloseButton?.(() => popModal(props.mkey)),
						render: () => props.children,
					},
				),
			}}
		/>
	);
}
