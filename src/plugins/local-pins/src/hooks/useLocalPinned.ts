import { findByProps, findByStoreName } from "@vendetta/metro";
import { React } from "@vendetta/metro/common";

import { getAllPins, getPins } from "..";

const MessageStore = findByStoreName("MessageStore");
const ChannelStore = findByStoreName("ChannelStore");
const messages = findByProps("sendMessage", "receiveMessage");

export default function useLocalPinned(channelId?: string) {
	const [data, setData] = React.useState<
		| {
			message: any;
			channelId: string;
			channel?: any;
		}[]
		| null
	>(null);
	const [status, setStatus] = React.useState(0);

	React.useEffect(() => {
		(async () => {
			const parsed = new Array<{
				message: any;
				channelId: string;
				channel?: any;
			}>();

			const raw = channelId ? getPins(channelId) : getAllPins();
			for (let i = 0; i < raw.length; i++) {
				const m = raw[i];
				setStatus(i / raw.length);

				const id = (
					"channelId" in m ? m.channelId : channelId
				) as string;
				if (!id) continue;

				let message = MessageStore.getMessage(id, m.id);
				if (!message) {
					const numbers = [
						(BigInt(m.id) + 1n).toString(),
						(BigInt(m.id) - 1n).toString(),
					];

					await messages.fetchMessages({
						channelId: id,
						before: numbers[0],
						after: numbers[1],
						limit: 1,
					});
					message = MessageStore.getMessage(id, m.id);
				}

				if (message) {
					parsed.push({
						message,
						channelId: id,
						channel: ChannelStore.getChannel(id),
					});
				}
			}

			setData(parsed);
		})();
	}, [channelId]);

	return {
		data,
		status,
		clear: () => {
			setData([]);
		},
		remove: (id: string) => data && setData(data.filter(x => x.message.id !== id)),
	};
}
