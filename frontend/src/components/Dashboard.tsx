import React, { useEffect, useState } from 'react';
import {
  LogOut, User as UserIcon, Shield, LayoutDashboard, Map as MapIcon, Sprout,
  Trees, MapPin, Plus, Edit2, Trash2, X,
  CloudRain, Cloud, Sun, Droplets, Wind, AlertTriangle,
  Activity, DollarSign, Search, Pencil,
  ClipboardList, Image as ImageIcon, Upload, Camera, Bug, ArrowUpRight, ArrowDownRight, Menu,
  HelpCircle, Phone, Mail, Calendar, MessageSquare, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

interface DashboardProps {
  token: string;
  onLogout: () => void;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  password?: string;
}

interface Farm {
  id: number;
  name: string;
  address: string;
  totalAcres: number;
  numberOfTrees: number;
  cropVariety: string;
  cropSeasonStartTime: string;
}

interface Expense {
  id: number;
  amount: number;
  category: string;
  notes: string;
  date: string;
}

interface DailyActivity {
  id: number;
  date: string;
  activityType: string;
  notes: string;
  pesticideName?: string;
  pesticideQuantity?: string;
  pesticideTime?: string;
  farm: Farm;
}

interface GalleryImage {
  id: number;
  filename: string;
  caption: string;
  uploadedAt: string;
  farm?: Farm;
}

interface DiseaseEvent {
  id: number;
  diseaseName: string;
  temp: number;
  humidity: number;
  rainfall: number;
  filename: string;
  detectedAt: string;
  farm: Farm;
}

interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: string;
}

const EXPENSE_CATEGORIES = [
  'Fertilizer', 'Pesticides', 'Electricity', 'Diesel', 'Water',
  'Workers', 'Equipment', 'Transportation', 'Miscellaneous'
];

const ACTIVITY_TYPES = [
  'Irrigation', 'Fertilization', 'Pesticide Application', 'Harvesting',
  'Pruning', 'Planting', 'Maintenance', 'Other'
];

const formatForDateTimeLocal = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

export const Dashboard: React.FC<DashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'farms' | 'expenses' | 'activities' | 'gallery' | 'diseases' | 'support' | 'profile'>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [diseaseEvents, setDiseaseEvents] = useState<DiseaseEvent[]>([]);
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search & Filter states
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilterFarmId, setActivityFilterFarmId] = useState('');
  const [galleryFilterFarmId, setGalleryFilterFarmId] = useState('');
  const [diseaseFilterFarmId, setDiseaseFilterFarmId] = useState('');

  // Modals visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTotalAcres, setFormTotalAcres] = useState('');
  const [formNumberOfTrees, setFormNumberOfTrees] = useState('');
  const [formCropVariety, setFormCropVariety] = useState('');
  const [formCropSeasonStart, setFormCropSeasonStart] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formExpAmount, setFormExpAmount] = useState('');
  const [formExpCategory, setFormExpCategory] = useState('Miscellaneous');
  const [formExpNotes, setFormExpNotes] = useState('');
  const [formExpDate, setFormExpDate] = useState('');
  const [formExpError, setFormExpError] = useState<string | null>(null);
  const [formExpSubmitting, setFormExpSubmitting] = useState(false);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<DailyActivity | null>(null);
  const [formActDate, setFormActDate] = useState('');
  const [formActType, setFormActType] = useState('Irrigation');
  const [formActNotes, setFormActNotes] = useState('');
  const [formActFarmId, setFormActFarmId] = useState('');
  const [formActError, setFormActError] = useState<string | null>(null);
  const [formActSubmitting, setFormActSubmitting] = useState(false);
  const [formActPestName, setFormActPestName] = useState('None');
  const [formActPestQty, setFormActPestQty] = useState('None');
  const [formActPestTime, setFormActPestTime] = useState('None');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFarmId, setUploadFarmId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const [diseaseFile, setDiseaseFile] = useState<File | null>(null);
  const [diseaseNameInput, setDiseaseNameInput] = useState('');
  const [diseaseTempInput, setDiseaseTempInput] = useState('');
  const [diseaseHumidityInput, setDiseaseHumidityInput] = useState('');
  const [diseaseRainfallInput, setDiseaseRainfallInput] = useState('0');
  const [diseaseFarmId, setDiseaseFarmId] = useState('');
  const [diseaseErrorMsg, setDiseaseErrorMsg] = useState<string | null>(null);
  const [diseaseSubmitting, setDiseaseSubmitting] = useState(false);

  // Contact Us form states
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactFormError, setContactFormError] = useState<string | null>(null);

  // Chatbot Assistant states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: Date }>>([
    {
      sender: 'bot',
      text: 'Hi! I am the Daruru AI Assistant. Ask me anything about your crop holdings, weather alerts, daily operation logs, or 3-way expense splits.',
      time: new Date()
    }
  ]);
  const [chatTyping, setChatTyping] = useState(false);

  const [activeLightboxImage, setActiveLightboxImage] = useState<any | null>(null);

  // File and Modal Helper triggers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.match('image.*')) {
        setUploadError('Only image files (PNG, JPEG, WEBP) are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be under 5MB.');
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleDeleteImage = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this photo from the gallery?')) return;
    try {
      const response = await fetch(`http://16.112.61.17:3000/gallery/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Removing photo failed');
      toast.success('Photo removed');
      refreshGallery();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openDiseaseModal = () => {
    setDiseaseFile(null);
    setDiseaseNameInput('');
    setDiseaseTempInput(dashboardData?.weather?.temp?.toString() || '25');
    setDiseaseHumidityInput(dashboardData?.weather?.humidity?.toString() || '65');
    setDiseaseRainfallInput('0');
    setDiseaseFarmId(farms.length > 0 ? farms[0].id.toString() : '');
    setDiseaseErrorMsg(null);
    setIsDiseaseModalOpen(true);
  };

  const handleDiseaseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.match('image.*')) {
        setDiseaseErrorMsg('Only image files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setDiseaseErrorMsg('File size must be under 5MB.');
        return;
      }
      setDiseaseFile(file);
      setDiseaseErrorMsg(null);
    }
  };

  // Fetch API Data
  const fetchData = async () => {
    try {
      const profileRes = await fetch('http://16.112.61.17:3000/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          onLogout();
          return;
        }
        throw new Error('Unauthorized session');
      }
      const profileData = await profileRes.json();
      setProfile(profileData);

      const [farmsRes, expensesRes, activitiesRes, galleryRes, diseaseRes, contactRes, dashboardRes] = await Promise.all([
        fetch('http://16.112.61.17:3000/farms', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://16.112.61.17:3000/expenses', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://16.112.61.17:3000/daily-activities', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://16.112.61.17:3000/gallery', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://16.112.61.17:3000/disease-management', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://16.112.61.17:3000/contact', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://16.112.61.17:3000/dashboard', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (farmsRes.ok) setFarms(await farmsRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (galleryRes.ok) setGalleryImages(await galleryRes.json());
      if (diseaseRes.ok) setDiseaseEvents(await diseaseRes.json());
      if (contactRes.ok) setContactInquiries(await contactRes.json());
      if (dashboardRes.ok) setDashboardData(await dashboardRes.json());

    } catch (err: any) {
      setError(err.message || 'Connecting to cockpit services failed');
      toast.error('Cockpit telemetry connection failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, onLogout]);

  // Refresh lists
  const refreshFarms = async () => {
    const res = await fetch('http://16.112.61.17:3000/farms', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setFarms(await res.json());
  };

  const refreshExpenses = async () => {
    const res = await fetch('http://16.112.61.17:3000/expenses', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setExpenses(await res.json());
  };

  const refreshActivities = async () => {
    const res = await fetch('http://16.112.61.17:3000/daily-activities', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setActivities(await res.json());
  };

  const refreshGallery = async () => {
    const res = await fetch('http://16.112.61.17:3000/gallery', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setGalleryImages(await res.json());
  };

  const refreshDiseases = async () => {
    const res = await fetch('http://16.112.61.17:3000/disease-management', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setDiseaseEvents(await res.json());
  };

  const refreshSupportHistory = async () => {
    const res = await fetch('http://16.112.61.17:3000/contact', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setContactInquiries(await res.json());
  };

  const refreshDashboardData = async () => {
    const res = await fetch('http://16.112.61.17:3000/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setDashboardData(await res.json());
  };

  // CRUD Submissions
  const handleFarmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formAddress.trim() || !formCropVariety.trim() || !formCropSeasonStart) {
      setFormError('All fields are required.');
      return;
    }

    const acres = parseFloat(formTotalAcres);
    const trees = parseInt(formNumberOfTrees);

    if (isNaN(acres) || acres <= 0 || isNaN(trees) || trees < 0) {
      setFormError('Acres/Trees parameters must be positive numeric values.');
      return;
    }

    setFormSubmitting(true);
    const body = {
      name: formName,
      address: formAddress,
      totalAcres: acres,
      numberOfTrees: trees,
      cropVariety: formCropVariety,
      cropSeasonStartTime: new Date(formCropSeasonStart).toISOString(),
    };

    try {
      const url = editingFarm ? `http://16.112.61.17:3000/farms/${editingFarm.id}` : 'http://16.112.61.17:3000/farms';
      const method = editingFarm ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Saving farm failed');

      toast.success(editingFarm ? 'Farm parameters updated' : 'New farm registered');
      setIsModalOpen(false);
      refreshFarms();
      refreshDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteFarm = async (id: number) => {
    if (!window.confirm('Delete farm holding? All connected logs will be archived.')) return;
    try {
      const response = await fetch(`http://16.112.61.17:3000/farms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Archiving farm failed');
      toast.success('Farm holding deleted');
      refreshFarms();
      refreshDashboardData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormExpError(null);

    const amount = parseFloat(formExpAmount);
    if (isNaN(amount) || amount <= 0 || !formExpDate) {
      setFormExpError('Valid amount and date are required.');
      return;
    }

    setFormExpSubmitting(true);
    const body = { amount, category: formExpCategory, notes: formExpNotes, date: formExpDate };

    try {
      const url = editingExpense ? `http://16.112.61.17:3000/expenses/${editingExpense.id}` : 'http://16.112.61.17:3000/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Logging expense failed');

      toast.success(editingExpense ? 'Ledger entry revised' : 'Expense recorded');
      setIsExpenseModalOpen(false);
      refreshExpenses();
      refreshDashboardData();
    } catch (err: any) {
      setFormExpError(err.message || 'Operation failed');
    } finally {
      setFormExpSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Remove this expense entry?')) return;
    try {
      const response = await fetch(`http://16.112.61.17:3000/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Removing expense failed');
      toast.success('Expense ledger entry removed');
      refreshExpenses();
      refreshDashboardData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormActError(null);

    if (!formActFarmId || !formActNotes.trim()) {
      setFormActError('All fields are required.');
      return;
    }

    setFormActSubmitting(true);
    const body = {
      date: formActDate,
      activityType: formActType,
      notes: formActNotes,
      farmId: parseInt(formActFarmId),
      pesticideName: formActPestName || 'None',
      pesticideQuantity: formActPestQty || 'None',
      pesticideTime: formActPestTime || 'None',
    };

    try {
      const url = editingActivity ? `http://16.112.61.17:3000/daily-activities/${editingActivity.id}` : 'http://16.112.61.17:3000/daily-activities';
      const method = editingActivity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Logging activity failed');

      toast.success(editingActivity ? 'Activity revised' : 'Operation recorded');
      setIsActivityModalOpen(false);
      refreshActivities();
      refreshDashboardData();
    } catch (err: any) {
      setFormActError(err.message || 'Operation failed');
    } finally {
      setFormActSubmitting(false);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm('Remove this activity log?')) return;
    try {
      const response = await fetch(`http://16.112.61.17:3000/daily-activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Removing activity failed');
      toast.success('Activity log removed');
      refreshActivities();
      refreshDashboardData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError('Please select a photo.');
      return;
    }

    setUploadSubmitting(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('caption', uploadCaption);
    if (uploadFarmId) formData.append('farmId', uploadFarmId);

    try {
      const response = await fetch('http://16.112.61.17:3000/gallery/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Uploading file failed');

      toast.success('Telemetry snapshot uploaded');
      setIsUploadModalOpen(false);
      refreshGallery();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleDiseaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiseaseErrorMsg(null);

    if (!diseaseFile || !diseaseNameInput.trim() || !diseaseFarmId) {
      setDiseaseErrorMsg('All parameters (including crop photo) are required.');
      return;
    }

    const t = parseFloat(diseaseTempInput);
    const h = parseInt(diseaseHumidityInput);
    const r = parseFloat(diseaseRainfallInput);

    if (isNaN(t) || isNaN(h) || isNaN(r)) {
      setDiseaseErrorMsg('Weather parameters must be numeric.');
      return;
    }

    setDiseaseSubmitting(true);
    const formData = new FormData();
    formData.append('image', diseaseFile);
    formData.append('diseaseName', diseaseNameInput);
    formData.append('temp', t.toString());
    formData.append('humidity', h.toString());
    formData.append('rainfall', r.toString());
    formData.append('farmId', diseaseFarmId);

    try {
      const response = await fetch('http://16.112.61.17:3000/disease-management/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Logging incident failed');

      toast.success('Crop disease logged');
      setIsDiseaseModalOpen(false);
      refreshDiseases();
      refreshDashboardData();
    } catch (err: any) {
      setDiseaseErrorMsg(err.message || 'Operation failed');
    } finally {
      setDiseaseSubmitting(false);
    }
  };

  const handleDeleteDisease = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete disease warning?')) return;
    try {
      const response = await fetch(`http://16.112.61.17:3000/disease-management/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Removing warning failed');
      toast.success('Disease warning cleared');
      refreshDiseases();
      refreshDashboardData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Support inquiry submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactFormError(null);

    if (!contactSubject.trim() || !contactMessage.trim()) {
      setContactFormError('Subject and message details are required.');
      return;
    }

    setContactSubmitting(true);
    const body = {
      name: profile?.name || 'Authorized Client',
      email: profile?.email || 'darurugirish@gmail.com',
      subject: contactSubject,
      message: contactMessage,
    };

    try {
      const response = await fetch('http://16.112.61.17:3000/contact', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Logging support ticket failed');

      toast.success('Support inquiry filed successfully');
      setContactSubject('');
      setContactMessage('');
      refreshSupportHistory();
    } catch (err: any) {
      setContactFormError(err.message || 'Inquiry submission failed');
    } finally {
      setContactSubmitting(false);
    }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage, time: new Date() }]);
    setChatInput('');
    setChatTyping(true);

    // Simulate bot response after 1.2s
    setTimeout(() => {
      setChatTyping(false);

      let reply = "I am currently in sandbox demo mode. My integration with the Gemini LLM cognitive agent will be finalized shortly!";
      const query = userMessage.toLowerCase();

      if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
        reply = "Hello there! I am your Daruru Assistant. How can I help you analyze your holdings today?";
      } else if (query.includes('expens') || query.includes('split') || query.includes('ledger')) {
        reply = `I can help you monitor expenses! Your current total logged expenditure is $${totalExpensesSum.toLocaleString()} which is split into Direct Crop Overhead, Labor & Fleet, and Irrigation at $${splitPartValue} each.`;
      } else if (query.includes('farm') || query.includes('holding') || query.includes('plant')) {
        reply = `You currently have ${farms.length} holdings covering ${totalAcres} acres with a total plant count of ${totalTrees.toLocaleString()}.`;
      } else if (query.includes('disease') || query.includes('bug')) {
        reply = `I see ${diseaseEvents.length} registered disease outbreaks in the tracker database. Be sure to log new incidents with weather telemetry values!`;
      } else if (query.includes('weather') || query.includes('temp')) {
        reply = `Current telemetry weather at your node reads ${dashboardData?.weather?.temp}°C with ${dashboardData?.weather?.condition || 'calm condition'}.`;
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: new Date() }]);
    }, 1200);
  };

  // Helper icons and styles
  const getWeatherIcon = (condition: string) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain')) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (cond.includes('cloud') || cond.includes('overcast')) return <Cloud className="w-8 h-8 text-zinc-400" />;
    return <Sun className="w-8 h-8 text-amber-400" />;
  };

  const getActivityIndicatorColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('irrigation') || t.includes('water')) return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
    if (t.includes('fertil')) return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    if (t.includes('pest') || t.includes('treatment')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (t.includes('harvest')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
  };

  // Metric computations
  const totalAcres = farms.reduce((acc, f) => acc + Number(f.totalAcres), 0).toFixed(1);
  const totalTrees = farms.reduce((acc, f) => acc + Number(f.numberOfTrees), 0);
  const totalExpensesSum = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const splitPartValue = (totalExpensesSum / 3).toFixed(2);

  // Filters mapping
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.notes?.toLowerCase().includes(expenseSearch.toLowerCase()) || exp.category.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCat = !expenseFilterCategory || exp.category === expenseFilterCategory;
    return matchesSearch && matchesCat;
  });

  const filteredActivities = activities.filter(act => {
    const matchesSearch = act.notes?.toLowerCase().includes(activitySearch.toLowerCase()) || act.activityType.toLowerCase().includes(activitySearch.toLowerCase());
    const matchesFarm = !activityFilterFarmId || act.farm?.id.toString() === activityFilterFarmId;
    return matchesSearch && matchesFarm;
  });

  const filteredGalleryImages = galleryImages.filter(img => !galleryFilterFarmId || img.farm?.id.toString() === galleryFilterFarmId);
  const filteredDiseases = diseaseEvents.filter(event => !diseaseFilterFarmId || event.farm?.id.toString() === diseaseFilterFarmId);

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0b0c10] border border-zinc-800 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
              {p.name}: <span className="text-white">{p.value.toLocaleString()}{p.name.includes('Rain') ? 'mm' : ''}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#05060b] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
        <p className="text-zinc-500 text-sm font-medium tracking-wide">Syncing cockpit dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#05060b] flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Telemetry Connection Failed</h2>
        <p className="text-zinc-500 text-sm max-w-sm">{error}</p>
        <button onClick={fetchData} className="mt-4 bg-zinc-800 hover:bg-zinc-750 text-white px-4 py-2 rounded-lg text-sm font-semibold border border-zinc-700 cursor-pointer">
          Retry Sync
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#05060b] text-zinc-100 flex flex-col md:flex-row relative dot-grid">

      {/* Mobile Top Header */}
      <header className="md:hidden w-full glass-panel border-b border-zinc-900/60 px-5 py-4 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-2">
          <Sprout className="w-6 h-6 text-indigo-400 animate-pulse" />
          <span className="font-bold text-md tracking-tight text-white">Daruru Cockpit</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-[260px] bg-[#08090e] border-r border-zinc-900/60 p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Sprout className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white tracking-tight leading-none">Daruru Farms</span>
              </div>
            </div>
            <button className="md:hidden p-1 text-zinc-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Analysis', icon: LayoutDashboard },
              { id: 'farms', label: 'Holdings', icon: MapIcon },
              { id: 'expenses', label: 'Expenses', icon: DollarSign },
              { id: 'activities', label: 'Daily Logs', icon: ClipboardList },
              { id: 'gallery', label: 'Gallery', icon: ImageIcon },
              { id: 'diseases', label: 'Diseases', icon: Bug },
              { id: 'support', label: 'Help & Support', icon: HelpCircle },
              { id: 'profile', label: 'Identity', icon: UserIcon },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer
                    ${isActive
                      ? 'bg-indigo-650 hover:bg-indigo-600 text-white font-bold shadow-[0_1px_2px_rgba(99,102,241,0.15)] border border-indigo-500/30'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar User Footer */}
        <div className="pt-6 border-t border-zinc-900/60 space-y-4">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-200 leading-none mb-1">{profile?.name}</span>
            <span className="text-xs text-zinc-500 truncate">{profile?.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-950 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-zinc-400 border border-zinc-900 text-xs font-semibold transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 p-6 md:p-10 max-h-screen overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >

            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Analysis</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Live telemetry feeding from registered farm nodes.</p>
                  </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Acres', value: totalAcres, icon: Sprout, color: 'text-violet-400 bg-violet-500/5 border-violet-500/10' },
                    { label: 'Total Plants', value: totalTrees.toLocaleString(), icon: Trees, color: 'text-fuchsia-400 bg-fuchsia-500/5 border-fuchsia-500/10' },
                    { label: 'Crop Start Date', value: farms.length > 0 ? new Date(farms[0].cropSeasonStartTime).toLocaleDateString() : 'N/A', icon: Calendar, color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10' },
                    {
                      label: 'July Expenses',
                      value: `$${(dashboardData?.metrics?.expenses?.value || 0).toLocaleString()}`,
                      icon: DollarSign,
                      color: 'text-indigo-400 bg-indigo-500/5 border-indigo-500/10',
                      trend: dashboardData?.metrics?.expenses?.change
                    },
                  ].map((stat, idx) => (
                    <div key={idx} className="glass-card rounded-xl p-5 border border-zinc-900/60 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                          {stat.trend !== undefined && (
                            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.trend >= 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                              {stat.trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                              {Math.abs(stat.trend)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Cockpit */}
                {dashboardData?.charts && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Expense Chart */}
                    <div className="glass-card rounded-xl border border-zinc-900/60 p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-300">Expense Trend</span>
                        <span className="text-xs text-zinc-500">Amount ($)</span>
                      </div>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dashboardData.charts.expenseTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#13141f" vertical={false} />
                            <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} />
                            <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="value" name="Expenses" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Water vs Rainfall */}
                    <div className="glass-card rounded-xl border border-zinc-900/60 p-5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-300">Water Consumption vs Rainfall</span>
                        <div className="flex gap-3 text-xs">
                          <span className="flex items-center gap-1.5 text-[#6366f1]"><span className="w-2 h-2 rounded-full bg-[#6366f1]" /> Irrigation</span>
                          <span className="flex items-center gap-1.5 text-[#a855f7]"><span className="w-2 h-2 rounded-full bg-[#a855f7]" /> Rainfall</span>
                        </div>
                      </div>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dashboardData.charts.waterUsageRainfall} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#13141f" vertical={false} />
                            <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} />
                            <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Line type="monotone" dataKey="water" name="Irrigation (kL)" stroke="#6366f1" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="rain" name="Rainfall (mm)" stroke="#a855f7" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dashboard Secondary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Weather and Telemetry */}
                  {dashboardData?.weather && (
                    <div className="glass-card rounded-xl border border-zinc-900/60 p-5 flex flex-col justify-between h-[280px]">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Telemetry Location</span>
                          <h4 className="text-sm font-bold text-white">{dashboardData.weather.location}</h4>
                        </div>
                        {getWeatherIcon(dashboardData.weather.condition)}
                      </div>

                      <div className="my-auto py-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold text-white tracking-tight">{dashboardData.weather.temp}°</span>
                          <span className="text-zinc-450 text-sm font-medium">{dashboardData.weather.condition}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-900/60">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-indigo-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Humidity</span>
                            <span className="text-xs font-semibold text-zinc-300">{dashboardData.weather.humidity}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-violet-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Wind Speed</span>
                            <span className="text-xs font-semibold text-zinc-300">{dashboardData.weather.wind} km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disease Warnings */}
                  <div className="glass-card rounded-xl border border-zinc-900/60 p-5 flex flex-col justify-between h-[280px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Disease Outbreaks</span>
                      <span className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">
                        {dashboardData?.metrics?.alertsCount || 0} Alert{dashboardData?.metrics?.alertsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {dashboardData?.alerts?.length > 0 ? (
                        dashboardData.alerts.slice(0, 3).map((alert: any) => (
                          <div
                            key={alert.id}
                            onClick={() => alert.filename && setActiveLightboxImage({ ...alert, caption: `${alert.disease} detected on ${alert.crop}` })}
                            className="bg-[#0b0c10]/40 hover:bg-[#0b0c10]/80 border border-zinc-900 p-2.5 rounded-lg flex items-center gap-3 transition-colors duration-150 cursor-pointer"
                          >
                            {alert.filename ? (
                              <img
                                src={`http://16.112.61.17:3000/uploads/${alert.filename}`}
                                alt={alert.disease}
                                className="w-10 h-10 rounded-md object-cover border border-zinc-800"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-red-500/5 flex items-center justify-center border border-red-500/10">
                                <AlertTriangle className="w-5 h-5 text-red-450" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{alert.disease}</p>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{alert.crop} • {alert.location}</p>
                            </div>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${alert.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>{alert.severity}</span>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <Bug className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500">No active disease outbreaks logged.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Activities */}
                  <div className="glass-card rounded-xl border border-zinc-900/60 p-5 flex flex-col justify-between h-[280px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recent Activity</span>
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase">Feed</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      {dashboardData?.recentActivities?.length > 0 ? (
                        dashboardData.recentActivities.slice(0, 4).map((act: any) => (
                          <div key={act.id} className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-300 leading-normal">{act.description}</p>
                              <span className="text-[9px] text-zinc-500 mt-1 block">{act.time}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <Activity className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500">No operations logged recently.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pesticide Spray History (Last 7 Days) */}
                  <div className="glass-card rounded-xl border border-zinc-900/60 p-5 flex flex-col justify-between h-[280px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pesticide Sprays (7d)</span>
                      <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                        {activities.filter(act => {
                          const actDate = new Date(act.date);
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                          const isPest = act.activityType === 'Pesticide Application' || (act.pesticideName && act.pesticideName !== 'None');
                          return isPest && actDate >= oneWeekAgo;
                        }).length} sprayed
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {activities.filter(act => {
                        const actDate = new Date(act.date);
                        const oneWeekAgo = new Date();
                        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                        const isPest = act.activityType === 'Pesticide Application' || (act.pesticideName && act.pesticideName !== 'None');
                        return isPest && actDate >= oneWeekAgo;
                      }).length > 0 ? (
                        activities.filter(act => {
                          const actDate = new Date(act.date);
                          const oneWeekAgo = new Date();
                          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                          const isPest = act.activityType === 'Pesticide Application' || (act.pesticideName && act.pesticideName !== 'None');
                          return isPest && actDate >= oneWeekAgo;
                        }).map(act => (
                          <div
                            key={act.id}
                            className="bg-[#0b0c10]/40 border border-zinc-900 p-2.5 rounded-lg space-y-1.5"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white truncate max-w-[120px]">{act.pesticideName || 'Unknown'}</span>
                              <span className="text-[9px] text-zinc-500 font-semibold">{new Date(act.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-400">
                              <span>Qty: {act.pesticideQuantity || 'None'}</span>
                              <span className="text-indigo-400 font-semibold">{act.farm?.name}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <Droplets className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500">No pesticide sprays recorded in the last 7 days.</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </>
            )}

            {/* HOLDINGS TAB */}
            {activeTab === 'farms' && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Registered Holdings</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Manage and inspect physical holdings parameters.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingFarm(null);
                      setFormName('');
                      setFormAddress('');
                      setFormTotalAcres('');
                      setFormNumberOfTrees('');
                      setFormCropVariety('');
                      setFormCropSeasonStart('');
                      setFormError(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-2 border border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Farm</span>
                  </button>
                </div>

                {farms.length === 0 ? (
                  <div className="glass-card border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                      <MapIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-white">No registered holdings found</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Create and structure your first crop holding boundary parameters.</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/30 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                    >
                      Create Farm Holding
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {farms.map(farm => (
                      <div key={farm.id} className="glass-card rounded-xl border border-zinc-900/60 p-5 flex flex-col justify-between relative group hover:border-indigo-500/20 transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-white tracking-tight">{farm.name}</h3>
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                <span>{farm.address}</span>
                              </p>
                            </div>
                            <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                              {farm.cropVariety}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-900/60">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Acreage</span>
                              <p className="text-sm font-bold text-zinc-300 mt-0.5">{farm.totalAcres} Acres</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tree Count</span>
                              <p className="text-sm font-bold text-zinc-300 mt-0.5">{farm.numberOfTrees.toLocaleString()} trees</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-5 pt-3">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Season Commenced</span>
                            <span className="text-xs font-semibold text-zinc-400 mt-0.5">{new Date(farm.cropSeasonStartTime).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingFarm(farm);
                                setFormName(farm.name);
                                setFormAddress(farm.address);
                                setFormTotalAcres(farm.totalAcres.toString());
                                setFormNumberOfTrees(farm.numberOfTrees.toString());
                                setFormCropVariety(farm.cropVariety);
                                setFormCropSeasonStart(formatForDateTimeLocal(farm.cropSeasonStartTime));
                                setFormError(null);
                                setIsModalOpen(true);
                              }}
                              className="p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 bg-zinc-950/60 text-zinc-450 hover:text-white transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFarm(farm.id)}
                              className="p-2 rounded-lg border border-zinc-900 hover:border-red-500/20 bg-zinc-950/60 text-zinc-455 hover:text-red-400 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* EXPENSES TAB */}
            {activeTab === 'expenses' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Expenses</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Audit, register, and compile operational expenditure parameters.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingExpense(null);
                      setFormExpAmount('');
                      setFormExpCategory('Miscellaneous');
                      setFormExpNotes('');
                      setFormExpDate(new Date().toISOString().split('T')[0]);
                      setFormExpError(null);
                      setIsExpenseModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-2 border border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Expense</span>
                  </button>
                </div>

                {/* Filter Ledger */}
                <div className="flex flex-col sm:flex-row gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 text-zinc-500 w-4 h-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-[#0d0e12]/60 border border-zinc-900 focus:border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 outline-none"
                      placeholder="Search items..."
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-[200px]">
                    <select
                      className="w-full bg-[#0d0e12]/60 border border-zinc-900 focus:border-zinc-800 rounded-lg py-2 px-3 text-xs text-white outline-none"
                      value={expenseFilterCategory}
                      onChange={(e) => setExpenseFilterCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredExpenses.length === 0 ? (
                  <div className="glass-card border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-white">No expenses matching</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Create logs representing operational bills, supply chains, or employee wages.</p>
                  </div>
                ) : (
                  <div className="bg-zinc-950/20 border border-zinc-900/60 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-900/80 bg-zinc-950/60 text-zinc-400 font-semibold">
                          <th className="p-4 text-xs uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs uppercase tracking-wider">Category</th>
                          <th className="p-4 text-xs uppercase tracking-wider">Description</th>
                          <th className="p-4 text-xs uppercase tracking-wider">Amount</th>
                          <th className="p-4 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map(exp => (
                          <tr key={exp.id} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition-colors duration-150">
                            <td className="p-4 text-zinc-300 font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className="bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded text-xs font-semibold text-zinc-350">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-400 max-w-[200px] truncate">{exp.notes || <em className="text-zinc-650">No notes</em>}</td>
                            <td className="p-4 font-bold text-indigo-400">${Number(exp.amount).toFixed(2)}</td>
                            <td className="p-4 text-right">
                              <div className="inline-flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingExpense(exp);
                                    setFormExpAmount(exp.amount.toString());
                                    setFormExpCategory(exp.category);
                                    setFormExpNotes(exp.notes || '');
                                    setFormExpDate(exp.date.split('T')[0]);
                                    setFormExpError(null);
                                    setIsExpenseModalOpen(true);
                                  }}
                                  className="p-1.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-450 hover:text-red-450 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalExpensesSum > 0 && (
                  <div className="glass-card rounded-xl border border-zinc-900/60 p-6 space-y-4 mt-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-900/60 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">3-Way Capital Allocation Split</h3>
                        <p className="text-zinc-500 text-[11px] font-semibold mt-0.5">Formal distribution mapping of all logged expenses (${totalExpensesSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).</p>
                      </div>
                      <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                        1/3 Ratio Division
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-lg space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Direct Crop Overhead</span>
                        <p className="text-lg font-bold text-white">${Number(splitPartValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-[9px] text-zinc-600 block">Fertilizers, seeds, pesticide supplies</span>
                      </div>
                      <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-lg space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Labor & Fleet Maintenance</span>
                        <p className="text-lg font-bold text-white">${Number(splitPartValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-[9px] text-zinc-600 block">Workers wages, diesel, logistics, transport</span>
                      </div>
                      <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-lg space-y-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Irrigation & Power Utility</span>
                        <p className="text-lg font-bold text-white">${Number(splitPartValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-[9px] text-zinc-600 block">Electricity, water pumps, grid maintenance</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* DAILY ACTIVITIES TAB */}
            {activeTab === 'activities' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Daily Operations</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Audit task assignments, spraying protocols, yields, and structures.</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingActivity(null);
                      setFormActType('Irrigation');
                      setFormActNotes('');
                      setFormActDate(new Date().toISOString().split('T')[0]);
                      setFormActFarmId(farms.length > 0 ? farms[0].id.toString() : '');
                      setFormActPestName('None');
                      setFormActPestQty('None');
                      setFormActPestTime('None');
                      setFormActError(null);
                      setIsActivityModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-2 border border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Operation</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 text-zinc-500 w-4 h-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-[#0d0e12]/60 border border-zinc-900 focus:border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-zinc-600 outline-none"
                      placeholder="Search descriptions..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-[200px]">
                    <select
                      className="w-full bg-[#0d0e12]/60 border border-zinc-900 focus:border-zinc-800 rounded-lg py-2 px-3 text-xs text-white outline-none"
                      value={activityFilterFarmId}
                      onChange={(e) => setActivityFilterFarmId(e.target.value)}
                    >
                      <option value="">All Farms</option>
                      {farms.map(f => (
                        <option key={f.id} value={f.id.toString()}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="glass-card border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                      <ClipboardList className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-white">No operations recorded</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Register irrigation, soil treatments, or pruning sessions to document farm progression.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-zinc-800 pl-6 ml-3 space-y-6">
                    {filteredActivities.map(act => (
                      <div key={act.id} className="relative group">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border border-[#05060b] group-hover:bg-indigo-500 transition-colors duration-150" />

                        <div className="glass-card border border-zinc-900/60 rounded-xl p-5 hover:border-indigo-500/20 transition-all duration-300">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getActivityIndicatorColor(act.activityType)}`}>
                                  {act.activityType}
                                </span>
                                <span className="text-xs text-zinc-500 font-semibold">{act.farm?.name}</span>
                              </div>
                              <span className="text-[10px] text-zinc-600 block">{new Date(act.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingActivity(act);
                                  setFormActType(act.activityType);
                                  setFormActNotes(act.notes);
                                  setFormActDate(act.date.split('T')[0]);
                                  setFormActFarmId(act.farm?.id.toString() || '');
                                  setFormActPestName(act.pesticideName || 'None');
                                  setFormActPestQty(act.pesticideQuantity || 'None');
                                  setFormActPestTime(act.pesticideTime || 'None');
                                  setFormActError(null);
                                  setIsActivityModalOpen(true);
                                }}
                                className="p-1.5 rounded bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="p-1.5 rounded bg-zinc-955 border border-zinc-900 text-zinc-400 hover:text-red-400 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{act.notes}</p>
                          {act.pesticideName && act.pesticideName !== 'None' && (
                            <div className="mt-3 p-3 bg-zinc-950/40 border border-zinc-900 rounded-lg text-xs space-y-1">
                              <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Pesticide Application Telemetry</p>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div><span className="text-zinc-500">Name:</span> <strong className="text-zinc-300">{act.pesticideName}</strong></div>
                                <div><span className="text-zinc-500">Qty:</span> <strong className="text-zinc-300">{act.pesticideQuantity}</strong></div>
                                <div><span className="text-zinc-500">Time:</span> <strong className="text-zinc-300">{act.pesticideTime}</strong></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* GALLERY TAB */}
            {activeTab === 'gallery' && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Holdings Gallery</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Upload and catalog photographs representing crop stages.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadCaption('');
                      setUploadFarmId(farms.length > 0 ? farms[0].id.toString() : '');
                      setUploadError(null);
                      setIsUploadModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-2 border border-indigo-500/30"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                  <div className="w-full sm:w-[280px]">
                    <select
                      className="w-full bg-[#0d0e12]/60 border border-zinc-900 focus:border-zinc-800 rounded-lg py-2 px-3 text-xs text-white outline-none"
                      value={galleryFilterFarmId}
                      onChange={(e) => setGalleryFilterFarmId(e.target.value)}
                    >
                      <option value="">All Farms</option>
                      {farms.map(f => (
                        <option key={f.id} value={f.id.toString()}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredGalleryImages.length === 0 ? (
                  <div className="glass-card border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                      <ImageIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-white">No images archived</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Upload crop checks, machinery configurations, or soil setups to keep visual logs.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGalleryImages.map(img => (
                      <div
                        key={img.id}
                        onClick={() => setActiveLightboxImage(img)}
                        className="glass-card rounded-xl border border-zinc-900/60 overflow-hidden relative group cursor-pointer hover:border-indigo-500/20 transition-all duration-300"
                      >
                        <div className="h-[200px] overflow-hidden relative bg-[#090d16]">
                          <img
                            src={`http://16.112.61.17:3000/uploads/${img.filename}`}
                            alt={img.caption}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => handleDeleteImage(img.id, e)}
                              className="p-1.5 rounded-lg bg-red-500 text-white shadow-md hover:bg-red-650 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-xs font-semibold text-zinc-200 line-clamp-2 leading-relaxed">
                            {img.caption || <em className="text-zinc-500">No caption</em>}
                          </p>
                          <div className="flex justify-between items-center text-[10px] text-zinc-500">
                            <span>{new Date(img.uploadedAt).toLocaleDateString()}</span>
                            {img.farm && <span className="text-indigo-400 font-semibold">{img.farm.name}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* DISEASES TAB */}
            {activeTab === 'diseases' && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Crop Disease Tracker</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Register incidents and analyze weather telemetry parameters recorded at detection.</p>
                  </div>
                  <button
                    onClick={openDiseaseModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-2 border border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Outbreak</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900/60">
                  <div className="w-full sm:w-[280px]">
                    <select
                      className="w-full bg-[#0d0e12]/60 border border-zinc-900 focus:border-zinc-800 rounded-lg py-2 px-3 text-xs text-white outline-none"
                      value={diseaseFilterFarmId}
                      onChange={(e) => setDiseaseFilterFarmId(e.target.value)}
                    >
                      <option value="">All Farms</option>
                      {farms.map(f => (
                        <option key={f.id} value={f.id.toString()}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredDiseases.length === 0 ? (
                  <div className="glass-card border border-zinc-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4">
                      <Bug className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-white">No registered outbreaks</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Record crop disease infections. Telemetry will automatically log humidity, rain, and heat variables.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDiseases.map(event => {
                      const isHighSeverity = event.temp > 30 || event.humidity > 80;
                      return (
                        <div
                          key={event.id}
                          onClick={() => setActiveLightboxImage({ ...event, caption: `${event.diseaseName} on ${event.farm?.name}` })}
                          className="glass-card rounded-xl border border-zinc-900/60 overflow-hidden relative group cursor-pointer hover:border-indigo-500/20 transition-all duration-300"
                        >
                          <div className="h-[170px] overflow-hidden relative bg-[#090d16]">
                            <img
                              src={`http://16.112.61.17:3000/uploads/${event.filename}`}
                              alt={event.diseaseName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${isHighSeverity ? 'bg-red-500 text-white shadow-md' : 'bg-amber-500 text-white shadow-md'
                                }`}>
                                {isHighSeverity ? 'High Danger' : 'Warning'}
                              </span>
                            </div>
                            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={(e) => handleDeleteDisease(event.id, e)}
                                className="p-1.5 rounded-lg bg-red-650 text-white shadow-md hover:bg-red-750 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-4">
                            <div>
                              <h3 className="text-sm font-bold text-white tracking-tight">{event.diseaseName}</h3>
                              <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">{event.farm?.name}</p>
                            </div>

                            {/* Weather grid */}
                            <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-2 rounded-lg border border-zinc-900/80 text-center">
                              <div className="space-y-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold block uppercase">Heat</span>
                                <span className="text-[11px] font-bold text-zinc-350">{Number(event.temp)}°C</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold block uppercase">Humid</span>
                                <span className="text-[11px] font-bold text-zinc-350">{event.humidity}%</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold block uppercase">Rain</span>
                                <span className="text-[11px] font-bold text-zinc-350">{Number(event.rainfall)}mm</span>
                              </div>
                            </div>

                            <span className="text-[9px] text-zinc-500 block">Logged: {new Date(event.detectedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* HELP & SUPPORT TAB */}
            {activeTab === 'support' && (
              <>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Help & Support</h1>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Get in touch with support engineers at Daruru Farms Private Limited.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Contact Info Cards */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card rounded-xl border border-zinc-900/60 p-5 space-y-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Email Inquiries</h4>
                        <a
                          href="mailto:darurugirish@gmail.com"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold block mt-1 transition-colors"
                        >
                          darurugirish@gmail.com
                        </a>
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-semibold">Average SLA Response: &lt; 24 Hours</span>
                    </div>

                    <div className="glass-card rounded-xl border border-zinc-900/60 p-5 space-y-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Direct Hotline</h4>
                        <a
                          href="tel:9391177307"
                          className="text-xs text-violet-400 hover:text-violet-300 font-semibold block mt-1 transition-colors"
                        >
                          +91 93911 77307
                        </a>
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-semibold">Active: Mon - Fri, 9AM - 6PM IST</span>
                    </div>

                    <div className="glass-card rounded-xl border border-zinc-900/60 p-5 space-y-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">DaruruFarms HQ</h4>
                        <p className="text-xs text-zinc-400 leading-normal mt-1">
                          Daruru Farms Private Limited<br />
                          Agricultural Engineering Block
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission inquiry form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card rounded-xl border border-zinc-900/60 p-6 space-y-6">
                      <h3 className="text-base font-bold text-white border-b border-zinc-900/60 pb-3">Submit support ticket</h3>

                      {contactFormError && (
                        <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg">
                          {contactFormError}
                        </div>
                      )}

                      <form onSubmit={handleContactSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Your Name</label>
                            <input
                              type="text"
                              className="w-full bg-[#0d0e12]/60 border border-zinc-900 rounded-lg py-2.5 px-3 text-xs text-zinc-400 outline-none select-none pointer-events-none"
                              value={profile?.name || ''}
                              disabled
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                            <input
                              type="text"
                              className="w-full bg-[#0d0e12]/60 border border-zinc-900 rounded-lg py-2.5 px-3 text-xs text-zinc-400 outline-none select-none pointer-events-none"
                              value={profile?.email || ''}
                              disabled
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subject / Concern</label>
                          <input
                            type="text"
                            className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                            placeholder="E.g., Drip line calibration error, new holding limit"
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Detailed Message</label>
                          <textarea
                            className="w-full min-h-[120px] bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none resize-none"
                            placeholder="Describe your inquiry or requested credentials here..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            required
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={contactSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.25)] hover:shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center justify-center border border-indigo-500/30"
                          >
                            {contactSubmitting ? 'Sending Ticket...' : 'File Support Inquiry'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Support history table */}
                    {contactInquiries.length > 0 && (
                      <div className="glass-card rounded-xl border border-zinc-900/60 p-6 space-y-4">
                        <h3 className="text-base font-bold text-white pb-1">Support History</h3>
                        <div className="space-y-3 overflow-y-auto max-h-[300px]">
                          {contactInquiries.map(ticket => (
                            <div key={ticket.id} className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl space-y-2">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <h4 className="text-xs font-bold text-white">{ticket.subject}</h4>
                                <span className="text-[9px] text-zinc-500 font-semibold">{new Date(ticket.submittedAt).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* IDENTITY TAB */}
            {activeTab === 'profile' && (
              <>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">Identity Credentials</h1>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Review active connection details and session authorization tokens.</p>
                </div>

                <div className="glass-card border border-zinc-900 rounded-2xl p-6 max-w-2xl space-y-6">
                  <h2 className="text-base font-bold text-white border-b border-zinc-900/60 pb-3">Session Profile</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Account Name</span>
                      <p className="text-sm font-semibold text-zinc-300 mt-1">{profile?.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Email Address</span>
                      <p className="text-sm font-semibold text-zinc-300 mt-1">{profile?.email}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Bcrypt Database Hash</span>
                      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg text-xs font-mono text-zinc-400 break-all select-all mt-1 leading-relaxed">
                        {profile?.password || 'Token session'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3 text-xs leading-normal text-zinc-400">
                    <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Security Policy:</strong> This hash represents your encrypted credentials retrieved directly from MySQL. The dashboard token session is authorized and encrypted. Never distribute this credential payload.
                    </p>
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* FARM MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[480px] rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-white mb-5">{editingFarm ? 'Update Farm Holding' : 'Register New Farm Holding'}</h2>

            {formError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{formError}</div>}

            <form onSubmit={handleFarmSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Farm Name</label>
                <input
                  type="text"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                  placeholder="E.g., North Valley Orchards"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Address Location</label>
                <input
                  type="text"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                  placeholder="E.g., 551 Sector B, California"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Acreage</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white outline-none"
                    placeholder="E.g., 42.5"
                    value={formTotalAcres}
                    onChange={(e) => setFormTotalAcres(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Number of Trees</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white outline-none"
                    placeholder="E.g., 850"
                    value={formNumberOfTrees}
                    onChange={(e) => setFormNumberOfTrees(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Crop Variety</label>
                <input
                  type="text"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                  placeholder="E.g., Honeycrisp Apples"
                  value={formCropVariety}
                  onChange={(e) => setFormCropVariety(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Crop Season Start</label>
                <input
                  type="datetime-local"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white outline-none"
                  value={formCropSeasonStart}
                  onChange={(e) => setFormCropSeasonStart(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-800 hover:border-zinc-750 bg-zinc-950 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-indigo-500/20">
                  {formSubmitting ? 'Saving...' : editingFarm ? 'Save Changes' : 'Create Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[440px] rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button onClick={() => setIsExpenseModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-white mb-5">{editingExpense ? 'Modify Ledger Entry' : 'Log Operational Expense'}</h2>

            {formExpError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{formExpError}</div>}

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Amount ($)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white outline-none"
                    placeholder="E.g., 250.00"
                    value={formExpAmount}
                    onChange={(e) => setFormExpAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                  <select
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white outline-none"
                    value={formExpCategory}
                    onChange={(e) => setFormExpCategory(e.target.value)}
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Log Date</label>
                <input
                  type="date"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white outline-none"
                  value={formExpDate}
                  onChange={(e) => setFormExpDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Overhead details</label>
                <input
                  type="text"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none"
                  placeholder="Purchased winter fertilizer"
                  value={formExpNotes}
                  onChange={(e) => setFormExpNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 border border-zinc-800 hover:border-zinc-750 bg-zinc-950 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={formExpSubmitting} className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-indigo-500/20">
                  {formExpSubmitting ? 'Logging...' : editingExpense ? 'Update' : 'Log Cost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTIVITY MODAL */}
      {isActivityModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[460px] rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button onClick={() => setIsActivityModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-white mb-5">{editingActivity ? 'Revise Operation Log' : 'Record Farm Operation'}</h2>

            {formActError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{formActError}</div>}

            <form onSubmit={handleActivitySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Operation Date</label>
                  <input
                    type="date"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white outline-none"
                    value={formActDate}
                    onChange={(e) => setFormActDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Farm</label>
                  <select
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white outline-none"
                    value={formActFarmId}
                    onChange={(e) => setFormActFarmId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Farm</option>
                    {farms.map(f => (
                      <option key={f.id} value={f.id.toString()}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Activity Type</label>
                <select
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white outline-none"
                  value={formActType}
                  onChange={(e) => setFormActType(e.target.value)}
                  required
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Pesticide Application Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pesticide Name</label>
                  <input
                    type="text"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                    placeholder="E.g. None"
                    value={formActPestName}
                    onChange={(e) => setFormActPestName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quantity</label>
                  <input
                    type="text"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                    placeholder="E.g. None"
                    value={formActPestQty}
                    onChange={(e) => setFormActPestQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Time (e.g. AM/PM)</label>
                  <input
                    type="text"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                    placeholder="E.g. None"
                    value={formActPestTime}
                    onChange={(e) => setFormActPestTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Attached Log Details</label>
                <textarea
                  className="w-full min-h-[100px] bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-700 outline-none resize-none"
                  placeholder="E.g., Drip line inspection complete. Added nitrogen mix in quadrant C."
                  value={formActNotes}
                  onChange={(e) => setFormActNotes(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-4 py-2 border border-zinc-800 hover:border-zinc-750 bg-zinc-950 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={formActSubmitting} className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-indigo-500/20">
                  {formActSubmitting ? 'Logging...' : editingActivity ? 'Save' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[440px] rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-white mb-5">Upload Telemetry Photo</h2>

            {uploadError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{uploadError}</div>}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div
                onClick={() => document.getElementById('fileUploadGallery')?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-xs font-semibold text-zinc-300">Drag and drop file, or browse</p>
                <span className="text-[10px] text-zinc-500 mt-1">Supports PNG, JPEG, WEBP under 5MB</span>
                <input
                  id="fileUploadGallery"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <span className="text-[11px] font-bold text-indigo-400 mt-3 truncate max-w-full">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Associate with Farm (Optional)</label>
                <select
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white outline-none"
                  value={uploadFarmId}
                  onChange={(e) => setUploadFarmId(e.target.value)}
                >
                  <option value="">No Associated Farm</option>
                  {farms.map(f => (
                    <option key={f.id} value={f.id.toString()}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Caption / Notes</label>
                <input
                  type="text"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-705 outline-none"
                  placeholder="Soil testing in quadrant 4"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 border border-zinc-800 hover:border-zinc-750 bg-zinc-950 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={uploadSubmitting} className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-indigo-500/20">
                  {uploadSubmitting ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {isDiseaseModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[450px] rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button onClick={() => setIsDiseaseModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-white mb-5">Log Disease Outbreak</h2>

            {diseaseErrorMsg && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{diseaseErrorMsg}</div>}

            <form onSubmit={handleDiseaseSubmit} className="space-y-4">
              <div
                onClick={() => document.getElementById('fileUploadDisease')?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-xs font-semibold text-zinc-300">Upload crop infection photo</p>
                <span className="text-[10px] text-zinc-500 mt-1">Supports PNG, JPEG, WEBP under 5MB</span>
                <input
                  id="fileUploadDisease"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDiseaseFileChange}
                />
                {diseaseFile && (
                  <span className="text-[11px] font-bold text-red-455 mt-3 truncate max-w-full">
                    {diseaseFile.name} ({(diseaseFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Disease / Infection Name</label>
                <input
                  type="text"
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3.5 text-sm text-white placeholder-zinc-705 outline-none"
                  placeholder="E.g., Powdery Mildew"
                  value={diseaseNameInput}
                  onChange={(e) => setDiseaseNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Farm</label>
                <select
                  className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2.5 px-3 text-sm text-white outline-none"
                  value={diseaseFarmId}
                  onChange={(e) => setDiseaseFarmId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Farm</option>
                  {farms.map(f => (
                    <option key={f.id} value={f.id.toString()}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Temp (°C)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                    value={diseaseTempInput}
                    onChange={(e) => setDiseaseTempInput(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Humid (%)</label>
                  <input
                    type="number"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                    value={diseaseHumidityInput}
                    onChange={(e) => setDiseaseHumidityInput(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Rain (mm)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-[#0d0e12]/60 border border-zinc-800 focus:border-zinc-700 rounded-lg py-2 px-2.5 text-xs text-white outline-none"
                    value={diseaseRainfallInput}
                    onChange={(e) => setDiseaseRainfallInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsDiseaseModalOpen(false)} className="px-4 py-2 border border-zinc-800 hover:border-zinc-750 bg-zinc-950 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer">Cancel</button>
                <button type="submit" disabled={diseaseSubmitting} className="bg-red-500 hover:bg-red-450 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center border border-red-400/20">
                  {diseaseSubmitting ? 'Logging...' : 'Log Outbreak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX OVERLAY */}
      {activeLightboxImage && (
        <div
          onClick={() => setActiveLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[850px] relative flex flex-col items-center gap-4"
          >
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={`http://16.112.61.17:3000/uploads/${activeLightboxImage.filename}`}
              alt={activeLightboxImage.caption || activeLightboxImage.diseaseName}
              className="w-full max-h-[70vh] object-contain rounded-lg border border-zinc-900 shadow-2xl"
            />
            <div className="w-full text-center px-4 py-3 bg-[#08090e] border border-zinc-900/60 rounded-xl space-y-2">
              <p className="text-sm font-bold text-white leading-normal">
                {activeLightboxImage.caption || activeLightboxImage.diseaseName || 'Daily Snap'}
              </p>
              <div className="flex justify-center items-center gap-3 text-xs text-zinc-500 font-semibold">
                <span>Date: {new Date(activeLightboxImage.uploadedAt || activeLightboxImage.detectedAt).toLocaleString()}</span>
                {activeLightboxImage.farm && (
                  <>
                    <span>•</span>
                    <span className="text-indigo-400">{activeLightboxImage.farm.name}</span>
                  </>
                )}
              </div>

              {/* Show disease weather telemetry if lightbox image is a disease event */}
              {activeLightboxImage.temp !== undefined && (
                <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-zinc-900/60 text-xs">
                  <span className="text-zinc-400">Temperature: <strong className="text-zinc-200">{Number(activeLightboxImage.temp)}°C</strong></span>
                  <span className="text-zinc-450">Humidity: <strong className="text-zinc-200">{activeLightboxImage.humidity}%</strong></span>
                  <span className="text-zinc-450">Rainfall: <strong className="text-zinc-200">{Number(activeLightboxImage.rainfall)}mm</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* FLOATING CHATBOT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Expanded Chat Dialog */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-[360px] h-[450px] glass-panel border border-zinc-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4 border-gradient"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-[#0a0b10] border-b border-zinc-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight leading-none">Daruru Assistant</h3>
                    <span className="text-[9px] text-zinc-500 font-semibold mt-0.5 block">AI Copilot Node</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded text-zinc-505 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chat History Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`
                        max-w-[80%] rounded-xl px-3 py-2 text-xs leading-normal 
                        ${msg.sender === 'user'
                          ? 'bg-indigo-600 text-white border border-indigo-500/30'
                          : 'bg-zinc-900/60 text-zinc-300 border border-zinc-900'}
                      `}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className="text-[8px] text-zinc-500 block mt-1 text-right">
                        {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {chatTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900/60 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-550 flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendChatMessage}
                className="p-3 bg-[#0a0b10]/60 border-t border-zinc-900 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a question about your farm..."
                  className="flex-1 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white border border-indigo-500/25 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer border transition-all duration-300 active:scale-90
            ${isChatOpen
              ? 'bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800'
              : 'bg-indigo-600 text-white border-indigo-500/30 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]'}
          `}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
