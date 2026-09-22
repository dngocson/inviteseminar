export interface QrCardLayout {
	cardWidth: number;
	padding: number;
	qrSize: number;
	radius: number;
	nameFontSize: number;
	captionFontSize: number;
	gapQrToName: number;
	gapNameToCaption: number;
	cardHeight: number;
}

const BASE_LAYOUT: Omit<QrCardLayout, "cardHeight"> = {
	cardWidth: 320,
	padding: 28,
	qrSize: 220,
	radius: 20,
	nameFontSize: 19,
	captionFontSize: 12.5,
	gapQrToName: 20,
	gapNameToCaption: 6,
};

/** Pure so it's easy to unit test without a real canvas. */
export function computeQrCardLayout(): QrCardLayout {
	const cardHeight =
		BASE_LAYOUT.padding * 2 +
		BASE_LAYOUT.qrSize +
		BASE_LAYOUT.gapQrToName +
		BASE_LAYOUT.nameFontSize +
		BASE_LAYOUT.gapNameToCaption +
		BASE_LAYOUT.captionFontSize;
	return { ...BASE_LAYOUT, cardHeight };
}

function roundedRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	ctx.beginPath();
	if (typeof ctx.roundRect === "function") {
		ctx.roundRect(x, y, w, h, r);
	} else {
		ctx.rect(x, y, w, h);
	}
}

const FONT_FAMILY = "Manrope, ui-sans-serif, system-ui, sans-serif";
const MIN_NAME_FONT_SIZE = 13;

/**
 * Composites the bare QR code onto a printable card: white background, a
 * thin border, generous padding, and the guest's name + a short caption
 * baked into the image itself — this is what gets downloaded/sent over
 * Zalo/email/printed, so it needs to be self-explanatory on its own,
 * without the surrounding dialog UI.
 */
export function buildQrCardCanvas(
	qrCanvas: HTMLCanvasElement,
	text: { name: string; caption: string },
): HTMLCanvasElement {
	const layout = computeQrCardLayout();
	const { cardWidth, cardHeight, padding, qrSize, radius } = layout;

	// Export at 2x so the PNG stays crisp when printed or zoomed into.
	const scale = 2;
	const canvas = document.createElement("canvas");
	canvas.width = cardWidth * scale;
	canvas.height = cardHeight * scale;

	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	ctx.scale(scale, scale);

	roundedRectPath(ctx, 0, 0, cardWidth, cardHeight, radius);
	ctx.fillStyle = "#ffffff";
	ctx.fill();
	ctx.strokeStyle = "#e6e2d6";
	ctx.lineWidth = 1.5;
	ctx.stroke();

	const qrX = (cardWidth - qrSize) / 2;
	ctx.drawImage(qrCanvas, qrX, padding, qrSize, qrSize);

	const maxTextWidth = cardWidth - padding * 2;
	ctx.textAlign = "center";

	let nameSize = layout.nameFontSize;
	ctx.font = `600 ${nameSize}px ${FONT_FAMILY}`;
	while (
		nameSize > MIN_NAME_FONT_SIZE &&
		ctx.measureText(text.name).width > maxTextWidth
	) {
		nameSize -= 1;
		ctx.font = `600 ${nameSize}px ${FONT_FAMILY}`;
	}
	const nameBaselineY = padding + qrSize + layout.gapQrToName + nameSize;
	ctx.fillStyle = "#14181a";
	ctx.fillText(text.name, cardWidth / 2, nameBaselineY, maxTextWidth);

	const captionBaselineY =
		nameBaselineY + layout.gapNameToCaption + layout.captionFontSize;
	ctx.fillStyle = "#6b7274";
	ctx.font = `400 ${layout.captionFontSize}px ${FONT_FAMILY}`;
	ctx.fillText(text.caption, cardWidth / 2, captionBaselineY, maxTextWidth);

	return canvas;
}
