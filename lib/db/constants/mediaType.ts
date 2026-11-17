export const mediaTypes = [
	"image",	   // generic, can be used anywhere
	"audio",	   // generic, can be used anywhere
	"video",	   // generic, can be used anywhere

	"cover-front", // only for songs and albums
	"cover-back",  // only for songs and albums

	"banner",      // artist/album banner
	"thumbnail",   // artist pfp, etc
] as const;

export type MediaType = (typeof mediaTypes)[number];