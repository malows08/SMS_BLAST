import * as React from "react";
import { Dialog as HeadlessDialog } from "@headlessui/react";

export function Dialog({ open, onClose, children }: {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <HeadlessDialog open={open} onClose={onClose}>
            <div className="fixed inset-0 bg-black/30" />
            <div className="fixed inset-0 flex items-center justify-center">
                <HeadlessDialog.Panel className="bg-white p-6 rounded-lg shadow-lg">
                    {children}
                </HeadlessDialog.Panel>
            </div>
        </HeadlessDialog>
    );
}
