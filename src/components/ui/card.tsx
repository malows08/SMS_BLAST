import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow border border-gray-200">
            {children}
        </div>
    );
}

export function CardContent({ children }: { children: ReactNode }) {
    return <div className="p-4">{children}</div>;
}