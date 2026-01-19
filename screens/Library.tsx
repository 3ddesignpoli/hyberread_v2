
import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Upload, Trash2, Plus, FileText, Search, Loader2, Globe, Download, X, ExternalLink, Info, AlertCircle, ChevronLeft } from 'lucide-react';
import { Book, GutenbergBook } from '../types';
import { THEME } from '../constants';
import { parseEpubFile, parseTxtFile, parsePdfFile, processTextContent } from '../services/epubService';
import { searchGutenbergBooks, downloadBookText } from '../services/bookService';

interface LibraryProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onAddBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  t: (key: string) => string;
  language: string;
}

const LibraryScreen: React.FC<LibraryProps> = ({ books, onSelectBook, onAddBook, onDeleteBook, t, language }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showOnlineSearch, setShowOnlineSearch] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLanguage, setSearchLanguage] = useState(language);
  const [onlineBooks, setOnlineBooks] = useState<GutenbergBook[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingBookId, setDownloadingBookId] = useState<number | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      let bookData;
      let type: 'epub' | 'txt' | 'pdf' = 'txt';
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.epub')) { bookData = await parseEpubFile(file); type = 'epub'; }
      else if (fileName.endsWith('.pdf')) { bookData = await parsePdfFile(file); type = 'pdf'; }
      else if (fileName.endsWith('.txt')) { bookData = await parseTxtFile(file); type = 'txt'; }
      else { throw new Error('Unsupported format'); }

      if (!bookData.content || bookData.content.length < 10) {
        throw new Error('Book content is empty or too short');
      }

      onAddBook({
        id: Date.now().toString(),
        title: bookData.title,
        author: bookData.author || 'Unknown',
        content: bookData.content,
        chapters: bookData.chapters,
        coverColor: [THEME.blue, THEME.green, THEME.yellow][Math.floor(Math.random() * 3)],
        progress: 0,
        totalWords: bookData.content.length,
        addedAt: Date.now(),
        type: type
      });
    } catch (error: any) {
      console.error(error);
      setErrorToast(error.message || 'Error processing file');
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchBooks = async (query: string = '') => {
    setIsSearching(true);
    try {
      const books = await searchGutenbergBooks({ query, language: searchLanguage });
      setOnlineBooks(books);
    } catch (err) {
      setErrorToast(t('search_error'));
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => { if (showOnlineSearch) fetchBooks(searchQuery); }, [showOnlineSearch, searchLanguage]);

  const handleDownloadBook = async (book: GutenbergBook) => {
    setDownloadingBookId(book.id);
    try {
      const downloadUrl = book.formats['text/plain; charset=utf-8'] || book.formats['text/plain'];
      if (!downloadUrl) throw new Error("Format not found");

      const { words, chapters } = await downloadBookText(downloadUrl);

      onAddBook({
        id: `g-${book.id}`,
        title: book.title,
        author: book.authors[0]?.name || 'Classic',
        content: words,
        chapters: chapters,
        coverColor: THEME.green,
        progress: 0,
        totalWords: words.length,
        addedAt: Date.now(),
        type: 'gutenberg'
      });
      setShowOnlineSearch(false);
      setErrorToast("Book added successfully!");
      setTimeout(() => setErrorToast(null), 2000);
    } catch (err) {
      console.error(err);
      setErrorToast("Could not download. Opening source...");
      setTimeout(() => window.open(`https://www.gutenberg.org/ebooks/${book.id}`, '_blank'), 1500);
    } finally {
      setDownloadingBookId(null);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) return;
    const { words, chapters } = processTextContent(pasteContent);
    onAddBook({
      id: `p-${Date.now()}`,
      title: pasteTitle || t('paste_title'),
      author: 'Manual Entry',
      content: words,
      chapters: chapters,
      coverColor: THEME.yellow,
      progress: 0,
      totalWords: words.length,
      addedAt: Date.now(),
      type: 'paste'
    });
    setPasteContent(''); setPasteTitle(''); setShowPasteModal(false);
  };

  return (
    <div className="min-h-screen pb-24 px-6 pt-12" style={{ backgroundColor: THEME.bgLight }}>
      {errorToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={18} className="text-red-400" />
          <span className="text-sm font-medium">{errorToast}</span>
        </div>
      )}

      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{t('library')}</h1>
          <p className="text-gray-500 text-sm mt-1">{books.length} {t('books_available')}</p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={28} /> : <Plus size={28} />}
        </button>
      </header>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".epub,.txt,.pdf" className="hidden" />

      <div className="flex gap-3 mb-10">
        <button onClick={() => setShowPasteModal(true)} className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
          <FileText size={24} className="text-blue-500" /> <span className="text-xs font-black uppercase tracking-widest">{t('paste_text')}</span>
        </button>
        <button onClick={() => setShowOnlineSearch(true)} className="flex-1 bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
          <Globe size={24} className="text-green-500" /> <span className="text-xs font-black uppercase tracking-widest">{t('browse_free')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map(book => (
          <div key={book.id} className="group relative">
            <div
              onClick={() => onSelectBook(book)}
              className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all cursor-pointer h-full flex flex-col active:scale-95"
            >
              <div
                className="h-40 rounded-3xl mb-5 flex items-center justify-center text-white relative overflow-hidden shadow-inner"
                style={{ backgroundColor: book.coverColor }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <BookOpen size={48} className="opacity-80" />
                <div className="absolute bottom-3 right-3 text-[9px] font-black bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {book.type}
                </div>
              </div>
              <h3 className="font-black text-gray-800 text-sm line-clamp-2 mb-1 leading-snug uppercase tracking-tight">{book.title}</h3>
              <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider">{book.author}</p>
              <div className="mt-auto">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${(book.progress / (book.totalWords || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteBook(book.id); }}
              className="absolute -top-2 -right-2 w-10 h-10 bg-white text-red-500 rounded-2xl shadow-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 border border-gray-100"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {showOnlineSearch && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="font-black text-lg text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Globe size={24} className="text-green-600" /> {t('browse_free')}
              </h2>
              <button onClick={() => setShowOnlineSearch(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3 flex-col md:flex-row">
                <select
                  value={searchLanguage}
                  onChange={(e) => setSearchLanguage(e.target.value)}
                  className="bg-gray-100 rounded-2xl px-4 py-4 font-bold outline-none border cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  <option value="en">English 🇬🇧</option>
                  <option value="tr">Türkçe 🇹🇷</option>
                  <option value="de">Deutsch 🇩🇪</option>
                  <option value="fr">Français 🇫🇷</option>
                  <option value="es">Español 🇪🇸</option>
                  <option value="ru">Русский 🇷🇺</option>
                </select>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-4 text-gray-400" size={20} />
                  <input type="text" placeholder={t('search_gutenberg')} className="w-full pl-12 pr-6 py-4 bg-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchBooks(searchQuery)} />
                </div>
                <button onClick={() => fetchBooks(searchQuery)} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-100">ARA</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Loader2 size={48} className="animate-spin mb-4" />
                  <p className="font-black uppercase tracking-[0.2em] text-xs">Aranıyor...</p>
                </div>
              ) : onlineBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
                  {onlineBooks.map(book => (
                    <div key={book.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col hover:border-green-300 transition-all group">
                      <h3 className="font-black text-gray-800 line-clamp-1 text-sm uppercase tracking-tight mb-1">{book.title}</h3>
                      <p className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-wider">{book.authors[0]?.name || 'Unknown'}</p>
                      <button
                        onClick={() => handleDownloadBook(book)}
                        disabled={downloadingBookId === book.id}
                        className="mt-auto w-full py-4 bg-green-50 text-green-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-green-600 hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {downloadingBookId === book.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {t('add_to_lib')}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-300 mt-20 flex flex-col items-center">
                  <Info size={60} className="mb-4 opacity-20" />
                  <p className="font-black uppercase tracking-widest text-xs">Sonuç Bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPasteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-widest">
              <FileText className="text-blue-600" size={28} /> {t('paste_title')}
            </h2>
            <input type="text" placeholder={t('book_title_placeholder')} value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} className="w-full p-5 bg-gray-50 rounded-2xl border-none mb-4 focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
            <textarea placeholder={t('paste_placeholder')} value={pasteContent} onChange={(e) => setPasteContent(e.target.value)} className="w-full h-48 p-5 bg-gray-50 rounded-2xl border-none mb-8 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium leading-relaxed" />
            <div className="flex gap-4">
              <button onClick={() => setShowPasteModal(false)} className="flex-1 py-5 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-100 rounded-[1.5rem] transition-colors">İptal</button>
              <button onClick={handlePasteSubmit} className="flex-1 py-5 bg-blue-600 text-white font-black uppercase tracking-widest rounded-[1.5rem] hover:bg-blue-700 shadow-xl shadow-blue-200 active:scale-95 transition-all">Okumaya Başla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryScreen;
