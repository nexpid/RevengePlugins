import { findByName, findByProps, findByStoreName } from "@vendetta/metro";
import { ReactNative as RN } from "@vendetta/metro/common";
import { showConfirmationAlert } from "@vendetta/ui/alerts";

import { vstorage } from "..";

const { default: ChatItemWrapper } = findByProps(
	"DCDAutoModerationSystemMessageView",
	"default",
);
const MessageRecord = findByName("MessageRecord");
const RowManager = findByName("RowManager");
const SelectedChannelStore = findByStoreName("SelectedChannelStore");
const UserStore = findByStoreName("UserStore");
const UploadAttachmentStore = findByStoreName("UploadAttachmentStore");

const { receiveMessage } = findByProps("receiveMessage");
const { createBotMessage } = findByProps("createBotMessage");
const { getDraft } = findByProps("getDraft");

const getAttachments = async (channelId: string) =>
	await Promise.all(
		UploadAttachmentStore.getUploads(channelId, 0).map(async upload => {
			const { isImage, uniqueId, filename, spoiler, item } = upload;
			const { uri, mimeType, width, height } = item;

			const attachment = {
				id: uniqueId,
				filename: spoiler ? `SPOILER_${filename}` : filename,
				content_type: mimeType,
				size: await upload.getSize(),
				spoiler,
				url: `${uri}#`,
				proxy_url: `${uri}#`,
			} as any;

			if (isImage) {
				attachment.width = width;
				attachment.height = height;
			}

			return attachment;
		}),
	).catch(() => []);

export default async function openPreview() {
	const channelId = SelectedChannelStore.getChannelId();
	const content = getDraft(channelId, 0);
	if (
		content.trim() === ""
		&& !UploadAttachmentStore.getUploads(channelId).length
	) {
		return;
	}

	const author = UserStore.getCurrentUser();
	const attachments = await getAttachments(channelId);

	if (vstorage.previewType === "popup") {
		showConfirmationAlert({
			title: "Message Preview",
			onConfirm: () => void 0,
			// @ts-expect-error -- a valid property that's unadded in typings
			children: (
				<RN.ScrollView
					style={{
						marginVertical: 12,
						maxHeight: RN.Dimensions.get("window").height * 0.7,
					}}
				>
					<ChatItemWrapper
						rowGenerator={new RowManager()}
						message={new MessageRecord({
							id: "0",
							channel_id: channelId,
							content,
							attachments,
							author,
						})}
					/>
				</RN.ScrollView>
			),
		});
	} else {
		receiveMessage(
			channelId,
			Object.assign(
				createBotMessage({
					channelId,
					content,
				}),
				{
					author,
					attachments,
				},
			),
		);
	}
}
