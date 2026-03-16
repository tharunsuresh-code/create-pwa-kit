import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 max-w-content mx-auto">
      <div className="relative w-full">
        <ThemeSwitcher />
      </div>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{{PROJECT_NAME_TITLE}}</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-8">
          Your PWA is ready. Edit <code className="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">src/app/page.tsx</code> to get started.
        </p>
        <div className="flex gap-4 justify-center text-sm text-neutral-500">
          <a href="/about" className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors">About</a>
        </div>
      </div>
    </main>
  );
}
