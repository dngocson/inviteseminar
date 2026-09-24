import { Copy, Download } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "#/components/ui/dialog";
import { buildQrCardCanvas } from "#/lib/qr-card";
import { m } from "#/paraglide/messages";

interface QrCodeDialogProps {
	trigger: ReactNode;
	guestName: string;
	inviteUrl: string;
}

export function QrCodeDialog({
	trigger,
	guestName,
	inviteUrl,
}: QrCodeDialogProps) {
	const [open, setOpen] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	async function downloadPng() {
		const qrCanvas = canvasRef.current;
		if (!qrCanvas) return;

		try {
			await document.fonts.ready;
		} catch {
			// best-effort — falls back to whatever font is already available
		}

		const card = buildQrCardCanvas(qrCanvas, {
			name: guestName,
			caption: m.admin_qr_image_caption(),
		});

		const link = document.createElement("a");
		link.download = `qr-${guestName.trim().replace(/\s+/g, "-").toLowerCase()}.png`;
		link.href = card.toDataURL("image/png");
		link.click();
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(inviteUrl);
			toast.success(m.admin_copy_link_success());
		} catch {
			toast.error(m.admin_error_generic());
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>
						{m.admin_qr_dialog_title({ name: guestName })}
					</DialogTitle>
					<DialogDescription>{m.admin_qr_scan_hint()}</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-4 py-2">
					<div className="rounded-lg border bg-white p-5">
						<QRCodeCanvas
							ref={canvasRef}
							value={inviteUrl}
							size={200}
							marginSize={0}
							level="M"
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						onClick={copyLink}
						className="w-full"
						title={inviteUrl}
					>
						<Copy data-icon="inline-start" />
						{m.admin_copy_link()}
					</Button>
				</div>

				<DialogFooter className="flex-col sm:flex-col">
					<Button
						type="button"
						onClick={downloadPng}
						className="h-11 w-full px-6"
					>
						<Download data-icon="inline-start" /> {m.admin_qr_download()}
					</Button>
					<Button
						type="button"
						variant="ghost"
						className="w-full"
						onClick={() => setOpen(false)}
					>
						{m.admin_cancel()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
