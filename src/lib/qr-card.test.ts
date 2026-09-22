import { describe, expect, it } from "vitest";

import { buildQrCardCanvas, computeQrCardLayout } from "./qr-card";

describe("computeQrCardLayout", () => {
	it("sizes the card comfortably larger than the bare QR code", () => {
		const layout = computeQrCardLayout();
		expect(layout.cardWidth).toBeGreaterThan(layout.qrSize);
		expect(layout.cardHeight).toBeGreaterThan(layout.qrSize);
	});

	it("accounts for padding, the QR, both gaps, and both text lines", () => {
		const layout = computeQrCardLayout();
		const expectedHeight =
			layout.padding * 2 +
			layout.qrSize +
			layout.gapQrToName +
			layout.nameFontSize +
			layout.gapNameToCaption +
			layout.captionFontSize;
		expect(layout.cardHeight).toBeCloseTo(expectedHeight);
	});
});

describe("buildQrCardCanvas", () => {
	it("returns a canvas scaled 2x from the computed layout, without throwing", () => {
		const qrCanvas = document.createElement("canvas");
		qrCanvas.width = 220;
		qrCanvas.height = 220;
		const layout = computeQrCardLayout();

		const card = buildQrCardCanvas(qrCanvas, {
			name: "Nguyễn Văn A",
			caption: "Quét mã để mở thiệp mời",
		});

		expect(card.width).toBe(Math.trunc(layout.cardWidth * 2));
		expect(card.height).toBe(Math.trunc(layout.cardHeight * 2));
	});
});
