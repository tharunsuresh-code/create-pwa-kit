export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 max-w-content mx-auto">
      <h1 className="text-2xl font-bold mb-4">About {{PROJECT_NAME_TITLE}}</h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        Built with{" "}
        <a href="https://github.com/your-org/create-pwa-kit" className="underline">
          create-pwa-kit
        </a>
        .
      </p>
    </main>
  );
}
