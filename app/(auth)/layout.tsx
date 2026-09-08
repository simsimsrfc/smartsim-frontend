// Layout pour /login et /signup — sans sidebar, fond dark uni.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-app">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
