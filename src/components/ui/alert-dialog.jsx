import * as React from "react"
export const AlertDialog = ({ children, open }) => open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">{children}</div> : null;
export const AlertDialogContent = ({ children }) => <div className="bg-white p-6 rounded-lg max-w-lg w-full">{children}</div>;
export const AlertDialogHeader = ({ children }) => <div className="mb-4">{children}</div>;
export const AlertDialogTitle = ({ children }) => <h2 className="text-lg font-bold">{children}</h2>;
export const AlertDialogDescription = ({ children }) => <p>{children}</p>;
export const AlertDialogFooter = ({ children }) => <div className="mt-4 flex justify-end gap-2">{children}</div>;
export const AlertDialogAction = ({ children, onClick }) => <button onClick={onClick} className="bg-black text-white px-4 py-2 rounded">{children}</button>;
export const AlertDialogCancel = ({ children, onClick }) => <button onClick={onClick} className="border px-4 py-2 rounded">{children}</button>;
