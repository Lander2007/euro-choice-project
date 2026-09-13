"use client";
import AppProvider from "./store/AppStore";
import ToastHost from "./components/ToastHost";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      {children}
      <ToastHost />
    </AppProvider>
  );
}
