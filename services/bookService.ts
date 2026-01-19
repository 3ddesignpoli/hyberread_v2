import { GutenbergBook } from '../types';
import { processTextContent } from './epubService';

const PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest='
];

export interface BookSearchParams {
    query?: string;
    language?: string;
    page?: number;
}

export const searchGutenbergBooks = async ({ query = '', language = 'en', page = 1 }: BookSearchParams): Promise<GutenbergBook[]> => {
    try {
        let url = `https://gutendex.com/books?languages=${language}&page=${page}`;
        if (query) url += `&search=${encodeURIComponent(query)}`;
        else url += `&sort=popular`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        return data.results || [];
    } catch (error) {
        console.error("Search Error:", error);
        throw error;
    }
};

export const downloadBookText = async (url: string): Promise<{ words: string[], chapters: any[], rawText: string }> => {
    let lastError;

    // Try each proxy in order
    for (const proxy of PROXIES) {
        try {
            const targetUrl = proxy + encodeURIComponent(url);
            console.log(`Attempting download with proxy: ${proxy}`);
            
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error(`Status: ${res.status}`);
            
            const text = await res.text();
            if (!text || text.length < 100) throw new Error("Content too short or empty");
            
            const { words, chapters } = processTextContent(text);
            return { words, chapters, rawText: text };
        } catch (err) {
            console.warn(`Proxy failed: ${proxy}`, err);
            lastError = err;
        }
    }

    throw lastError || new Error("All proxies failed");
};
