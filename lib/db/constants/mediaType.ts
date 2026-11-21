export const mediaTypes = [
	"Image",  // generic, can be used anywhere
	"Audio",  // generic, can be used anywhere
	"Video",  // generic, can be used anywhere

	"Cover",  // arist pfp or song/album cover
	"Banner", // artist banner
] as const;

export type MediaType = (typeof mediaTypes)[number];