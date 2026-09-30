import { CircleAlert, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { useMessages } from "#/lib/locale";

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	onConfirm: () => void;
	isPending?: boolean;
	destructive?: boolean;
	icon?: ReactNode;
	/** Extra content between the description and the buttons (e.g. options). */
	children?: ReactNode;
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	onConfirm,
	isPending,
	destructive,
	icon,
	children,
}: ConfirmDialogProps) {
	const m = useMessages();
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogMedia>
						{icon ??
							(destructive ? (
								<CircleAlert aria-hidden="true" />
							) : (
								<RefreshCw aria-hidden="true" />
							))}
					</AlertDialogMedia>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				{children}
				<AlertDialogFooter>
					<AlertDialogCancel>{m.admin_cancel()}</AlertDialogCancel>
					<AlertDialogAction
						variant={destructive ? "destructive" : "default"}
						disabled={isPending}
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
					>
						{m.admin_confirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
