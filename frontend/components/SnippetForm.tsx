"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type SnippetFormModel = {
  title: string;
  code: string;
};

export default function SnippetForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<SnippetFormModel>({
    title: "",
    code: "",
  });

  const [isLoading, setIsLoading] = useState(false); // +1: Töltés állapot visszajelzéshez

  const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch(`${API_URL}/api/snippets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setFormData({ title: "", code: "" });
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 max-w-5xl w-full mx-auto rounded-xl border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        New Code Snippet
      </h2>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-medium text-gray-400">
            Title
          </label>
          <input
            id="title"
            type="text"
            placeholder="e.g. Flask Hello World"
            className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all placeholder-gray-600"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="code" className="text-sm font-medium text-gray-400">
            Code
          </label>
          <textarea
            id="code"
            className="w-full h-40 bg-gray-900 text-green-400 font-mono text-sm border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder-gray-600"
            placeholder="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            spellCheck={false}
            disabled={isLoading}
          ></textarea>
        </div>

        <button
          disabled={isLoading}
          className={`
            w-full sm:w-auto self-end bg-purple-600 hover:bg-purple-700 text-white 
            font-bold py-3 px-8 rounded-lg 
            hover:shadow-purple-500/20 active:scale-95
            ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {isLoading ? "Publishing..." : "Publish Snippet"}
        </button>
      </form>
    </div>
  );
}
