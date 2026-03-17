declare module 'wink-bm25-text-search' {
  interface BM25Config {
    fldWeights?: Record<string, number>;
    bow?: boolean;
    oov?: Record<string, number>;
  }

  interface BM25Result {
    [key: number]: number;
  }

  interface BM25Document {
    [field: string]: string | string[];
  }

  class BM25 {
    defineConfig(config: BM25Config): void;
    definePrepTasks(tasks: ((text: string) => string[])[]): void;
    addDoc(doc: BM25Document, id: number): void;
    consolidate(): void;
    search(query: string): BM25Result;
  }

  function BM25(): BM25;
  export = BM25;
}
