export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-full max-w-lg mx-auto px-6 py-10">{children}</div>
    </main>
  );
}
