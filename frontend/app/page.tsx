import { Snippet } from "@/model/snippet-model";
import SnippetForm from "@/components/SnippetForm";

export default async function Home() {
  let snippets: Snippet[] = [];

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const res = await fetch(`${API_URL}/api/snippets`, { cache: "no-store" });
    if (!res.ok) throw new Error("Unexpected error");
    snippets = await res.json();
  } catch (e) {
    console.error(e);
  }

  return (
    <main className="flex flex-col h-screen bg-slate-900">
      <div>
        <h1 className="bg-purple-600 text-2xl p-4 font-bold text-white">
          Code snippets
        </h1>
      </div>
      <div className="p-4 flex flex-col flex-1 s gap-4 max-w-5xl w-full  mx-auto overflow-y-auto">
        <SnippetForm />
        <div className="space-y-6">
          {snippets.map((snippet, index) => (
            <div
              key={`snippet-${index}`}
              className="bg-gray-800 shadow rounded-lg p-6 border-l-4 border-purple-600"
            >
              <h3 className="text-xl font-bold mb-2 text-white">
                {snippet.title}
              </h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto font-mono text-sm">
                <pre>{snippet.code}</pre>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                {new Date(snippet.created_at).toDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
