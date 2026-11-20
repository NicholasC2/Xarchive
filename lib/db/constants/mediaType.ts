export const mediaTypes = [
	"Image",	   // generic, can be used anywhere
	"Audio",	   // generic, can be used anywhere
	"Video",	   // generic, can be used anywhere

	"Cover front", // only for songs and albums
	"Cover back",  // only for songs and albums

	"Banner",      // artist/album banner
	"Thumbnail",   // artist pfp, etc
	"None",
] as const;

export type MediaType = (typeof mediaTypes)[number];