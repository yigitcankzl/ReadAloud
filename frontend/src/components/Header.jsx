export default function Header() {
  return (
    <header className="bg-[#1E3A5F] text-white py-8 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg
            className="w-10 h-10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          <h1 className="text-4xl font-bold tracking-tight">ReadAloud</h1>
        </div>
        <p className="text-blue-200 text-lg">Turn any web page into a podcast</p>
      </div>
    </header>
  );
}
