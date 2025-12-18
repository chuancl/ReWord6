
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { WordCategory, WordEntry, MergeStrategyConfig, WordTab, Scenario, AppView } from '../types';
import { DEFAULT_MERGE_STRATEGY } from '../constants';
import { Upload, Download, Filter, Settings2, List, Search, Plus, Trash2, CheckSquare, Square, ArrowRight, BookOpen, GraduationCap, CheckCircle, RotateCcw, FileDown, ChevronDown, Sparkles, FileText } from 'lucide-react';
import { MergeConfigModal } from './word-manager/MergeConfigModal';
import { AddWordModal } from './word-manager/AddWordModal';
import { WordList } from './word-manager/WordList';
import { Toast, ToastMessage } from './ui/Toast';
import { entriesStorage } from '../utils/storage';

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <div className="group relative flex items-center">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-pre-line text-center shadow-xl leading-relaxed min-w-[120px]">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
};

// --- 标准导入模板 (带示例) ---
const IMPORT_TEMPLATE = [
  {
    "text": "serendipity",
    "translation": "机缘凑巧; 意外发现珍奇事物的本领",
    "phoneticUs": "/ˌsɛrənˈdɪpɪti/",
    "phoneticUk": "/ˌsɛrənˈdɪpɪti/",
    "partOfSpeech": "n.",
    "englishDefinition": "The occurrence and development of events by chance in a happy or beneficial way.",
    "contextSentence": "It was pure serendipity that we met.",
    "contextSentenceTranslation": "我们相遇纯属机缘巧合。",
    "mixedSentence": "It was pure serendipity (机缘巧合) that we met.",
    "dictionaryExample": "Nature has created wonderful things by serendipity.",
    "dictionaryExampleTranslation": "大自然通过机缘巧合创造了奇妙的事物。",
    "inflections": ["serendipities"],
    "tags": ["CET6", "GRE", "Literary"],
    "importance": 3,
    "cocaRank": 15000,
    "phrases": [
      { "text": "pure serendipity", "trans": "纯属巧合" }
    ],
    "roots": [
      { "root": "serendip", "words": [{ "text": "serendipitous", "trans": "偶然的" }] }
    ],
    "synonyms": [
      { "text": "chance", "trans": "机会" },
      { "text": "fluke", "trans": "侥幸" }
    ],
    "image": "",
    "video": {
        "title": "Explanation Video",
        "url": "https://example.com/video.mp4",
        "cover": "https://example.com/cover.jpg"
    },
    "sourceUrl": "https://en.wikipedia.org/wiki/Serendipity"
  },
  {
    "_说明": "本行仅为字段说明，导入时将被忽略。请确保 JSON格式正确。",
    "text": "【必填】单词拼写",
    "translation": "【建议填写】中文释义",
    "phoneticUs": "选填。美式音标",
    "phoneticUk": "选填。英式音标",
    "partOfSpeech": "选填。词性简写 (n. v. adj. adv. 等)",
    "englishDefinition": "选填。英文定义",
    "contextSentence": "选填。上下文原句 (Source Sentence)",
    "contextSentenceTranslation": "选填。原句中文翻译",
    "mixedSentence": "选填。中英混合例句 (单词替换后的句子)",
    "dictionaryExample": "选填。词典标准例句",
    "dictionaryExampleTranslation": "选填。词典例句翻译",
    "inflections": "选填。字符串数组。单词的变形列表 (如复数、过去式、分词)。例如: ['books', 'booking']",
    "tags": "选填。字符串数组。单词标签 (如考试等级、学科)。例如: ['CET4', 'Computer']",
    "importance": "选填。数字 (0-5)。柯林斯星级 (Collins Stars)，5为最高频。",
    "cocaRank": "选填。数字。COCA 语料库词频排名，数值越小越常用。",
    "phrases": "选填。对象数组。常用短语。格式: [{ 'text': '短语英文', 'trans': '短语中文' }]",
    "roots": "选填。对象数组。词根词缀。格式: [{ 'root': '词根', 'words': [{ 'text': '同根词', 'trans': '释义' }] }]",
    "synonyms": "选填。对象数组。近义词。格式: [{ 'text': '近义词', 'trans': '释义' }]",
    "image": "选填。图片 URL 链接",
    "sourceUrl": "选填。来源 URL (文章链接或视频链接)"
  }
];

// --- 纯净构建模板 (仅结构) ---
const BUILD_TEMPLATE_STRUCTURE = [
  {
    "text": "example",
    "translation": "例子; 榜样",
    "phoneticUs": "/ɪɡˈzæmpl/",
    "phoneticUk": "/ɪɡˈzɑːmpl/",
    "partOfSpeech": "n.",
    "englishDefinition": "A thing characteristic of its kind or illustrating a general rule.",
    "dictionaryExample": "This is a good example.",
    "dictionaryExampleTranslation": "这是一个很好的例子。",
    "inflections": ["examples"],
    "tags": ["Basic"],
    "importance": 5,
    "cocaRank": 100,
    "phrases": [],
    "roots": [],
    "synonyms": [],
    "image": "",
    "sourceUrl": ""
  }
];

interface WordManagerProps {
  scenarios: Scenario[];
  entries: WordEntry[];
  setEntries: React.Dispatch<React.SetStateAction<WordEntry[]>>;
  ttsSpeed?: number;
  initialTab?: WordTab;
  initialSearchQuery?: string;
  onOpenDetail?: (word: string) => void;
}

export const WordManager: React.FC<WordManagerProps> = ({ 
    scenarios, 
    entries, 
    setEntries, 
    ttsSpeed = 1.0,
    initialTab,
    initialSearchQuery,
    onOpenDetail
}) => {
  const [activeTab, setActiveTab] = useState<WordTab>('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());

  // 导入按钮下拉状态
  const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
  const importDropdownRef = useRef<HTMLDivElement>(null);

  // Handle deep linking
  useEffect(() => {
      if (initialTab) setActiveTab(initialTab);
      if (initialSearchQuery !== undefined) setSearchQuery(initialSearchQuery);
  }, [initialTab, initialSearchQuery]);

  // Modal States
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Configs
  const [showConfig, setShowConfig] = useState({
    showPhonetic: true,
    showMeaning: true,
  });
  
  const [mergeConfig, setMergeConfig] = useState<MergeStrategyConfig>(DEFAULT_MERGE_STRATEGY);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // --- 修复：添加缺失的拖拽处理函数 (用于 MergeConfigModal 中的排序) ---
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const newOrder = [...mergeConfig.exampleOrder];
    const draggedItem = newOrder[draggedItemIndex];
    newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setMergeConfig({ ...mergeConfig, exampleOrder: newOrder });
    setDraggedItemIndex(index);
  };
  
  const handleDragEnd = () => {
      setDraggedItemIndex(null);
      // 持久化保存排序后的配置
      localStorage.setItem('context-lingo-merge-config', JSON.stringify(mergeConfig));
  };

  const handleCloseMergeModal = () => {
    setIsMergeModalOpen(false);
    // 关闭弹窗时也执行一次保存，确保所有的显隐设置也被持久化
    localStorage.setItem('context-lingo-merge-config', JSON.stringify(mergeConfig));
  };

  useEffect(() => {
     const savedConfigStr = localStorage.getItem('context-lingo-merge-config');
     if (savedConfigStr) {
         try {
             const saved = JSON.parse(savedConfigStr);
             let needsUpdate = false;
             const requiredItems = [
                 { id: 'inflections', label: '词态变化 (Morphology)' },
                 { id: 'phrases', label: '常用短语 (Phrases)' },
                 { id: 'roots', label: '词根词缀 (Roots)' },
                 { id: 'synonyms', label: '近义词 (Synonyms)' }
             ];
             requiredItems.forEach(req => {
                 if (!saved.exampleOrder.some((item: any) => item.id === req.id)) {
                     saved.exampleOrder.push({ ...req, enabled: true });
                     needsUpdate = true;
                 }
             });
             if (typeof saved.showPartOfSpeech === 'undefined') { saved.showPartOfSpeech = true; needsUpdate = true; }
             if (typeof saved.showTags === 'undefined') { saved.showTags = true; needsUpdate = true; }
             if (typeof saved.showImportance === 'undefined') { saved.showImportance = true; needsUpdate = true; }
             if (typeof saved.showCocaRank === 'undefined') { saved.showCocaRank = true; needsUpdate = true; }
             if (typeof saved.showImage === 'undefined') { saved.showImage = true; needsUpdate = true; }
             if (typeof saved.showVideo === 'undefined') { saved.showVideo = true; needsUpdate = true; }
             if (typeof saved.showExampleTranslation === 'undefined') { saved.showExampleTranslation = true; needsUpdate = true; }
             if (typeof saved.showContextTranslation === 'undefined') { saved.showContextTranslation = true; needsUpdate = true; }
             if (needsUpdate) {
                 localStorage.setItem('context-lingo-merge-config', JSON.stringify(saved));
             }
             setMergeConfig(saved);
         } catch (e) {
             setMergeConfig(DEFAULT_MERGE_STRATEGY);
         }
     } else {
         setMergeConfig(DEFAULT_MERGE_STRATEGY);
         localStorage.setItem('context-lingo-merge-config', JSON.stringify(DEFAULT_MERGE_STRATEGY));
     }
  }, []);

  // 点击外部关闭下拉菜单
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (importDropdownRef.current && !importDropdownRef.current.contains(event.target as Node)) {
              setIsImportDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedWords(new Set());
  }, [activeTab, selectedScenarioId]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      setToast({ id: Date.now(), message, type });
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (activeTab !== 'all' && e.category !== activeTab) return false;
      if (selectedScenarioId !== 'all' && e.scenarioId !== selectedScenarioId) return false;
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        const matchText = e.text.toLowerCase().includes(lowerQ);
        const matchTrans = e.translation?.toLowerCase().includes(lowerQ) || false;
        if (!matchText && !matchTrans) return false;
      }
      return true; 
    });
  }, [entries, activeTab, selectedScenarioId, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: Record<string, WordEntry[]> = {};
    filteredEntries.forEach(entry => {
      let key = entry.text.toLowerCase().trim();
      if (mergeConfig.strategy === 'by_word_and_meaning') {
        key = `${key}::${entry.translation?.trim()}`;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(entry);
    });
    return Object.values(groups).map(group => group.sort((a, b) => b.addedAt - a.addedAt))
                 .sort((a, b) => b[0].addedAt - a[0].addedAt);
  }, [filteredEntries, mergeConfig.strategy]);

  const allVisibleIds = useMemo(() => filteredEntries.map(e => e.id), [filteredEntries]);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedWords.has(id));
  const isAllWordsTab = activeTab === 'all';

  const toggleSelectAll = () => {
    if (allSelected) {
      const newSet = new Set(selectedWords);
      allVisibleIds.forEach(id => newSet.delete(id));
      setSelectedWords(newSet);
    } else {
      const newSet = new Set(selectedWords);
      allVisibleIds.forEach(id => newSet.add(id));
      setSelectedWords(newSet);
    }
  };

  const toggleSelectGroup = (group: WordEntry[]) => {
    const newSet = new Set(selectedWords);
    const isGroupSelected = group.every(id => newSet.has(id.id));
    group.forEach(id => isGroupSelected ? newSet.delete(id.id) : newSet.add(id.id));
    setSelectedWords(newSet);
  };

  const isGroupSelected = (group: WordEntry[]) => group.every(e => selectedWords.has(e.id));

  const handleDeleteSelected = () => {
    if (selectedWords.size === 0) return;
    if (confirm(`确定从当前列表删除选中的 ${selectedWords.size} 个单词吗？`)) {
      setEntries(prev => prev.filter(e => !selectedWords.has(e.id)));
      setSelectedWords(new Set());
      showToast('删除成功', 'success');
    }
  };

  const handleBatchMove = (targetCategory: WordCategory) => {
      if (selectedWords.size === 0) return;
      setEntries(entries.map(e => selectedWords.has(e.id) ? { ...e, category: targetCategory } : e));
      setSelectedWords(new Set());
      showToast('移动成功', 'success');
  };

  const handleExport = () => {
     const dataToExport = selectedWords.size > 0 ? entries.filter(e => selectedWords.has(e.id)) : filteredEntries;
     if (dataToExport.length === 0) { showToast('当前列表为空，无法导出', 'warning'); return; }
     const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `contextlingo_export_${Date.now()}.json`;
     a.click();
     URL.revokeObjectURL(url);
     showToast(`成功导出 ${dataToExport.length} 个单词`, 'success');
  };

  // --- 模板下载函数 ---
  const downloadJson = (data: any, filename: string) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('文件已下载', 'success');
  };

  const handleDownloadTemplate = () => downloadJson(IMPORT_TEMPLATE, 'reword_import_template_full.json');
  const handleBuildTemplate = () => downloadJson(BUILD_TEMPLATE_STRUCTURE, 'reword_empty_structure.json');

  const triggerImport = () => {
     setIsImportDropdownOpen(false);
     if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = async (event) => {
        try {
           const candidates = JSON.parse(event.target?.result as string);
           const targetCategory = activeTab === 'all' ? WordCategory.WantToLearnWord : activeTab;
           const newEntriesToAdd: WordEntry[] = [];
           candidates.forEach((c: any) => {
               if (!c.text || c.text.includes('必填')) return;
               const isDup = entries.some(e => e.text.toLowerCase() === c.text.toLowerCase() && e.translation === c.translation);
               if (!isDup) newEntriesToAdd.push({
                   id: `import-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                   addedAt: Date.now(),
                   category: targetCategory,
                   scenarioId: selectedScenarioId === 'all' ? '1' : selectedScenarioId,
                   ...c
               });
           });
           if (newEntriesToAdd.length > 0) {
               setEntries(prev => [...prev, ...newEntriesToAdd]);
               showToast(`成功导入 ${newEntriesToAdd.length} 个单词`, 'success');
           } else showToast('没有新单词被导入 (可能已存在)', 'warning');
        } catch (err) { showToast("解析失败，请检查文件格式", "error"); }
     };
     reader.readAsText(file);
     e.target.value = ''; 
  };

  const handleAddWord = async (entryData: Partial<WordEntry>) => {
      const isDup = entries.some(e => e.text.toLowerCase() === entryData.text?.toLowerCase() && e.translation === entryData.translation);
      if (isDup) { showToast(`"${entryData.text}" 已存在`, 'warning'); return; }
      const newEntry: WordEntry = {
          id: `manual-${Date.now()}`,
          addedAt: Date.now(),
          scenarioId: selectedScenarioId === 'all' ? '1' : selectedScenarioId,
          category: activeTab === 'all' ? WordCategory.WantToLearnWord : activeTab,
          text: entryData.text!,
          ...entryData
      } as WordEntry;
      setEntries(prev => [newEntry, ...prev]);
      showToast('添加成功', 'success');
  };

  const getTabLabel = (tab: WordTab) => tab === 'all' ? '所有单词' : tab;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col relative min-h-[600px]">
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="border-b border-slate-200 px-6 py-5 bg-slate-50 rounded-t-xl flex justify-between items-center flex-wrap gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">词汇库管理</h2>
           <p className="text-sm text-slate-500 mt-1">管理、筛选及编辑您的个性化词库</p>
        </div>
        <button onClick={() => setIsMergeModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm shadow-blue-200">
          <Settings2 className="w-4 h-4 mr-2" /> 显示配置
        </button>
      </div>
      
      <AddWordModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddWord} initialCategory={activeTab === 'all' ? WordCategory.WantToLearnWord : activeTab} />
      <MergeConfigModal isOpen={isMergeModalOpen} onClose={handleCloseMergeModal} mergeConfig={mergeConfig} setMergeConfig={setMergeConfig} showConfig={showConfig} setShowConfig={setShowConfig} handleDragStart={handleDragStart} handleDragOver={handleDragOver} handleDragEnd={handleDragEnd} draggedItemIndex={draggedItemIndex} />

      <div className="border-b border-slate-200 bg-white p-4 space-y-4">
        <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          {(['all', ...Object.values(WordCategory)] as WordTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all flex items-center ${activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}>
              {tab === 'all' && <List className="w-4 h-4 mr-2" />}
              {getTabLabel(tab)}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
           <div className="flex items-center gap-4 flex-1">
              <button onClick={toggleSelectAll} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 select-none">
                {allSelected ? <CheckSquare className="w-5 h-5 mr-2 text-blue-600"/> : <Square className="w-5 h-5 mr-2 text-slate-400"/>}
                全选
              </button>
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select value={selectedScenarioId} onChange={(e) => setSelectedScenarioId(e.target.value)} className="text-sm border-none bg-transparent focus:ring-0 text-slate-700 font-medium cursor-pointer">
                    <option value="all">所有场景</option>
                    {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
              </div>
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 flex-1 max-w-xs">
                 <Search className="w-4 h-4 text-slate-400" />
                 <input type="text" placeholder="搜索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-sm border-none bg-transparent focus:ring-0" />
              </div>
           </div>

           <div className="flex gap-2 items-center">
              {selectedWords.size > 0 ? (
                 <>
                    <button onClick={handleExport} className="flex items-center px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        <Download className="w-4 h-4 mr-2" /> 导出 ({selectedWords.size})
                    </button>
                    <button onClick={handleDeleteSelected} className="flex items-center px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition">
                        <Trash2 className="w-4 h-4 mr-2" /> 删除
                    </button>
                 </>
              ) : (
                  <>
                    {!isAllWordsTab && (
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition">
                            <Plus className="w-4 h-4 mr-2" /> 新增
                        </button>
                    )}

                    {/* --- 组合下拉导入按钮 --- */}
                    <div className="relative flex items-center" ref={importDropdownRef}>
                        <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden divide-x divide-slate-200 group">
                            <button 
                                onClick={triggerImport}
                                className="flex items-center px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 transition active:bg-blue-100"
                            >
                                <Upload className="w-4 h-4 mr-2" /> 导入单词
                            </button>
                            <button 
                                onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                                className={`px-2 hover:bg-slate-50 transition flex items-center justify-center ${isImportDropdownOpen ? 'bg-slate-100' : ''}`}
                            >
                                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* 下拉菜单 */}
                        {isImportDropdownOpen && (
                            <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1.5 space-y-1">
                                    <button 
                                        onClick={handleDownloadTemplate}
                                        className="w-full flex items-center px-3 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition group"
                                    >
                                        <FileDown className="w-4 h-4 mr-3 text-slate-400 group-hover:text-blue-500" />
                                        <span>下载标准模板</span>
                                    </button>
                                    <button 
                                        onClick={handleBuildTemplate}
                                        className="w-full flex items-center px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition group"
                                    >
                                        <FileText className="w-4 h-4 mr-3 text-slate-400 group-hover:text-indigo-500" />
                                        <span>构建导入模板</span>
                                    </button>
                                    <div className="h-px bg-slate-100 mx-2 my-1"></div>
                                    <div className="px-3 py-2">
                                        <p className="text-[10px] text-slate-400 leading-relaxed italic">提示：将模板发给 AI (如 GPT) 可快速生成词库数据。</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {isAllWordsTab && (
                        <button onClick={handleExport} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                            <Download className="w-4 h-4 mr-2" /> 导出
                        </button>
                    )}
                  </>
              )}
           </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 space-y-4 flex-1">
        <WordList groupedEntries={groupedEntries} selectedWords={selectedWords} toggleSelectGroup={toggleSelectGroup} isGroupSelected={isGroupSelected} showConfig={showConfig} mergeConfig={mergeConfig} isAllWordsTab={isAllWordsTab} searchQuery={searchQuery} ttsSpeed={ttsSpeed} onOpenDetail={onOpenDetail} />
      </div>
    </div>
  );
};
