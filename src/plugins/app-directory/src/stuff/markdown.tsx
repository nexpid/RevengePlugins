import { findByProps } from "@vendetta/metro";

const parser = findByProps("parse", "parseToAST", "reactParserFor");

// TODO make image work
// const rules = {
//   ...parser.defaultRules,
//   image: {
//     order: parser.defaultRules.link.order - 1,
//     match(src: string) {
//       return src.match(
//         /^!\[(.*?(?=\]))\]\((https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*))(?: "([^"]*)")?\)/
//       );
//     },
//     parse(
//       source: [string, string, string, string],
//       nestedParse: (src: string, options: any) => any,
//       options: any
//     ) {
//       return {
//         alt: source[3] ?? source[1],
//         url: source[2],
//       };
//     },
//     react(node: { alt?: string; url: string }, render: (src: string) => any) {
//       return <SmartImage alt={node.alt} url={node.url} />;
//     },
//   },
// };

export function parse(text: string) {
	const reactParse = parser.parse; // parser.reactParserFor(rules);
	return reactParse(text, true, {
		allowHeading: true,
		allowLinks: true,
		allowList: true,
	});
}
