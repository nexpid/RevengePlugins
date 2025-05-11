import { NavigationNative, React } from "@vendetta/metro/common";

export function managePage(
	options: {
		title?: string;
		headerLeft?: React.FC;
		headerRight?: React.FC;
	},
	navigation?: any,
	...deps: any[]
) {
	if (!navigation) navigation = NavigationNative.useNavigation();

	React.useEffect(() => {
		navigation.setOptions(options);
	}, [navigation, ...deps]);
}
