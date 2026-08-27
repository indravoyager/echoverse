import { useState, useRef, useEffect } from 'react';
import { Settings2, Download, Image as ImageIcon, Plus, Trash2, CheckCircle2, RotateCcw, QrCode, UploadCloud, ChevronDown, ChevronRight, Check, Banknote, ChevronUp, Calendar, Mail, Globe, Phone, FileArchive, DownloadCloud, Wand2, Leaf, Cpu, ArrowLeft } from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import { clsx } from 'clsx';
import { SegmentedControl } from '../theme/SegmentedControl';
import * as htmlToImage from 'html-to-image';
import { usePersistedState } from '../theme/usePersistedState';

// Custom Date Picker adapted from exam aturai
const CustomDatePicker = ({ value, onChange, persona }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      return new Date(y, m - 1, d);
    }
    return new Date();
  });
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handleDayClick = (day) => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onChange(`${y}-${m}-${dStr}`);
    setIsOpen(false);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const displayValue = value ? value.split('-').reverse().join('/') : "Select Date";
  const [sYear, sMonth, sDay] = value ? value.split('-').map(Number) : [null, null, null];
  const today = new Date();
  const getTodayString = () => new Date().toLocaleDateString('en-CA');

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between px-3 cursor-pointer transition-colors bg-slate-50 dark:bg-white/5 outline-none"
        style={{ borderColor: isOpen ? persona.theme.primary : undefined }}
        tabIndex={0}
      >
        <span className={clsx("text-sm font-medium", isOpen ? "text-[var(--color-primary)]" : "text-slate-700 dark:text-slate-300")} style={{ '--color-primary': persona.theme.primary }}>
          {displayValue}
        </span>
        <Calendar size={14} className={isOpen ? "text-[var(--color-primary)]" : "text-slate-500"} style={{ '--color-primary': persona.theme.primary }} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 z-[70] mt-1 p-4 rounded-xl border bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-100" style={{ width: '260px' }}>
          <div className="flex justify-between items-center mb-4">
            <button onClick={(e) => { e.preventDefault(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)); }} className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            <span className="font-bold text-sm text-slate-800 dark:text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button onClick={(e) => { e.preventDefault(); setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)); }} className="p-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300">
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = sYear === currentDate.getFullYear() && sMonth === currentDate.getMonth() + 1 && sDay === day;
              const isToday = today.getDate() === day && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();

              return (
                <button
                  key={day}
                  onClick={(e) => { e.preventDefault(); handleDayClick(day); }}
                  className={clsx(
                    "w-7 h-7 flex items-center justify-center text-xs font-medium rounded-full transition-all",
                    isSelected
                      ? "text-white  font-bold scale-105"
                      : isToday
                        ? "bg-[var(--color-primary-10)] text-[var(--color-primary)] font-bold border border-[var(--color-primary-30)]"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                  )}
                  style={{
                    backgroundColor: isSelected ? persona.theme.primary : undefined,
                    '--color-primary': persona.theme.primary,
                    '--color-primary-10': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
                    '--color-primary-30': `color-mix(in srgb, ${persona.theme.primary} 30%, transparent)`
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-4 pt-3 border-t border-slate-200 dark:border-white/10">
            <button onClick={(e) => { e.preventDefault(); onChange(''); setIsOpen(false); }} className="text-xs font-bold transition-colors text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">Clear</button>
            <button onClick={(e) => { e.preventDefault(); onChange(getTodayString()); setIsOpen(false); setCurrentDate(new Date()); }} className="text-xs font-bold transition-colors text-[var(--color-primary)] hover:opacity-80" style={{ '--color-primary': persona.theme.primary }}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Custom Social Icons since newer lucide-react removed them
const InstagramIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);
const FacebookIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);
const TwitterIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
);

const getContrastYIQ = (hexcolor) => {
  if (!hexcolor) return 'light';
  hexcolor = hexcolor.replace("#", "");
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(x => x + x).join('');
  }
  if (hexcolor.length !== 6) return 'light';
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 160) ? 'dark' : 'light';
};

const getSafeDarkColor = (hexcolor) => {
  return getContrastYIQ(hexcolor) === 'dark' ? `color-mix(in srgb, ${hexcolor} 40%, black)` : hexcolor;
};

export default function InvoiceMakerApp({ persona, onOpenSidebar, onOpenPersonaInfo }) {
  const [invoiceState, setInvoiceState] = usePersistedState('invoiceMakerData', {
    invoiceNo: 'INV-001',
    date: new Date().toISOString().split('T')[0],
    clientName: '@ArtCollector',
    currency: 'Rp',
    language: 'ID',
    enableEstimation: false,
    estimationValue: '3',
    estimationUnit: 'Days',
    items: [
      { id: 1, desc: 'Commission - Full Body Character', qty: 1, price: 350000 },
      { id: 2, desc: 'Commercial Use License', qty: 1, price: 150000 }
    ],
    senderName: 'Ivynescia',
    contacts: [
      { id: 1, type: 'instagram', value: '@ivynescia' },
      { id: 2, type: 'mail', value: 'ivyxxx@gmail.com' }
    ],
    senderAvatar: null,
    invoiceColor: persona.theme.primary,
    qrCode: null,
    paymentMethods: [
      { id: 1, bank: 'BCA', details: '839xxx a.n Ivynescia' }
    ]
  });
  const { invoiceNo, date, clientName, currency, language, enableEstimation, estimationValue, estimationUnit, items, senderName, contacts, senderAvatar, invoiceColor, qrCode, paymentMethods } = invoiceState;

  const setInvoiceNo = (val) => setInvoiceState(prev => ({ ...prev, invoiceNo: typeof val === 'function' ? val(prev.invoiceNo) : val }));
  const setDate = (val) => setInvoiceState(prev => ({ ...prev, date: typeof val === 'function' ? val(prev.date) : val }));
  const setClientName = (val) => setInvoiceState(prev => ({ ...prev, clientName: typeof val === 'function' ? val(prev.clientName) : val }));
  const setCurrency = (val) => setInvoiceState(prev => ({ ...prev, currency: typeof val === 'function' ? val(prev.currency) : val }));
  const setLanguage = (val) => setInvoiceState(prev => ({ ...prev, language: typeof val === 'function' ? val(prev.language) : val }));
  const setEnableEstimation = (val) => setInvoiceState(prev => ({ ...prev, enableEstimation: typeof val === 'function' ? val(prev.enableEstimation) : val }));
  const setEstimationValue = (val) => setInvoiceState(prev => ({ ...prev, estimationValue: typeof val === 'function' ? val(prev.estimationValue) : val }));
  const setEstimationUnit = (val) => setInvoiceState(prev => ({ ...prev, estimationUnit: typeof val === 'function' ? val(prev.estimationUnit) : val }));
  const setItems = (val) => setInvoiceState(prev => ({ ...prev, items: typeof val === 'function' ? val(prev.items) : val }));
  const setSenderName = (val) => setInvoiceState(prev => ({ ...prev, senderName: typeof val === 'function' ? val(prev.senderName) : val }));
  const setContacts = (val) => setInvoiceState(prev => ({ ...prev, contacts: typeof val === 'function' ? val(prev.contacts) : val }));
  const setSenderAvatar = (val) => setInvoiceState(prev => ({ ...prev, senderAvatar: typeof val === 'function' ? val(prev.senderAvatar) : val }));
  const setInvoiceColor = (val) => setInvoiceState(prev => ({ ...prev, invoiceColor: typeof val === 'function' ? val(prev.invoiceColor) : val }));
  const setQrCode = (val) => setInvoiceState(prev => ({ ...prev, qrCode: typeof val === 'function' ? val(prev.qrCode) : val }));
  const setPaymentMethods = (val) => setInvoiceState(prev => ({ ...prev, paymentMethods: typeof val === 'function' ? val(prev.paymentMethods) : val }));

  const [isEstimationUnitOpen, setIsEstimationUnitOpen] = useState(false);
  const [openContactDropdownId, setOpenContactDropdownId] = useState(null);
  const contactTypeOptions = [
    { value: 'mail', label: 'Email' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'X / Twitter' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'phone', label: 'WhatsApp' },
    { value: 'globe', label: 'Website' }
  ];
  const [hexInput, setHexInput] = useState(invoiceColor.replace('#', ''));
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const palette = ['#e11d48', '#000000'];

  useEffect(() => {
    setHexInput(invoiceColor.replace('#', ''));
  }, [invoiceColor]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  const [activeTab, setActiveTab] = useState('DETAILS');
  const tabs = ['DETAILS', 'BRAND', 'ITEMS', 'PAYMENT'];

  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const currencyOptions = [
    { value: 'Rp', label: 'IDR' },
    { value: '$', label: 'USD' },
    { value: '€', label: 'EUR' },
    { value: 'RM', label: 'MYR' },
  ];

  const [openPaymentDropdownId, setOpenPaymentDropdownId] = useState(null);
  const paymentBankOptions = [
    { value: 'BCA', label: 'BCA' },
    { value: 'Mandiri', label: 'Mandiri' },
    { value: 'BNI', label: 'BNI' },
    { value: 'BRI', label: 'BRI' },
    { value: 'BSI', label: 'BSI' },
    { value: 'GoPay', label: 'GoPay' },
    { value: 'OVO', label: 'OVO' },
    { value: 'DANA', label: 'DANA' },
    { value: 'ShopeePay', label: 'ShopeePay' },
    { value: 'Lainnya', label: 'Other' },
  ];

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSuccess, setGeneratedSuccess] = useState(false);
  const invoiceRef = useRef(null);

  const avatarInputRef = useRef(null);
  const qrInputRef = useRef(null);

  const [isDraggingPreset, setIsDraggingPreset] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [isDraggingQr, setIsDraggingQr] = useState(false);

  useEffect(() => {
    if (generatedSuccess) {
      const timer = setTimeout(() => setGeneratedSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [generatedSuccess]);

  const handleReset = () => {
    setInvoiceNo('INV-001');
    setDate(new Date().toISOString().split('T')[0]);
    setClientName('');
    setCurrency('Rp');
    setLanguage('ID');
    setEnableEstimation(false);
    setEstimationValue('3');
    setEstimationUnit('Days');
    setItems([{ id: Date.now(), desc: '', qty: 1, price: 0 }]);
    setSenderName('');
    setContacts([{ id: Date.now(), type: 'mail', value: '' }]);
    setSenderAvatar(null);
    setQrCode(null);
    setPaymentMethods([]);
  };

  const handleLoadExamples = () => {
    setInvoiceNo('INV-001');
    setDate(new Date().toISOString().split('T')[0]);
    setClientName('@ArtCollector');
    setCurrency('Rp');
    setLanguage('ID');
    setEnableEstimation(false);
    setEstimationValue('3');
    setEstimationUnit('Days');
    setItems([
      { id: Date.now(), desc: 'Commission - Full Body Character', qty: 1, price: 350000 },
      { id: Date.now() + 1, desc: 'Commercial Use License', qty: 1, price: 150000 }
    ]);
    setSenderName('Ivynescia');
    setContacts([
      { id: Date.now(), type: 'instagram', value: '@ivynescia' },
      { id: Date.now() + 1, type: 'mail', value: 'ivyxxx@gmail.com' }
    ]);
    setSenderAvatar(null);
    setQrCode(null);
    setPaymentMethods([{ id: Date.now(), bank: 'BCA', details: '839xxx a.n Ivynescia' }]);
  };

  const handleImageUpload = (e, setter) => {
    const file = e.target?.files ? e.target.files[0] : e;
    if (file && file.type?.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 512;
          
          // Crop to square (center crop)
          const size = Math.min(img.width, img.height);
          const startX = (img.width - size) / 2;
          const startY = (img.height - size) / 2;
          
          // Scale down if larger than MAX_SIZE
          const finalSize = Math.min(size, MAX_SIZE);
          
          canvas.width = finalSize;
          canvas.height = finalSize;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(img, startX, startY, size, size, 0, 0, finalSize, finalSize);
          
          // Compress to WEBP
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.8);
          setter(compressedDataUrl);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = ''; // Reset input to allow re-uploading the same file
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), desc: '', qty: 1, price: 0 }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addContact = () => {
    setContacts([...contacts, { id: Date.now(), type: 'mail', value: '' }]);
  };

  const updateContact = (id, field, value) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { id: Date.now(), bank: 'BCA', details: '' }]);
  };

  const updatePaymentMethod = (id, field, value) => {
    setPaymentMethods(paymentMethods.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePaymentMethod = (id) => {
    setPaymentMethods(paymentMethods.filter(p => p.id !== id));
  };

  const getContactIcon = (type, size = 12) => {
    switch (type) {
      case 'instagram': return <InstagramIcon size={size} />;
      case 'twitter': return <TwitterIcon size={size} />;
      case 'facebook': return <FacebookIcon size={size} />;
      case 'phone': return <Phone size={size} />;
      case 'globe': return <Globe size={size} />;
      case 'mail': default: return <Mail size={size} />;
    }
  };

  const presetInputRef = useRef(null);

  const handleExportPreset = () => {
    const presetData = {
      senderName,
      contacts,
      senderAvatar,
      qrCode,
      paymentMethods,
      invoiceColor,
      language
    };

    const blob = new Blob([JSON.stringify(presetData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const safeSenderName = senderName ? senderName.replace(/\s+/g, '_') : 'Sender';
    a.download = `Invpreset_${safeSenderName}_${formattedDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPreset = (e) => {
    const file = e.target?.files ? e.target.files[0] : e;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.senderName !== undefined) setSenderName(data.senderName);
        if (data.contacts !== undefined) setContacts(data.contacts);
        if (data.senderAvatar !== undefined) setSenderAvatar(data.senderAvatar);
        if (data.qrCode !== undefined) setQrCode(data.qrCode);
        if (data.paymentMethods !== undefined) setPaymentMethods(data.paymentMethods);
        if (data.invoiceColor !== undefined) setInvoiceColor(data.invoiceColor);
        if (data.language !== undefined) setLanguage(data.language);
      } catch (err) {
        console.error('Failed to parse preset JSON', err);
        alert('Invalid preset file. Pastikan file JSON yang diunggah benar.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Reset input
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.price) || 0), 0);

  const generateAndDownload = async () => {
    if (!invoiceRef.current) return;
    setIsGenerating(true);
    setGeneratedSuccess(false);

    try {
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await htmlToImage.toPng(invoiceRef.current, {
        quality: 1.0,
        pixelRatio: 2, // High resolution
        backgroundColor: '#ffffff' // Ensure base background is white behind the invoice color
      });

      // Convert Data URL to Blob to prevent browser limitations on large data URLs
      const fetchResponse = await fetch(dataUrl);
      const blob = await fetchResponse.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      const formattedDate = date ? date.replace(/-/g, '') : '';
      const safeSenderName = senderName ? senderName.replace(/\s+/g, '_') : 'Sender';
      link.download = `Inv_${safeSenderName}_${formattedDate}.png`;
      link.href = blobUrl;
      
      // Append to body to ensure it works across all browsers (like Firefox)
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL to avoid memory leaks
      URL.revokeObjectURL(blobUrl);

      setGeneratedSuccess(true);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Failed to generate invoice image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-transparent relative overflow-hidden">
      {/* Minimal Background Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-slate-50/30 dark:bg-[#0a0a0a]/30" />

      {/* Header Utama */}
      <div className="h-[60px] px-6 md:px-8 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md shrink-0 z-20 relative w-full overflow-hidden">
        <div className="flex items-center space-x-3 md:space-x-4 shrink-0 min-w-0 pr-4">
          <button onClick={onOpenSidebar} className="sm:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <img
            src={persona.avatar}
            alt={persona.name}
            onClick={onOpenPersonaInfo}
            className="w-9 h-9 rounded-full border bg-white dark:bg-[#030303] object-cover scale-110 shrink-0 cursor-pointer hover:scale-125 transition-transform"
            style={{
              borderColor: `color-mix(in srgb, ${persona.theme.primary} 50%, transparent)`
            }}
          />
          <div className="min-w-0 cursor-pointer" onClick={onOpenPersonaInfo}>
            <h2 className="font-medium text-slate-800 dark:text-white text-lg flex items-center gap-1.5 min-w-0">
              <span className="truncate">{persona.name}</span>
              {persona.isOnDevice && <Leaf size={16} className="text-green-500 fill-green-500/20 shrink-0" />}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              <span className="-translate-y-[1px]">On-Device</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadExamples}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
            style={{
              '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
              '--btn-hover-text': persona.theme.primary
            }}
            title="Load Examples"
          >
            <Wand2 size={18} />
            <span className="hidden md:inline">Examples</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 font-semibold text-[13px] transition-colors hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
            style={{
              '--btn-hover-bg': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`,
              '--btn-hover-text': persona.theme.primary
            }}
            title="Clear All"
          >
            <RotateCcw size={18} />
            <span className="hidden md:inline">Clear All</span>
          </button>
        </div>
      </div>

      {/* Main Layout Workspace Wrapper */}
      <div className="flex-1 overflow-y-auto relative z-10 w-full p-4 sm:p-6 custom-scrollbar">
        <div className="flex flex-col lg:flex-row gap-6 w-full min-h-full">

          {/* Settings Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 lg:h-full lg:overflow-y-auto custom-scrollbar lg:pr-2 lg:-mr-2 pb-2">

            {/* Preset Data */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <FileArchive className="w-4 h-4 text-slate-400" />
                  Preset Data
                </h3>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <label
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingPreset(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingPreset(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPreset(false);
                      if (e.dataTransfer?.files?.length > 0) handleImportPreset(e.dataTransfer.files[0]);
                    }}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 h-9 border border-dashed rounded-lg transition-colors cursor-pointer",
                      isDraggingPreset ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                    )}
                    style={{ '--color-primary': persona.theme.primary }}
                  >
                    <input type="file" ref={presetInputRef} onChange={handleImportPreset} className="hidden" accept=".json,application/json" />
                    <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      {isDraggingPreset ? 'Drop Preset!' : 'Upload Preset'}
                    </span>
                  </label>
                  <button
                    onClick={handleExportPreset}
                    className="flex-1 flex items-center justify-center gap-2 h-9 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <DownloadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                    <span className="text-xs font-bold text-slate-500">
                      Download Preset
                    </span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 pl-1 mt-1.5">Upload/Download brand & bank information (.json).</p>
              </div>
            </div>

            {/* Configuration Box */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col relative z-20">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0 rounded-t-xl">
                <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Settings2 className="w-4 h-4" />
                  Configuration
                </h3>
              </div>

              <div className="p-4 flex flex-col gap-5">
                <SegmentedControl
                  value={activeTab}
                  onChange={setActiveTab}
                  options={tabs.map(opt => ({ value: opt, label: opt }))}
                />

                {/* Tab Content */}
                <div className="relative transition-all duration-300">
                  {activeTab === 'DETAILS' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Invoice No.</label>
                          <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors" style={{ '--color-primary': persona.theme.primary }} />
                        </div>
                        <div className="relative z-[60]">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date</label>
                          <CustomDatePicker value={date} onChange={setDate} persona={persona} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Client Name</label>
                          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="@Client" className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors" style={{ '--color-primary': persona.theme.primary }} />
                        </div>
                        <div className="relative z-50">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Currency</label>
                          <div
                            className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between px-3 cursor-pointer transition-colors outline-none bg-slate-50 dark:bg-white/5"
                            style={{
                              borderColor: isCurrencyDropdownOpen ? persona.theme.primary : undefined
                            }}
                            tabIndex={0}
                            onBlur={() => setTimeout(() => setIsCurrencyDropdownOpen(false), 150)}
                            onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                          >
                            <div className="flex items-center gap-2">
                              <Banknote size={14} className={isCurrencyDropdownOpen ? "text-[var(--color-primary)]" : "text-slate-500"} style={{ '--color-primary': persona.theme.primary }} />
                              <span className={clsx("text-sm font-medium", isCurrencyDropdownOpen ? "text-[var(--color-primary)]" : "text-slate-700 dark:text-slate-300")} style={{ '--color-primary': persona.theme.primary }}>
                                {currencyOptions.find(o => o.value === currency)?.label}
                              </span>
                            </div>
                            {isCurrencyDropdownOpen ? <ChevronUp size={14} className="text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }} /> : <ChevronDown size={14} className="text-slate-400" />}
                          </div>

                          {/* Dropdown Menu */}
                          {isCurrencyDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                              {currencyOptions.map(opt => (
                                <div
                                  key={opt.value}
                                  onClick={() => { setCurrency(opt.value); setIsCurrencyDropdownOpen(false); }}
                                  className={clsx(
                                    "flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                                    currency === opt.value
                                      ? "bg-[var(--color-primary-10)] text-[var(--color-primary)]"
                                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                  )}
                                  style={{
                                    '--color-primary': persona.theme.primary,
                                    '--color-primary-10': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`
                                  }}
                                >
                                  <Banknote size={14} className={currency === opt.value ? "text-[var(--color-primary)]" : "text-slate-400"} style={{ '--color-primary': persona.theme.primary }} />
                                  {opt.label}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Language Selection */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Language</label>
                        <SegmentedControl
                          value={language}
                          onChange={setLanguage}
                          options={[
                            { value: 'ID', label: 'Indonesian' },
                            { value: 'EN', label: 'English' }
                          ]}
                        />
                      </div>

                      <div className="w-full h-px bg-slate-200 dark:bg-white/10" />

                      {/* Estimation Toggle */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Estimation (Optional)</label>
                          <button 
                            onClick={() => setEnableEstimation(!enableEstimation)}
                            className={clsx(
                              "shrink-0 w-9 h-5 rounded-full p-[2px] border-2 transition-colors duration-300 flex items-center",
                              enableEstimation ? "border-[var(--color-primary)]" : "border-slate-400 dark:border-slate-500"
                            )}
                            style={enableEstimation ? { '--color-primary': persona.theme.primary } : {}}
                          >
                            <div 
                              className={clsx(
                                "w-3 h-3 rounded-full transition-transform duration-300",
                                enableEstimation ? "bg-[var(--color-primary)] translate-x-4" : "bg-slate-400 dark:bg-slate-500 translate-x-0"
                              )}
                            />
                          </button>
                        </div>
                        
                        {enableEstimation && (
                          <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-300 mt-2">
                            <input 
                              type="number" 
                              value={estimationValue}
                              onChange={e => setEstimationValue(e.target.value)}
                              className="w-16 h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              style={{ '--color-primary': persona.theme.primary }}
                            />
                            <div className="relative flex-1">
                              <div
                                className="w-full h-9 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-between px-3 cursor-pointer transition-colors outline-none bg-slate-50 dark:bg-white/5"
                                style={{ borderColor: isEstimationUnitOpen ? persona.theme.primary : undefined }}
                                tabIndex={0}
                                onBlur={() => setTimeout(() => setIsEstimationUnitOpen(false), 150)}
                                onClick={() => setIsEstimationUnitOpen(!isEstimationUnitOpen)}
                              >
                                <span className={clsx("text-sm font-medium", isEstimationUnitOpen ? "text-[var(--color-primary)]" : "text-slate-700 dark:text-slate-300")} style={{ '--color-primary': persona.theme.primary }}>
                                  {estimationUnit === 'Days' ? (language === 'ID' ? 'Hari' : 'Days') : estimationUnit === 'Weeks' ? (language === 'ID' ? 'Minggu' : 'Weeks') : (language === 'ID' ? 'Bulan' : 'Months')}
                                </span>
                                {isEstimationUnitOpen ? <ChevronUp size={14} className="text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }} /> : <ChevronDown size={14} className="text-slate-400" />}
                              </div>
                              {isEstimationUnitOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                  {['Days', 'Weeks', 'Months'].map(opt => (
                                    <div
                                      key={opt}
                                      onClick={() => { setEstimationUnit(opt); setIsEstimationUnitOpen(false); }}
                                      className={clsx(
                                        "flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                                        estimationUnit === opt
                                          ? "bg-[var(--color-primary-10)] text-[var(--color-primary)]"
                                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                      )}
                                      style={{
                                        '--color-primary': persona.theme.primary,
                                        '--color-primary-10': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`
                                      }}
                                    >
                                      {opt === 'Days' ? (language === 'ID' ? 'Hari' : 'Days') : opt === 'Weeks' ? (language === 'ID' ? 'Minggu' : 'Weeks') : (language === 'ID' ? 'Bulan' : 'Months')}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'BRAND' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300">

                      <div className="grid grid-cols-2 gap-4">
                        {/* Left Column: Logo/Foto Profil */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Logo / Avatar</label>
                          <div
                            onClick={() => avatarInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingAvatar(false); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingAvatar(false);
                              if (e.dataTransfer?.files?.length > 0) handleImageUpload(e.dataTransfer.files[0], setSenderAvatar);
                            }}
                            className={clsx(
                              "w-full h-9 border border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer relative overflow-hidden",
                              isDraggingAvatar ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                            )}
                            style={{ '--color-primary': persona.theme.primary }}
                          >
                            {isDraggingAvatar ? (
                              <span className="text-xs font-bold text-[var(--color-primary)] relative z-10">Drop Image!</span>
                            ) : senderAvatar ? (
                              <span className="text-xs font-bold text-slate-500 relative z-10">Replace Image</span>
                            ) : (
                              <>
                                <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                                <span className="text-xs font-bold text-slate-500 relative z-10">Upload Image</span>
                              </>
                            )}
                            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setSenderAvatar)} />
                          </div>
                        </div>

                        {/* Right Column: Nama Pengirim */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sender Name</label>
                          <input type="text" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Nama / Studio" className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors" style={{ '--color-primary': persona.theme.primary }} />
                        </div>
                      </div>

                      {/* Bottom Row: Warna Tema */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Theme Color</label>
                        <div className="flex gap-5 items-center">
                          <div className="flex gap-2 items-center flex-wrap">
                            {palette.map(c => (
                              <button
                                key={c}
                                onClick={() => setInvoiceColor(c)}
                                className={clsx("w-8 h-8 rounded-full  border-2 transition-transform hover:scale-110 flex items-center justify-center overflow-hidden")}
                                style={{ backgroundColor: c, borderColor: invoiceColor.toLowerCase() === c.toLowerCase() ? persona.theme.primary : 'transparent' }}
                                title={c}
                              >
                                <div className="w-full h-full rounded-full border border-black/5 dark:border-white/10"></div>
                              </button>
                            ))}
                          </div>

                          {/* Hex Input Field */}
                          <div className="flex items-center gap-3 w-48 relative">
                            <div className="relative" ref={pickerRef}>
                              <button
                                onClick={() => setShowPicker(!showPicker)}
                                className="w-9 h-9 rounded-lg  border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer hover:scale-105 transition-transform focus:outline-none focus:ring-2"
                                style={{ backgroundColor: invoiceColor, "--tw-ring-color": persona.theme.primary }}
                              />

                              {/* Modern Color Picker Popover */}
                              {showPicker && (
                                <div className="absolute bottom-12 left-0 z-50 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10  animate-[scaleInPop_0.2s_ease-out_forwards] origin-bottom-left">
                                  <HexColorPicker
                                    color={invoiceColor}
                                    onChange={c => { setInvoiceColor(c); setHexInput(c.replace('#', '')); }}
                                  />
                                </div>
                              )}
                            </div>

                            <div
                              className="flex-1 flex items-center h-9 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:border-[var(--tw-ring-color)]"
                              style={{ "--tw-ring-color": persona.theme.primary }}
                            >
                              <span className="pl-3 pr-1 text-slate-400 font-bold text-xs">#</span>
                              <input
                                type="text"
                                value={hexInput}
                                onChange={e => {
                                  const val = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                  setHexInput(val);
                                  if (val.length === 6 || val.length === 3) {
                                    setInvoiceColor(`#${val}`);
                                  }
                                }}
                                onBlur={() => setHexInput(invoiceColor.replace('#', ''))}
                                className="w-full h-full bg-transparent text-xs font-mono font-medium text-slate-700 dark:text-slate-300 outline-none uppercase"
                                placeholder="FFFFFF"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Contacts & Social Media</label>
                        <div className="flex flex-col gap-2">
                          {contacts.map((contact, idx) => (
                            <div key={contact.id} className="flex gap-2 items-center">
                              <div className="relative shrink-0">
                                <div
                                  className="h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md pl-2 pr-6 flex items-center justify-between cursor-pointer outline-none w-[100px]"
                                  style={{ borderColor: openContactDropdownId === contact.id ? persona.theme.primary : undefined }}
                                  tabIndex={0}
                                  onBlur={() => setTimeout(() => setOpenContactDropdownId(null), 150)}
                                  onClick={() => setOpenContactDropdownId(openContactDropdownId === contact.id ? null : contact.id)}
                                >
                                  <span className={clsx("text-xs font-bold truncate", openContactDropdownId === contact.id ? "text-[var(--color-primary)]" : "text-slate-700 dark:text-slate-300")} style={{ '--color-primary': persona.theme.primary }}>
                                    {contactTypeOptions.find(o => o.value === contact.type)?.label}
                                  </span>
                                  {openContactDropdownId === contact.id ? <ChevronUp size={12} className="absolute right-2 top-2.5 text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }} /> : <ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />}
                                </div>
                                {openContactDropdownId === contact.id && (
                                  <div className="absolute top-full left-0 w-[140px] mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                                    {contactTypeOptions.map(opt => (
                                      <div
                                        key={opt.value}
                                        onClick={() => { updateContact(contact.id, 'type', opt.value); setOpenContactDropdownId(null); }}
                                        className={clsx(
                                          "flex items-center gap-2 px-3 py-1.5 mx-1 rounded-lg cursor-pointer transition-colors text-xs font-bold",
                                          contact.type === opt.value
                                            ? "bg-[var(--color-primary-10)] text-[var(--color-primary)]"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                        )}
                                        style={{
                                          '--color-primary': persona.theme.primary,
                                          '--color-primary-10': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`
                                        }}
                                      >
                                        {opt.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <input
                                type="text"
                                value={contact.value}
                                onChange={e => updateContact(contact.id, 'value', e.target.value)}
                                placeholder="Username / URL"
                                className="flex-1 min-w-0 h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md px-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                style={{ '--color-primary': persona.theme.primary }}
                              />
                              <button onClick={() => removeContact(contact.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0 border border-slate-200 dark:border-white/10 rounded-md hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addContact}
                            className="h-9 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors mt-1"
                          >
                            <Plus className="w-4 h-4" style={{ color: persona.theme.primary }} />
                            <span className="text-xs font-bold text-slate-500">Add Contact</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ITEMS' && (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                      {items.map((item, index) => (
                        <div key={item.id} className="flex flex-col gap-1.5 pb-3 border-b border-slate-100 dark:border-white/5 last:border-0 last:pb-0">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={item.desc}
                              onChange={e => updateItem(item.id, 'desc', e.target.value)}
                              placeholder="Item description..."
                              className="flex-1 min-w-0 h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                              style={{ '--color-primary': persona.theme.primary }}
                            />
                            <button onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0 border border-slate-200 dark:border-white/10 rounded-md hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md h-8 w-24 shrink-0 focus-within:border-[var(--color-primary)] transition-colors overflow-hidden" style={{ '--color-primary': persona.theme.primary }}>
                              <span className="pl-2.5 pr-1.5 text-[10px] font-bold text-slate-400 select-none bg-slate-100/50 dark:bg-white/5 h-full flex items-center border-r border-slate-200 dark:border-white/10">Qty</span>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={e => updateItem(item.id, 'qty', e.target.value)}
                                className="w-full h-full bg-transparent px-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none text-center"
                              />
                            </div>
                            <div className="flex-1 flex items-center bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md h-8 focus-within:border-[var(--color-primary)] transition-colors overflow-hidden" style={{ '--color-primary': persona.theme.primary }}>
                              <span className="pl-2.5 pr-1.5 text-[10px] font-bold text-slate-400 select-none bg-slate-100/50 dark:bg-white/5 h-full flex items-center border-r border-slate-200 dark:border-white/10">{currency}</span>
                              <input
                                type="number"
                                min="0"
                                value={item.price}
                                onChange={e => updateItem(item.id, 'price', e.target.value)}
                                className="w-full h-full bg-transparent px-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none text-right"
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={addItem}
                        className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors mt-1"
                      >
                        <Plus className="w-4 h-4" style={{ color: persona.theme.primary }} />
                        <span className="text-xs font-bold text-slate-500">Add Item</span>
                      </button>
                    </div>
                  )}

                  {activeTab === 'PAYMENT' && (
                    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Upload QR Code (Optional)</label>
                        <div
                          onClick={() => qrInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingQr(true); }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDraggingQr(false); }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingQr(false);
                            if (e.dataTransfer?.files?.length > 0) handleImageUpload(e.dataTransfer.files[0], setQrCode);
                          }}
                          className={clsx(
                            "w-full h-9 border border-dashed rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer relative overflow-hidden",
                            isDraggingQr ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : "bg-slate-50 dark:bg-white/5 border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:hover:bg-white/10"
                          )}
                          style={{ '--color-primary': persona.theme.primary }}
                        >
                          {isDraggingQr ? (
                            <span className="text-xs font-bold text-[var(--color-primary)] relative z-10">Drop QR!</span>
                          ) : qrCode ? (
                            <span className="text-xs font-bold text-slate-500 relative z-10">Replace QR Code</span>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4" style={{ color: persona.theme.primary }} />
                              <span className="text-xs font-bold text-slate-500 relative z-10">Upload Image</span>
                            </>
                          )}
                          <input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setQrCode)} />
                        </div>
                        {qrCode ? (
                          <button onClick={() => setQrCode(null)} className="text-[10px] font-bold text-red-500 hover:text-red-600 mt-2 text-center w-full">Remove QR</button>
                        ) : (
                          <p className="text-[10px] text-slate-500 pl-1 mt-1.5 text-center">Images supported.</p>
                        )}
                      </div>

                      <div className="h-px w-full bg-slate-200 dark:bg-white/10" />

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Methods (Optional)</label>
                        <div className="flex flex-col gap-2">
                          {paymentMethods.map((method) => (
                            <div key={method.id} className="flex gap-2 items-center">
                              <div className="relative shrink-0">
                                <div
                                  className="h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md pl-2 pr-6 flex items-center justify-between cursor-pointer outline-none w-[100px]"
                                  style={{ borderColor: openPaymentDropdownId === method.id ? persona.theme.primary : undefined }}
                                  tabIndex={0}
                                  onBlur={() => setTimeout(() => setOpenPaymentDropdownId(null), 150)}
                                  onClick={() => setOpenPaymentDropdownId(openPaymentDropdownId === method.id ? null : method.id)}
                                >
                                  <span className={clsx("text-xs font-bold truncate", openPaymentDropdownId === method.id ? "text-[var(--color-primary)]" : "text-slate-700 dark:text-slate-300")} style={{ '--color-primary': persona.theme.primary }}>
                                    {paymentBankOptions.find(o => o.value === method.bank)?.label}
                                  </span>
                                  {openPaymentDropdownId === method.id ? <ChevronUp size={12} className="absolute right-2 top-2.5 text-[var(--color-primary)]" style={{ '--color-primary': persona.theme.primary }} /> : <ChevronDown size={12} className="absolute right-2 top-2.5 text-slate-400 pointer-events-none" />}
                                </div>
                                {openPaymentDropdownId === method.id && (
                                  <div className="absolute top-full left-0 w-[120px] mt-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {paymentBankOptions.map(opt => (
                                      <div
                                        key={opt.value}
                                        onClick={() => { updatePaymentMethod(method.id, 'bank', opt.value); setOpenPaymentDropdownId(null); }}
                                        className={clsx(
                                          "flex items-center gap-2 px-3 py-1.5 mx-1 rounded-lg cursor-pointer transition-colors text-xs font-bold",
                                          method.bank === opt.value
                                            ? "bg-[var(--color-primary-10)] text-[var(--color-primary)]"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                        )}
                                        style={{
                                          '--color-primary': persona.theme.primary,
                                          '--color-primary-10': `color-mix(in srgb, ${persona.theme.primary} 10%, transparent)`
                                        }}
                                      >
                                        {opt.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <input
                                type="text"
                                value={method.details}
                                onChange={e => updatePaymentMethod(method.id, 'details', e.target.value)}
                                placeholder="Account No & Name"
                                className="flex-1 min-w-0 h-8 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-md px-2 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                                style={{ '--color-primary': persona.theme.primary }}
                              />
                              <button onClick={() => removePaymentMethod(method.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0 border border-slate-200 dark:border-white/10 rounded-md hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={addPaymentMethod}
                            className="w-full h-9 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/20 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors mt-1"
                          >
                            <Plus className="w-4 h-4" style={{ color: persona.theme.primary }} />
                            <span className="text-xs font-bold text-slate-500">Add Payment Method</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>



          </div>

          {/* Main Workspace / Output */}
          <div className="flex-1 flex flex-col min-w-0 lg:h-[calc(100vh-120px)] lg:min-h-0">
            <div className="flex-1 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden relative">
              <div className="px-4 h-[40px] border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0a0a0a]/50 flex justify-between items-center shrink-0">
                <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Preview Workspace
                </h3>
                <button
                  onClick={generateAndDownload}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-1.5 h-7 px-3 -mr-2.5 text-white font-bold text-[11px] rounded-lg  transition-opacity hover:opacity-90 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                  style={{ backgroundColor: persona.theme.primary }}
                >
                  <Download size={14} />
                  DOWNLOAD
                </button>
              </div>

              <div
                className="flex-1 overflow-auto bg-slate-50/50 dark:bg-[#0a0a0a]/50 p-6 md:p-8 custom-scrollbar"
              >
                <div className="w-full min-w-fit flex justify-center items-start">
                  {/* Actual Invoice Preview Container */}
                  <div
                    className="w-[800px] bg-white rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-black/5 shrink-0"
                    style={{
                      minHeight: '600px',
                      transform: 'scale(0.75)',
                      transformOrigin: 'top center',
                      marginBottom: '-25%'
                    }}
                  >

                    {/* Invoice Content */}
                    <div
                      ref={invoiceRef}
                      className="w-full bg-white p-8 md:p-12 text-slate-800 flex flex-col relative"
                    >
                      {/* Tint Background layer (like in reference image) */}
                      <div className="absolute inset-0 z-0 opacity-5" style={{ backgroundColor: invoiceColor }}></div>

                      {/* Content (z-10 to stay above tint) */}
                      <div className="relative z-10 flex flex-col h-full min-h-[500px]">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-12">
                          <div className="flex items-center gap-6">
                            {senderAvatar ? (
                              <img src={senderAvatar} alt="Sender" className="w-24 h-24 rounded-2xl object-cover bg-white" />
                            ) : (
                              <div className="w-24 h-24 rounded-2xl bg-white/50 flex items-center justify-center text-slate-300 border border-black/5">
                                <ImageIcon size={32} />
                              </div>
                            )}
                            <div>
                              <h1 className="text-3xl font-black text-slate-800 leading-tight">{senderName || 'Nama Pengirim'}</h1>
                              <div className="flex flex-col gap-1.5 mt-2.5">
                                {contacts.filter(c => c.value.trim() !== '').map(contact => (
                                  <div key={contact.id} className="flex items-center gap-2 text-xs text-slate-600 font-bold opacity-80 leading-none">
                                    <span className="opacity-70 flex items-center justify-center shrink-0" style={{ color: getSafeDarkColor(invoiceColor) }}>
                                      {getContactIcon(contact.type, 13)}
                                    </span>
                                    <span>{contact.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <h2 className="text-3xl font-black tracking-widest mb-1" style={{ color: getSafeDarkColor(invoiceColor) }}>INVOICE</h2>
                            <p className="text-sm text-slate-600 font-bold opacity-70">#{invoiceNo || 'INV-000'}</p>
                          </div>
                        </div>

                        {/* Client & Date */}
                        <div className="flex justify-between items-end mb-8 border-b border-black/10 pb-6">
                          <div>
                            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-70">{language === 'ID' ? 'UNTUK' : 'BILL TO'}</h3>
                            <p className="font-bold text-slate-800 text-base">{clientName || (language === 'ID' ? 'Nama Klien' : 'Client Name')}</p>
                          </div>
                          <div className="text-right">
                            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-70">{language === 'ID' ? 'TANGGAL' : 'DATE'}</h3>
                            <p className="font-bold text-slate-800 text-base">{date || 'DD/MM/YYYY'}</p>
                          </div>
                        </div>

                        {/* Items Table */}
                        {/* Items Table */}
                        <div className="w-full mb-8 rounded-lg border border-black/10 overflow-hidden">
                          {/* Table Header */}
                          <div className={clsx("flex w-full text-[10px] font-bold uppercase tracking-widest p-3 px-4", getContrastYIQ(invoiceColor) === 'dark' ? 'text-slate-800' : 'text-white')} style={{ backgroundColor: invoiceColor }}>
                            <div className="w-12 text-center opacity-90">QTY</div>
                            <div className="flex-1 px-4 opacity-90">{language === 'ID' ? 'DESKRIPSI' : 'DESCRIPTION'}</div>
                            <div className="w-32 text-right opacity-90">{language === 'ID' ? 'HARGA SATUAN' : 'UNIT PRICE'}</div>
                            <div className="w-32 text-right pr-2">TOTAL</div>
                          </div>
                          {/* Table Body */}
                          <div className="bg-white border-t border-black/10">
                            {items.map((item, idx) => (
                              <div key={item.id} className={clsx("flex w-full p-4 text-sm font-medium border-b border-black/5", idx === items.length - 1 && "border-b-0")}>
                                <div className="w-12 text-center text-slate-600 font-bold opacity-80">{item.qty}</div>
                                <div className="flex-1 px-4 text-slate-800 font-bold">{item.desc || '-'}</div>
                                <div className="w-32 text-right text-slate-600">{currency} {Number(item.price || 0).toLocaleString('id-ID')}</div>
                                <div className="w-32 text-right font-black text-slate-800 pr-2">{currency} {(Number(item.qty || 0) * Number(item.price || 0)).toLocaleString('id-ID')}</div>
                              </div>
                            ))}
                            {items.length === 0 && (
                              <div className="p-6 text-center text-sm text-slate-500 font-bold opacity-50">{language === 'ID' ? 'Belum ada item ditambahkan' : 'No items added yet'}</div>
                            )}
                          </div>
                        </div>

                        {/* Summary Box */}
                        <div className="flex justify-between items-end mb-12">
                          <div>
                            {enableEstimation && (
                              <div className="mb-2">
                                <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 opacity-70">{language === 'ID' ? 'ESTIMASI' : 'ESTIMATION'}</h3>
                                <p className="font-bold text-slate-800 text-base">{estimationValue} {estimationUnit === 'Days' ? (language === 'ID' ? 'Hari' : 'Days') : estimationUnit === 'Weeks' ? (language === 'ID' ? 'Minggu' : 'Weeks') : (language === 'ID' ? 'Bulan' : 'Months')}</p>
                              </div>
                            )}
                          </div>
                          <div className="w-72">
                            <div className="flex justify-between py-2.5 px-2 text-sm font-bold text-slate-600 border-b border-black/10">
                              <span>Subtotal</span>
                              <span>{currency} {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between items-center py-3.5 px-4 rounded-lg mt-3 border border-black/10" style={{ backgroundColor: invoiceColor }}>
                              <span className={clsx("text-[11px] font-bold uppercase tracking-widest", getContrastYIQ(invoiceColor) === 'dark' ? 'text-slate-800' : 'text-white/80')}>TOTAL</span>
                              <span className={clsx("text-xl font-black", getContrastYIQ(invoiceColor) === 'dark' ? 'text-slate-800' : 'text-white')}>{currency} {subtotal.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer (QR & Signature) */}
                        <div className="flex justify-between items-end mt-auto pt-10">
                          <div className="flex flex-col max-w-[50%]">
                            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3 opacity-70">{language === 'ID' ? 'METODE PEMBAYARAN' : 'PAYMENT METHOD'}</h3>
                            <div className="flex items-center gap-4">
                              {qrCode && (
                                <div className="bg-white p-2 rounded-lg border border-black/5 inline-block shrink-0">
                                  <img src={qrCode} alt="QR Code" className="w-24 h-24 object-contain" />
                                </div>
                              )}
                              {paymentMethods.filter(p => p.details.trim() !== '').length > 0 && (
                                <div className="flex flex-col gap-2 justify-center mt-1">
                                  {paymentMethods.filter(p => p.details.trim() !== '').map(method => (
                                    <div key={method.id} className="text-[11px] font-bold text-slate-700 opacity-90 flex items-center gap-2">
                                      <div className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: getSafeDarkColor(invoiceColor) }}></div>
                                      <div className="flex items-center gap-1.5">
                                        {method.bank !== 'Lainnya' && <span className="font-extrabold" style={{ color: getSafeDarkColor(invoiceColor) }}>{method.bank}</span>}
                                        <span>{method.details}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {!qrCode && paymentMethods.filter(p => p.details.trim() !== '').length === 0 && (
                                <div className="w-28 h-28 rounded-lg bg-white/50 border-2 border-dashed border-black/10 flex items-center justify-center text-slate-300 shrink-0">
                                  <QrCode size={32} strokeWidth={1.5} opacity={0.5} />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <h3 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-6 opacity-70">{language === 'ID' ? 'HORMAT KAMI' : 'BEST REGARDS'}</h3>
                            <h2 className="text-4xl text-slate-800 opacity-90" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{senderName || 'Nama'}</h2>
                            <div className="w-40 h-px bg-slate-300 mt-3 mb-2"></div>
                            <p className="text-[9px] font-bold text-slate-400 tracking-wider">#{invoiceNo || 'INV'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
