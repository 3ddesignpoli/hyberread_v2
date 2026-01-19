
import ePub from 'epubjs';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs`;

export const PARA_TOKEN = "¶";
export const CHAPTER_TOKEN = "§";

export const processTextContent = (text: string): { words: string[], chapters: any[] } => {
  if (!text) return { words: [], chapters: [] };
  
  const lines = text.split('\n');
  const words: string[] = [];
  const chapters: any[] = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect likely chapter titles (ALL CAPS or specific markers)
    const isHeading = (trimmed.length < 100 && trimmed === trimmed.toUpperCase() && trimmed.length > 3) || trimmed.startsWith('Chapter') || trimmed.startsWith('Bölüm');

    if (isHeading) {
      chapters.push({ title: trimmed, startIndex: words.length });
    }

    const lineWords = trimmed.split(/\s+/).filter(w => w.length > 0);
    words.push(...lineWords);
    words.push(PARA_TOKEN);
  });

  return { 
    words: words.filter(w => w.length < 50), 
    chapters 
  };
};

export const parseEpubFile = async (file: File): Promise<{ title: string; author: string; content: string[]; chapters: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // @ts-ignore
        const bookConstructor = ePub.default || ePub;
        const book = bookConstructor(arrayBuffer);
        
        await book.ready;
        const metadata = await book.loaded.metadata;
        const title = metadata.title || file.name.replace('.epub', '');
        const author = metadata.creator || 'Unknown';

        let fullText = '';
        const spineItems: any[] = [];
        book.spine.each((item: any) => spineItems.push(item));

        for (const section of spineItems) {
            try {
                const doc = await section.load(book.load.bind(book));
                const content = (doc.body ? doc.body.innerText || doc.body.textContent : doc.textContent) || '';
                fullText += '\n' + content + '\n';
            } catch (err) {
                console.warn("Failed to load section:", section.idref, err);
            }
        }

        const { words, chapters } = processTextContent(fullText);
        resolve({ title, author, content: words, chapters });
      } catch (error) {
        console.error("EPUB Parser Error:", error);
        reject(new Error("Unable to parse EPUB file."));
      }
    };
    reader.onerror = () => reject(new Error("File reading error."));
    reader.readAsArrayBuffer(file);
  });
};

export const parsePdfFile = async (file: File): Promise<{ title: string; author: string; content: string[]; chapters: any[] }> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    
    let title = file.name.replace('.pdf', '');
    let author = 'Unknown';
    try {
        const meta: any = await pdf.getMetadata();
        if (meta?.info?.Title) title = meta.info.Title;
        if (meta?.info?.Author) author = meta.info.Author;
    } catch (e) {}

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // @ts-ignore
        const strings = content.items.map((item: any) => item.str);
        fullText += strings.join(' ') + '\n\n';
    }
    
    const { words, chapters } = processTextContent(fullText);
    return { title, author, content: words, chapters };
  } catch (error) {
    throw new Error("Unable to parse PDF file.");
  }
};

export const parseTxtFile = async (file: File): Promise<{ title: string; content: string[]; chapters: any[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { words, chapters } = processTextContent(e.target?.result as string);
      resolve({ title: file.name.replace('.txt', ''), content: words, chapters });
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
