declare module "@/data/papers.json" {
  export interface Paper {
    title: string;
    authors: string[];
    year: number;
    abstract: string;
    url: string;
    citations: number;
    source: string;
    venue: string;
    topic?: string;
  }

  export interface PaperData {
    meta: {
      query: string;
      total_papers: number;
      sources: string[];
      date_range: string;
      search_date: string;
    };
    papers: Paper[];
  }

  const paperData: PaperData;
  export default paperData;
}
