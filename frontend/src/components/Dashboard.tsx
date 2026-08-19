import React, { useEffect, useMemo, useState } from 'react';
import DiseasePredictor, { WeatherOutbreakRisk } from './DiseasePredictor';
import { PricingPlans, PremiumGate } from './PricingPlans';
import { BrandLogo, BRAND_NAME, BRAND_TAGLINE } from './BrandMark';
import { isPremiumActive } from '../plans';
import { ConfirmDialog, EmptyState, severityBadge } from './ui';
import {
  LogOut, User as UserIcon, Shield, LayoutDashboard, Map as MapIcon, Sprout,
  Trees, MapPin, Locate, Plus, Edit2, Trash2, X, Menu, PanelLeftClose, PanelLeftOpen,
  CloudRain, Cloud, Sun, Droplets, Wind, AlertTriangle, Copy, Bot, ChevronDown,
  Activity, IndianRupee, Search, Pencil, Bell,
  ClipboardList, Image as ImageIcon, Upload, Camera, Bug, ArrowUpRight, ArrowDownRight,
  HelpCircle, Phone, Mail, MessageSquare, Send, FileText, ListTodo, Check, Crown
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
  plan?: string | null;
  premiumUntil?: string | null;
  password?: string;
}

interface Farm {
  id: number;
  name: string;
  address: string;
  locationLabel?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  totalAcres: number;
  numberOfTrees: number;
  cropVariety: string;
  cropSeasonStartTime: string;
}

interface PlaceMatch {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
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

interface LabReportUpload {
  id: number;
  title: string;
  category: 'soil' | 'ph' | string;
  filename: string;
  originalName?: string;
  notes?: string;
  uploadedAt: string;
  farm?: Farm | null;
}

interface FarmTodo {
  id: number;
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  done: boolean;
  createdAt: string;
  farm?: Farm | null;
}

interface VisionPrediction {
  id: number;
  imageUrl: string;
  predictedDisease: string;
  confidence: number;
  plantPart: string;
  uncertain: boolean;
  createdAt: string;
  farm?: Farm | null;
}

const PENDING_FARM_LOCATION_KEY = 'daruru_pending_farm_location';
const LOCATION_PROMPT_SKIP_KEY = 'daruru_location_prompt_skipped';

const hasFarmCoordinates = (farm: Farm) => {
  if (farm.latitude == null || farm.longitude == null || farm.latitude === '' || farm.longitude === '') {
    return false;
  }
  return Number.isFinite(Number(farm.latitude)) && Number.isFinite(Number(farm.longitude));
};

const placeLabel = (place: PlaceMatch) =>
  [place.name, place.admin1, place.country].filter(Boolean).join(', ');

const HIGH_CONFIDENCE = 85;

const isHighConfidenceDisease = (row: VisionPrediction) => {
  const name = (row.predictedDisease || '').toLowerCase();
  if (!name || name === 'healthy') return false;
  return Number(row.confidence) > HIGH_CONFIDENCE;
};

const formatPredictedDisease = (name: string) =>
  (name || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const EXPENSE_CATEGORIES = [
  'Fertilizer', 'Pesticides', 'Electricity', 'Diesel', 'Water',
  'Workers', 'Equipment', 'Transportation', 'Miscellaneous'
];

const ACTIVITY_TYPES = [
  'Irrigation', 'Fertilization', 'Pesticide Application', 'Harvesting',
  'Pruning', 'Planting', 'Maintenance', 'Other'
];

const isPesticideLog = (act: { activityType: string; pesticideName?: string }) =>
  act.activityType === 'Pesticide Application' || Boolean(act.pesticideName && act.pesticideName !== 'None');

const formatForDateTimeLocal = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const tzoffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
};

export const Dashboard: React.FC<DashboardProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'farms' | 'expenses' | 'activities' | 'pesticides' | 'gallery' | 'todos' | 'diseases' | 'support' | 'profile' | 'assistant' | 'plans'>('overview');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [diseaseEvents, setDiseaseEvents] = useState<DiseaseEvent[]>([]);
  const [visionPredictions, setVisionPredictions] = useState<VisionPrediction[]>([]);
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([]);
  const [uploadedLabReports, setUploadedLabReports] = useState<LabReportUpload[]>([]);
  const [todos, setTodos] = useState<FarmTodo[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [showRainSeries, setShowRainSeries] = useState(true);
  const [showHumiditySeries, setShowHumiditySeries] = useState(true);
  const [showWindSeries, setShowWindSeries] = useState(true);
  const [showTempSeries, setShowTempSeries] = useState(true);
  const [expenseSort, setExpenseSort] = useState<'date-desc' | 'amount-desc' | 'date-asc'>('date-desc');
  const [expenseFrom, setExpenseFrom] = useState('');
  const [expenseTo, setExpenseTo] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [selectedDisease, setSelectedDisease] = useState<DiseaseEvent | null>(null);
  const [galleryDropActive, setGalleryDropActive] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Search & Filter states
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilterFarmId, setActivityFilterFarmId] = useState('');
  const [pesticideSearch, setPesticideSearch] = useState('');
  const [pesticideFilterFarmId, setPesticideFilterFarmId] = useState('');
  const [loggingPesticide, setLoggingPesticide] = useState(false);
  const [galleryFilterFarmId, setGalleryFilterFarmId] = useState('');
  const [diseaseFilterFarmId, setDiseaseFilterFarmId] = useState('');
  const [labReportFilter, setLabReportFilter] = useState<'all' | 'soil' | 'ph'>('all');
  const [openLabReportId, setOpenLabReportId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<'soil' | 'ph'>('soil');
  const [reportNotes, setReportNotes] = useState('');
  const [reportFarmId, setReportFarmId] = useState('');
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<{ title: string; filename: string } | null>(null);
  const [todoTitle, setTodoTitle] = useState('');
  const [todoNotes, setTodoNotes] = useState('');
  const [todoDue, setTodoDue] = useState('');
  const [todoFarmId, setTodoFarmId] = useState('');
  const [todoSubmitting, setTodoSubmitting] = useState(false);
  const [todoShowDone, setTodoShowDone] = useState(true);
  const [pendingGalleryAnalyze, setPendingGalleryAnalyze] = useState<{ id: number; filename: string; caption?: string; farmId?: number } | null>(null);

  // Modals visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTotalAcres, setFormTotalAcres] = useState('');
  const [formNumberOfTrees, setFormNumberOfTrees] = useState('');
  const [formCropVariety, setFormCropVariety] = useState('');
  const [formCropSeasonStart, setFormCropSeasonStart] = useState('');
  const [formLocationLabel, setFormLocationLabel] = useState('');
  const [formLatitude, setFormLatitude] = useState('');
  const [formLongitude, setFormLongitude] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationPromptFarmId, setLocationPromptFarmId] = useState('all');
  const [locationQuery, setLocationQuery] = useState('');
  const [locationLabelInput, setLocationLabelInput] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationMatches, setLocationMatches] = useState<PlaceMatch[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationLocating, setLocationLocating] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: Date; kind?: 'farm' | 'weather' | 'ai' }>>([
    {
      sender: 'bot',
      text: 'I can answer from your logged farm data, current weather telemetry, and general crop guidance. I will not invent numbers that are not in your records.',
      time: new Date(),
      kind: 'ai',
    }
  ]);
  const [chatTyping, setChatTyping] = useState(false);

  const [activeLightboxImage, setActiveLightboxImage] = useState<any | null>(null);

  // File and Modal Helper triggers
  const acceptImageFile = (file: File) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      acceptImageFile(e.target.files[0]);
    }
  };

  const handleDeleteImage = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      title: 'Delete photo',
      message: 'This photo will be removed from the gallery and cannot be restored.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch(`/api/gallery/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Could not remove this photo.');
          toast.success('Photo removed');
          refreshGallery();
        } catch (err: any) {
          toast.error('Could not remove this photo.');
        }
      },
    });
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
      const profileRes = await fetch(`/api/auth/profile`, {
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

      const [farmsRes, expensesRes, activitiesRes, galleryRes, diseaseRes, contactRes, dashboardRes, reportsRes, todosRes, predictionsRes] = await Promise.all([
        fetch(`/api/farms`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/daily-activities`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/gallery`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/disease-management`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/contact`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/lab-reports`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/todos`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/disease-management/predictions`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      if (farmsRes.ok) setFarms(await farmsRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (galleryRes.ok) setGalleryImages(await galleryRes.json());
      if (diseaseRes.ok) setDiseaseEvents(await diseaseRes.json());
      if (contactRes.ok) setContactInquiries(await contactRes.json());
      if (dashboardRes.ok) setDashboardData(await dashboardRes.json());
      if (reportsRes.ok) setUploadedLabReports(await reportsRes.json());
      if (todosRes.ok) setTodos(await todosRes.json());
      if (predictionsRes.ok) setVisionPredictions(await predictionsRes.json());

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

  useEffect(() => {
    if (loading) return;
    if (sessionStorage.getItem(LOCATION_PROMPT_SKIP_KEY) === '1') return;
    const missing = farms.filter((farm) => !hasFarmCoordinates(farm));
    if (farms.length === 0 || missing.length > 0) {
      setLocationPromptFarmId(missing.length === 1 ? String(missing[0].id) : 'all');
      setShowLocationPrompt(true);
    }
  }, [loading, farms, token]);

  // Refresh lists
  const refreshFarms = async () => {
    const res = await fetch(`/api/farms`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setFarms(await res.json());
  };

  const refreshExpenses = async () => {
    const res = await fetch(`/api/expenses`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setExpenses(await res.json());
  };

  const refreshActivities = async () => {
    const res = await fetch(`/api/daily-activities`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setActivities(await res.json());
  };

  const refreshGallery = async () => {
    const res = await fetch(`/api/gallery`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setGalleryImages(await res.json());
  };

  const refreshDiseases = async () => {
    const res = await fetch(`/api/disease-management`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setDiseaseEvents(await res.json());
  };

  const refreshPredictions = async () => {
    const res = await fetch(`/api/disease-management/predictions`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setVisionPredictions(await res.json());
  };

  const refreshLabReports = async () => {
    const res = await fetch(`/api/lab-reports`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setUploadedLabReports(await res.json());
  };

  const refreshTodos = async () => {
    const res = await fetch(`/api/todos`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setTodos(await res.json());
  };

  const refreshSupportHistory = async () => {
    const res = await fetch(`/api/contact`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setContactInquiries(await res.json());
  };

  const refreshDashboardData = async () => {
    const res = await fetch(`/api/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) setDashboardData(await res.json());
  };

  const applyPlaceToPrompt = (place: PlaceMatch) => {
    const label = placeLabel(place);
    setLocationLabelInput(label);
    setLocationQuery(label);
    setLocationLat(String(place.latitude));
    setLocationLng(String(place.longitude));
    setLocationMatches([]);
    setLocationError(null);
  };

  const searchFarmPlaces = async () => {
    const query = locationQuery.trim();
    if (query.length < 2) {
      setLocationError('Enter a city, village, or district name.');
      return;
    }
    setLocationSearching(true);
    setLocationError(null);
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
      );
      if (!res.ok) throw new Error('Could not look up that place.');
      const data = await res.json();
      const results: PlaceMatch[] = (data.results || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
        admin1: row.admin1,
        country: row.country,
      }));
      if (results.length === 0) {
        setLocationMatches([]);
        setLocationError('No matching place found. Try a nearby city.');
        return;
      }
      setLocationMatches(results);
      applyPlaceToPrompt(results[0]);
      setLocationMatches(results);
    } catch (err: any) {
      setLocationError(err.message || 'Could not look up that place.');
    } finally {
      setLocationSearching(false);
    }
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('This browser cannot share GPS location.');
      return;
    }
    setLocationLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationLat(lat.toFixed(6));
        setLocationLng(lng.toFixed(6));
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          if (res.ok) {
            const data = await res.json();
            const label = [data.locality || data.city, data.principalSubdivision, data.countryName]
              .filter(Boolean)
              .join(', ');
            if (label) {
              setLocationLabelInput(label);
              setLocationQuery(label);
            }
          }
        } catch {
          // Coordinates are enough even if the place name lookup fails.
        } finally {
          setLocationLocating(false);
        }
      },
      () => {
        setLocationLocating(false);
        setLocationError('Location permission was denied. Type the farm place instead.');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const saveFarmLocation = async () => {
    const latitude = Number(locationLat);
    const longitude = Number(locationLng);
    const label = locationLabelInput.trim() || locationQuery.trim();
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !label) {
      setLocationError('Search or locate the farm first so we can save a place and coordinates.');
      return;
    }

    const payload = { locationLabel: label, latitude, longitude };
    const missing = farms.filter((farm) => !hasFarmCoordinates(farm));
    const targets =
      locationPromptFarmId === 'all'
        ? (missing.length > 0 ? missing : farms)
        : farms.filter((farm) => String(farm.id) === locationPromptFarmId);

    setLocationSaving(true);
    setLocationError(null);
    try {
      if (targets.length === 0) {
        localStorage.setItem(PENDING_FARM_LOCATION_KEY, JSON.stringify(payload));
      } else {
        for (const farm of targets) {
          const response = await fetch(`/api/farms/${farm.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: farm.name,
              address: farm.address || label,
              locationLabel: label,
              latitude,
              longitude,
              totalAcres: Number(farm.totalAcres),
              numberOfTrees: Number(farm.numberOfTrees),
              cropVariety: farm.cropVariety,
              cropSeasonStartTime: farm.cropSeasonStartTime,
            }),
          });
          if (!response.ok) throw new Error('Could not save farm location.');
        }
        localStorage.removeItem(PENDING_FARM_LOCATION_KEY);
      }
      sessionStorage.setItem(LOCATION_PROMPT_SKIP_KEY, '1');
      setShowLocationPrompt(false);
      toast.success('Farm location saved for weather and API data');
      await refreshFarms();
      await refreshDashboardData();
    } catch (err: any) {
      setLocationError(err.message || 'Could not save farm location.');
    } finally {
      setLocationSaving(false);
    }
  };

  const skipLocationPrompt = () => {
    sessionStorage.setItem(LOCATION_PROMPT_SKIP_KEY, '1');
    setShowLocationPrompt(false);
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
    const pendingRaw = localStorage.getItem(PENDING_FARM_LOCATION_KEY);
    let pending: { locationLabel?: string; latitude?: number; longitude?: number } | null = null;
    if (pendingRaw) {
      try {
        pending = JSON.parse(pendingRaw);
      } catch {
        pending = null;
      }
    }

    const latitude = formLatitude.trim() ? Number(formLatitude) : pending?.latitude;
    const longitude = formLongitude.trim() ? Number(formLongitude) : pending?.longitude;
    const locationLabel = formLocationLabel.trim() || pending?.locationLabel || undefined;

    const body: Record<string, unknown> = {
      name: formName,
      address: formAddress,
      totalAcres: acres,
      numberOfTrees: trees,
      cropVariety: formCropVariety,
      cropSeasonStartTime: new Date(formCropSeasonStart).toISOString(),
    };
    if (locationLabel) body.locationLabel = locationLabel;
    if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) {
      body.latitude = Number(latitude);
      body.longitude = Number(longitude);
    }

    try {
      const url = editingFarm ? `/api/farms/${editingFarm.id}` : `/api/farms`;
      const method = editingFarm ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Saving farm failed');

      toast.success(editingFarm ? 'Farm parameters updated' : 'New farm registered');
      if (body.latitude != null && body.longitude != null) {
        localStorage.removeItem(PENDING_FARM_LOCATION_KEY);
      }
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
    setConfirmDialog({
      title: 'Delete holding',
      message: 'This holding will be removed. Linked logs and photos may also be affected.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch(`/api/farms/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Could not delete this holding.');
          toast.success('Holding deleted');
          refreshFarms();
          refreshDashboardData();
        } catch (err: any) {
          toast.error('Could not delete this holding.');
        }
      },
    });
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
      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : `/api/expenses`;
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
    setConfirmDialog({
      title: 'Delete expense',
      message: 'This expense will be permanently removed from the ledger.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch(`/api/expenses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Could not remove this expense.');
          toast.success('Expense removed');
          refreshExpenses();
          refreshDashboardData();
        } catch (err: any) {
          toast.error('Could not remove this expense.');
        }
      },
    });
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormActError(null);

    if (!formActFarmId || !formActNotes.trim()) {
      setFormActError('Date, farm, and notes are required.');
      return;
    }
    if (loggingPesticide || formActType === 'Pesticide Application') {
      if (!formActPestName.trim() || formActPestName.trim().toLowerCase() === 'none') {
        setFormActError('Enter the pesticide name.');
        return;
      }
    }

    setFormActSubmitting(true);
    const body = {
      date: formActDate,
      activityType: loggingPesticide ? 'Pesticide Application' : formActType,
      notes: formActNotes,
      farmId: parseInt(formActFarmId),
      pesticideName: formActPestName || 'None',
      pesticideQuantity: formActPestQty || 'None',
      pesticideTime: formActPestTime || 'None',
    };

    try {
      const url = editingActivity ? `/api/daily-activities/${editingActivity.id}` : `/api/daily-activities`;
      const method = editingActivity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Logging activity failed');

      toast.success(editingActivity ? 'Log revised' : loggingPesticide ? 'Pesticide spray recorded' : 'Operation recorded');
      setIsActivityModalOpen(false);
      setLoggingPesticide(false);
      refreshActivities();
      refreshDashboardData();
    } catch (err: any) {
      setFormActError(err.message || 'Operation failed');
    } finally {
      setFormActSubmitting(false);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    setConfirmDialog({
      title: 'Delete this log',
      message: 'This log will be permanently removed.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch(`/api/daily-activities/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Could not remove this log.');
          toast.success('Log removed');
          refreshActivities();
          refreshDashboardData();
        } catch (err: any) {
          toast.error('Could not remove this log.');
        }
      },
    });
  };

  const openActivityLog = (act?: DailyActivity, pesticide = false) => {
    setLoggingPesticide(pesticide);
    setEditingActivity(act || null);
    setFormActType(pesticide ? 'Pesticide Application' : (act?.activityType || 'Irrigation'));
    setFormActNotes(act?.notes || '');
    setFormActDate(act ? act.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormActFarmId(act?.farm?.id?.toString() || (farms[0]?.id?.toString() || ''));
    setFormActPestName(act?.pesticideName && act.pesticideName !== 'None' ? act.pesticideName : pesticide ? '' : 'None');
    setFormActPestQty(act?.pesticideQuantity && act.pesticideQuantity !== 'None' ? act.pesticideQuantity : pesticide ? '' : 'None');
    setFormActPestTime(act?.pesticideTime && act.pesticideTime !== 'None' ? act.pesticideTime : pesticide ? '' : 'None');
    setFormActError(null);
    setIsActivityModalOpen(true);
  };

  const handleLabReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    if (!reportFile) {
      setReportError('Choose a PDF of the soil fertility or pH report.');
      return;
    }
    if (reportFile.type !== 'application/pdf' && !reportFile.name.toLowerCase().endsWith('.pdf')) {
      setReportError('Only PDF files can be uploaded here.');
      return;
    }
    setReportSubmitting(true);
    const formData = new FormData();
    formData.append('file', reportFile);
    formData.append('title', reportTitle.trim() || reportFile.name.replace(/\.pdf$/i, ''));
    formData.append('category', reportCategory);
    formData.append('notes', reportNotes);
    if (reportFarmId) formData.append('farmId', reportFarmId);
    try {
      const response = await fetch('/api/lab-reports/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Could not upload this report.');
      }
      toast.success('Report uploaded');
      setIsReportModalOpen(false);
      setReportFile(null);
      setReportTitle('');
      setReportNotes('');
      refreshLabReports();
    } catch (err: any) {
      setReportError(err.message || 'Could not upload this report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = todoTitle.trim();
    if (!title) {
      toast.error('Write the upcoming work first.');
      return;
    }
    setTodoSubmitting(true);
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          notes: todoNotes.trim() || undefined,
          dueDate: todoDue || undefined,
          farmId: todoFarmId ? Number(todoFarmId) : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Could not save this to-do.');
      }
      setTodoTitle('');
      setTodoNotes('');
      setTodoDue('');
      toast.success('Added to upcoming work');
      refreshTodos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTodoSubmitting(false);
    }
  };

  const handleToggleTodo = async (todo: FarmTodo) => {
    try {
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ done: !todo.done }),
      });
      if (!response.ok) throw new Error('Could not update this to-do.');
      refreshTodos();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteTodo = (id: number) => {
    setConfirmDialog({
      title: 'Remove this to-do',
      message: 'This upcoming work item will be deleted.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Could not delete this to-do.');
          toast.success('To-do removed');
          refreshTodos();
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
  };

  const handleDeleteLabReport = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      title: 'Delete report',
      message: 'This PDF will be removed and cannot be restored.',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const response = await fetch(`/api/lab-reports/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Could not delete this report.');
          toast.success('Report removed');
          refreshLabReports();
        } catch (err: any) {
          toast.error(err.message);
        }
      },
    });
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
      const response = await fetch(`/api/gallery/upload`, {
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
      const response = await fetch(`/api/disease-management/upload`, {
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
    setConfirmDialog({
      title: 'Delete disease record',
      message: 'This disease record and its photo will be removed from the tracker.',
      onConfirm: async () => {
        setConfirmDialog(null);
        setSelectedDisease(null);
        try {
          const response = await fetch(`/api/disease-management/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Could not delete this record.');
          toast.success('Disease record removed');
          refreshDiseases();
          refreshDashboardData();
        } catch (err: any) {
          toast.error('Could not delete this record.');
        }
      },
    });
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
      const response = await fetch(`/api/contact`, {
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

    setTimeout(() => {
      setChatTyping(false);
      const query = userMessage.toLowerCase();
      let reply = 'I can only answer from your logged farm records, weather telemetry, and general crop guidance. Try a suggested question below.';
      let kind: 'farm' | 'weather' | 'ai' = 'ai';

      if (query.includes('hello') || query.includes('hi ') || query === 'hi' || query.includes('hey')) {
        reply = 'Hello. Ask about expenses, diseases, water, irrigation, or recent activities. Answers come from your records.';
      } else if (query.includes('spend') || query.includes('expens') || query.includes('ledger')) {
        kind = 'farm';
        const july = expenses.filter((exp) => {
          const d = new Date(exp.date);
          return d.getFullYear() === 2026 && d.getMonth() === 6;
        }).reduce((s, exp) => s + Number(exp.amount), 0);
        reply = `Your recorded expenses total ₹${totalExpensesSum.toLocaleString()}. July 2026 spending in the ledger is ₹${Math.round(july).toLocaleString()}.`;
      } else if (query.includes('disease') || query.includes('bug') || query.includes('outbreak')) {
        kind = 'farm';
        const names = [...new Set(diseaseEvents.map((d) => d.diseaseName))].slice(0, 5).join(', ') || 'none logged';
        reply = `There are ${diseaseEvents.length} disease records. Names on file: ${names}. Severity is inferred from temperature and humidity at detection, not from a separate status API.`;
      } else if (query.includes('water') || query.includes('irrigation')) {
        kind = 'farm';
        const jul = dashboardData?.charts?.waterUsageRainfall?.find((row: any) => row.month === 'Jul');
        reply = jul
          ? `July irrigation in the dashboard series is ${jul.water} kL, with ${jul.rain} mm rainfall. I do not have a tomorrow irrigation recommendation from the API.`
          : `You have ${activities.filter((a) => a.activityType === 'Irrigation').length} irrigation logs. No irrigation recommendation engine is connected.`;
      } else if (query.includes('weather') || query.includes('temp') || query.includes('rain') || query.includes('tomorrow')) {
        kind = 'weather';
        reply = `Telemetry weather: ${dashboardData?.weather?.temp ?? '—'}°C, ${dashboardData?.weather?.condition || 'unknown'}, humidity ${dashboardData?.weather?.humidity ?? '—'}%, wind ${dashboardData?.weather?.wind ?? '—'} km/h. Forecast-based irrigation advice is not calculated by the backend.`;
      } else if (query.includes('pesticide') || query.includes('spray')) {
        kind = 'farm';
        const sprays = activities.filter(isPesticideLog);
        const latest = sprays[0];
        reply = latest
          ? `You have ${sprays.length} pesticide logs. Latest: ${latest.pesticideName} on ${new Date(latest.date).toLocaleDateString()} at ${latest.farm?.name || 'a holding'} (${latest.pesticideQuantity || 'qty not set'}). Open Pesticide Logs to add or edit sprays.`
          : 'No pesticide sprays are logged yet. Open Pesticide Logs and tap Log Spray.';
      } else if (query.includes('todo') || query.includes('to-do') || query.includes('upcoming')) {
        kind = 'farm';
        reply = openTodos.length
          ? `You have ${openTodos.length} open to-do${openTodos.length === 1 ? '' : 's'}. Next: ${openTodos[0].title}. Open the To-do page to add more upcoming work.`
          : 'No upcoming work is written yet. Open To-do and add jobs you plan to do.';
      } else if (query.includes('activit') || query.includes('log') || query.includes('recent')) {
        kind = 'farm';
        const latest = activities[0];
        reply = latest
          ? `Latest log: ${latest.activityType} on ${new Date(latest.date).toLocaleDateString()} at ${latest.farm?.name || 'a holding'}. ${latest.notes}`
          : 'No daily logs are recorded yet.';
      } else if (query.includes('risk') || query.includes('predict')) {
        kind = 'ai';
        reply = 'Disease risk percentages come from the predictor on the Diseases page after you submit telemetry. I will not invent a risk score here.';
      } else if (query.includes('farm') || query.includes('holding') || query.includes('plant') || query.includes('acre')) {
        kind = 'farm';
        reply = `You have ${farms.length} holdings covering ${totalAcres} acres and ${totalTrees.toLocaleString()} plants.`;
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: new Date(), kind }]);
    }, 700);
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

  const getDiseaseSeverity = (event: { temp: number; humidity: number; rainfall: number }) => {
    if (event.temp > 32 && event.humidity > 85) return 'CRITICAL';
    if (event.temp > 30 || event.humidity > 80) return 'HIGH';
    if (event.humidity > 70 || Number(event.rainfall) > 20) return 'MEDIUM';
    return 'LOW';
  };

  const visibleFarms = selectedFarmId ? farms.filter((f) => f.id.toString() === selectedFarmId) : farms;
  const totalAcres = visibleFarms.reduce((acc, f) => acc + Number(f.totalAcres), 0).toFixed(1);
  const totalTrees = visibleFarms.reduce((acc, f) => acc + Number(f.numberOfTrees), 0);
  const totalExpensesSum = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const sumExpenseCategories = (cats: string[]) =>
    expenses
      .filter((exp) => cats.includes(exp.category))
      .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const cropOverheadSpend = sumExpenseCategories(['Fertilizer', 'Pesticides', 'Miscellaneous']);
  const laborFleetSpend = sumExpenseCategories(['Workers', 'Diesel', 'Transportation', 'Equipment']);
  const irrigationPowerSpend = sumExpenseCategories(['Electricity', 'Water']);
  const expenseAllocations = [
    { label: 'Direct Crop Overhead', amount: cropOverheadSpend, hint: 'Fertilizers, pesticide supplies, other inputs' },
    { label: 'Labor & Fleet Maintenance', amount: laborFleetSpend, hint: 'Wages, diesel, logistics, equipment' },
    { label: 'Irrigation & Power Utility', amount: irrigationPowerSpend, hint: 'Electricity, water pumps, grid upkeep' },
  ];

  const julyExpensesActual = expenses
    .filter((exp) => {
      const d = new Date(exp.date);
      return d.getFullYear() === 2026 && d.getMonth() === 6;
    })
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const juneExpensesActual = expenses
    .filter((exp) => {
      const d = new Date(exp.date);
      return d.getFullYear() === 2026 && d.getMonth() === 5;
    })
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const expenseMom = juneExpensesActual > 0
    ? ((julyExpensesActual - juneExpensesActual) / juneExpensesActual) * 100
    : null;

  const expenseTrendChart = [
    { month: 'Jan', value: 68400 },
    { month: 'Feb', value: 31200 },
    { month: 'Mar', value: 142500 },
    { month: 'Apr', value: 52800 },
    { month: 'May', value: 168900 },
    { month: 'Jun', value: 81500 },
    { month: 'Jul', value: Math.round(julyExpensesActual) },
  ];

  const highConfidencePredictions = visionPredictions.filter(isHighConfidenceDisease);
  const activeDiseaseCount = highConfidencePredictions.length;
  const isPremium = isPremiumActive(profile);
  const goToPlans = () => {
    setActiveTab('plans');
    setSidebarOpen(false);
    setIsChatOpen(false);
  };

  const pesticideWindowLogs = useMemo(() => {
    const pest = activities.filter(isPesticideLog);
    if (pest.length === 0) return [];
    const latest = Math.max(...activities.map((a) => new Date(a.date).getTime()));
    const start = latest - 7 * 24 * 60 * 60 * 1000;
    return pest.filter((act) => new Date(act.date).getTime() >= start);
  }, [activities]);

  const todayStamp = new Date().toISOString().slice(0, 10);
  const openTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);
  const todoDueLabel = (due?: string | null) => {
    if (!due) return 'No due date';
    return String(due).slice(0, 10);
  };
  const todoOverdue = (todo: FarmTodo) => !todo.done && !!todo.dueDate && String(todo.dueDate).slice(0, 10) < todayStamp;

  const filteredExpenses = expenses
    .filter((exp) => {
      const matchesSearch = exp.notes?.toLowerCase().includes(expenseSearch.toLowerCase()) || exp.category.toLowerCase().includes(expenseSearch.toLowerCase());
      const matchesCat = !expenseFilterCategory || exp.category === expenseFilterCategory;
      const d = new Date(exp.date).getTime();
      const fromOk = !expenseFrom || d >= new Date(expenseFrom).getTime();
      const toOk = !expenseTo || d <= new Date(expenseTo).getTime() + 86400000;
      return matchesSearch && matchesCat && fromOk && toOk;
    })
    .sort((a, b) => {
      if (expenseSort === 'amount-desc') return Number(b.amount) - Number(a.amount);
      if (expenseSort === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const expenseAverage = filteredExpenses.length
    ? filteredExpenses.reduce((s, e) => s + Number(e.amount), 0) / filteredExpenses.length
    : 0;
  const expenseHighest = filteredExpenses.reduce((m, e) => Math.max(m, Number(e.amount)), 0);
  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0),
  })).filter((row) => row.total > 0);

  const filteredActivities = activities.filter((act) => {
    const matchesSearch = act.notes?.toLowerCase().includes(activitySearch.toLowerCase()) || act.activityType.toLowerCase().includes(activitySearch.toLowerCase());
    const farmId = activityFilterFarmId || selectedFarmId;
    const matchesFarm = !farmId || act.farm?.id.toString() === farmId;
    const matchesType = !activityTypeFilter || act.activityType === activityTypeFilter;
    return matchesSearch && matchesFarm && matchesType;
  });

  const filteredPesticideLogs = activities.filter((act) => {
    if (!isPesticideLog(act)) return false;
    const q = pesticideSearch.toLowerCase();
    const matchesSearch =
      !q ||
      act.notes?.toLowerCase().includes(q) ||
      act.pesticideName?.toLowerCase().includes(q) ||
      act.pesticideQuantity?.toLowerCase().includes(q);
    const farmId = pesticideFilterFarmId || selectedFarmId;
    const matchesFarm = !farmId || act.farm?.id.toString() === farmId;
    return matchesSearch && matchesFarm;
  });

  const filteredGalleryImages = galleryImages.filter((img) => {
    const farmId = galleryFilterFarmId || selectedFarmId;
    return !farmId || img.farm?.id.toString() === farmId;
  });
  const filteredDiseases = diseaseEvents.filter((event) => {
    const farmId = diseaseFilterFarmId || selectedFarmId;
    return !farmId || event.farm?.id.toString() === farmId;
  });

  const rainfallHumidityChart = dashboardData?.charts?.rainfallHumidity ?? (() => {
    const rainByDay: Record<number, number> = {};
    const humidityByDay: Record<number, number> = {};
    diseaseEvents.forEach((event) => {
      const d = new Date(event.detectedAt);
      if (d.getFullYear() === 2026 && d.getMonth() === 6) {
        rainByDay[d.getDate()] = Number(event.rainfall) || 0;
        humidityByDay[d.getDate()] = Number(event.humidity) || 0;
      }
    });
    const rainBase = [8, 12, 6, 4, 10, 18, 22, 16, 9, 14, 20, 35, 28, 15, 42, 78, 55, 30, 18, 25, 12, 8, 14, 20, 38, 72, 40, 16, 10, 8];
    const humidityBase = [68, 70, 66, 65, 72, 75, 78, 74, 71, 76, 80, 84, 82, 77, 86, 92, 90, 85, 79, 81, 76, 73, 75, 78, 84, 91, 87, 80, 76, 74];
    return rainBase.map((rain, idx) => {
      const day = idx + 1;
      return { day: `Jul ${day}`, rainfall: rainByDay[day] ?? rain, humidity: humidityByDay[day] ?? humidityBase[idx] };
    });
  })();

  const windTemperatureChart = dashboardData?.charts?.windTemperature ?? (() => {
    const tempByDay: Record<number, number> = {};
    diseaseEvents.forEach((event) => {
      const d = new Date(event.detectedAt);
      if (d.getFullYear() === 2026 && d.getMonth() === 6) {
        tempByDay[d.getDate()] = Number(event.temp) || 0;
      }
    });
    const windBase = [8, 10, 9, 7, 12, 16, 18, 14, 11, 13, 17, 22, 19, 12, 24, 28, 21, 15, 13, 16, 11, 9, 12, 15, 20, 26, 18, 12, 10, 9];
    const tempBase = [27, 28, 29, 30, 28, 26, 25, 26, 27, 26, 25, 24, 24, 26, 23, 22, 23, 25, 26, 25, 27, 28, 27, 26, 24, 22, 23, 25, 26, 27];
    return windBase.map((wind, idx) => {
      const day = idx + 1;
      return { day: `Jul ${day}`, wind, temp: tempByDay[day] || tempBase[idx] };
    });
  })();

  const demoLabReports = (dashboardData?.labReports ?? [
    { id: 'soil-0704', category: 'soil', title: 'Soil fertility & moisture panel', date: '2026-07-04', location: 'Root zone, all holdings', status: 'Watch', summary: 'Organic fertilizer applied. Moisture adequate; nitrogen slightly below target in compacted pockets.', metrics: [{ label: 'Soil pH', value: '6.5', range: '6.0–7.0' }, { label: 'Moisture', value: '28%', range: '25–35%' }, { label: 'EC', value: '0.92 dS/m', range: '< 1.2' }, { label: 'Organic C', value: '0.68%', range: '> 0.50%' }] },
    { id: 'ph-0704', category: 'ph', title: 'Soil pH mapping', date: '2026-07-04', location: 'North and south plant rows', status: 'Optimal', summary: 'pH within orchard band after organic manure. No lime required this cycle.', metrics: [{ label: 'Mean pH', value: '6.5', range: '6.0–7.0' }, { label: 'Min pH', value: '6.2', range: '> 5.8' }, { label: 'Max pH', value: '6.8', range: '< 7.2' }] },
    { id: 'soil-0712', category: 'soil', title: 'Post-fertilizer soil report', date: '2026-07-12', location: 'Fertilizer application bands', status: 'Optimal', summary: 'Even fertilizer distribution. Nutrient availability improved in the top 20 cm.', metrics: [{ label: 'Soil pH', value: '6.4', range: '6.0–7.0' }, { label: 'Available N', value: '268 kg/ha', range: '250–350' }, { label: 'Available P', value: '22 kg/ha', range: '20–40' }, { label: 'Available K', value: '198 kg/ha', range: '180–250' }] },
    { id: 'soil-0719', category: 'soil', title: 'Soil moisture & debris-row survey', date: '2026-07-19', location: 'Major field rows', status: 'Watch', summary: 'Moisture good after weeding. Low-lying rows slightly wetter; monitor for fungal pressure.', metrics: [{ label: 'Soil pH', value: '6.3', range: '6.0–7.0' }, { label: 'Moisture', value: '33%', range: '25–35%' }, { label: 'Bulk density', value: '1.32 g/cm³', range: '< 1.40' }] },
    { id: 'ph-0727', category: 'ph', title: 'Post-rain soil & leaf-zone pH', date: '2026-07-27', location: 'Plants with minor fungal spots', status: 'Watch', summary: 'Rain slightly acidified surface soil. Fungicide applied; retest pH after drainage improves.', metrics: [{ label: 'Surface pH', value: '6.1', range: '6.0–7.0' }, { label: '15 cm pH', value: '6.4', range: '6.0–7.0' }, { label: 'Irrigation pH', value: '6.9', range: '6.5–7.5' }] },
  ]).filter((report: any) => report.category === 'soil' || report.category === 'ph');
  const uploadedMapped = uploadedLabReports
    .filter((report) => report.category === 'soil' || report.category === 'ph')
    .map((report) => ({
      id: `upload-${report.id}`,
      uploadId: report.id,
      category: report.category,
      title: report.title,
      date: new Date(report.uploadedAt).toISOString().slice(0, 10),
      location: report.farm?.name || report.originalName || 'Uploaded PDF',
      status: 'PDF',
      summary: report.notes || 'Uploaded laboratory PDF.',
      metrics: [] as { label: string; value: string; range: string }[],
      filename: report.filename,
    }));
  const labReports = [...uploadedMapped, ...demoLabReports];
  const filteredLabReports = labReports.filter((report: any) => labReportFilter === 'all' || report.category === labReportFilter);

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-zinc-200 p-3 rounded-lg shadow-xl">
          <p className="text-zinc-500 text-xs font-semibold mb-1 uppercase tracking-wider">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-sm font-bold" style={{ color: p.color || p.fill }}>
              {p.name}: <span className="text-zinc-900">
                {p.name.includes('Expense') ? '₹' : ''}
                {p.value.toLocaleString()}
                {p.name.toLowerCase().includes('rain') ? ' mm' : ''}
                {p.name.toLowerCase().includes('humidity') ? '%' : ''}
                {p.name.toLowerCase().includes('wind') ? ' km/h' : ''}
                {p.name.toLowerCase().includes('temp') ? '°C' : ''}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#f3efe4] p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 w-48 rounded-lg df-skel" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 rounded-2xl df-skel" />
            ))}
          </div>
          <div className="h-64 rounded-2xl df-skel" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#f3efe4] flex flex-col items-center justify-center gap-4 text-center p-6">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-2">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900 mb-1">Unable to load farm data</h2>
        <p className="text-sm text-zinc-500 max-w-sm mb-4">Check your connection and try again.</p>
        <button
          onClick={fetchData}
          className="df-btn df-btn-primary"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f3efe4] text-zinc-800 font-sans antialiased overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50
        border-r border-zinc-200 bg-white flex flex-col justify-between transition-all duration-300
        ${sidebarCollapsed ? 'w-[76px] p-3' : 'w-64 p-5'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
      >
        <div className="space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex items-center gap-3 min-w-0 text-left rounded-xl hover:bg-emerald-50/80 p-0.5 -m-0.5"
              onClick={() => {
                setActiveTab('overview');
                setSidebarOpen(false);
                setIsChatOpen(false);
              }}
              aria-label="Go to Analysis"
              title="Go to Analysis"
            >
              <BrandLogo size={36} />
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="font-bold text-sm tracking-tight text-zinc-900 block truncate">{BRAND_NAME}</span>
                  <span className="text-[10px] text-zinc-500 font-medium leading-snug block">{BRAND_TAGLINE}</span>
                </div>
              )}
            </button>
            <button className="md:hidden p-1 text-zinc-500 hover:text-zinc-900" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-4" aria-label="Primary">
            <div className="space-y-1">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
                {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Monitor</p>}
                <button
                  type="button"
                  className="hidden md:flex p-1 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-emerald-50"
                  onClick={() => setSidebarCollapsed((v) => !v)}
                  aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                  title={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                >
                  {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                </button>
              </div>
              {[
                { id: 'overview', label: 'Analysis', icon: LayoutDashboard, group: 'monitor' },
                { id: 'diseases', label: 'Diseases', icon: Bug, group: 'monitor', badge: activeDiseaseCount },
                { id: 'assistant', label: 'AI Assistant', icon: Bot, group: 'monitor' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    title={sidebarCollapsed ? tab.label : undefined}
                    onClick={() => {
                      if (tab.id === 'assistant' && !isPremium) {
                        goToPlans();
                        return;
                      }
                      setActiveTab(tab.id as any);
                      setSidebarOpen(false);
                      if (tab.id === 'assistant') setIsChatOpen(true);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${
                      isActive
                        ? 'bg-emerald-600 text-white border border-emerald-400/20'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="flex-1 text-left">{tab.label}</span>}
                    {!sidebarCollapsed && tab.badge ? (
                      <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-md">{tab.badge}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1">
              {!sidebarCollapsed && <p className="px-3 text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Operations</p>}
              {[
                { id: 'farms', label: 'Holdings', icon: MapIcon },
                { id: 'expenses', label: 'Expenses', icon: IndianRupee },
                { id: 'activities', label: 'Daily Logs', icon: ClipboardList },
                { id: 'pesticides', label: 'Pesticide Logs', icon: Droplets },
                { id: 'todos', label: 'To-do', icon: ListTodo },
                { id: 'gallery', label: 'Gallery', icon: ImageIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    title={sidebarCollapsed ? tab.label : undefined}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${
                      isActive
                        ? 'bg-emerald-600 text-white border border-emerald-400/20'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>{tab.label}</span>}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1">
              {!sidebarCollapsed && <p className="px-3 text-[10px] uppercase tracking-wider text-zinc-600 font-bold">Account</p>}
              {[
                { id: 'support', label: 'Help & Support', icon: HelpCircle },
                { id: 'plans', label: 'Plans', icon: Crown },
                { id: 'profile', label: 'Identity', icon: UserIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    title={sidebarCollapsed ? tab.label : undefined}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'} ${
                      isActive
                        ? 'bg-emerald-600 text-white border border-emerald-400/20'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span>{tab.label}</span>}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-zinc-200 space-y-3">
              {!sidebarCollapsed && (
                <div className="flex flex-col px-1">
                  <span className="text-sm font-bold text-zinc-800 leading-none mb-1 truncate">{profile?.name}</span>
                  <span className="text-xs text-zinc-500 truncate">{profile?.email}</span>
                  <span className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${isPremium ? 'text-emerald-800' : 'text-zinc-500'}`}>
                    {isPremium ? 'Premium' : 'Free plan'}
                  </span>
                </div>
              )}
          <button
            onClick={onLogout}
            title="Sign out"
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white hover:bg-red-50 hover:text-red-600 text-zinc-600 border border-zinc-200 text-xs font-semibold ${sidebarCollapsed ? 'px-0' : ''}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 border-b border-zinc-200 bg-white px-4 md:px-8 py-3 flex items-center gap-3">
          <button
            type="button"
            className="md:hidden p-2 rounded-xl border border-zinc-200 text-zinc-700"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <select
            className="df-input max-w-[220px] py-2 text-xs"
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            aria-label="Select farm"
          >
            <option value="">All holdings</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id.toString()}>{f.name}</option>
            ))}
          </select>
          <div className="flex-1" />
          <button
            type="button"
            className="relative p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:text-zinc-900"
            onClick={() => setActiveTab('diseases')}
            aria-label="Disease alerts"
          >
            <Bell className="w-4 h-4" />
            {activeDiseaseCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">{Math.min(activeDiseaseCount, 9)}</span>
            )}
          </button>
          <button
            type="button"
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700"
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon className="w-4 h-4" />
            {profile?.name?.split(' ')[0] || 'Account'}
          </button>
        </header>

      <main className="flex-1 p-4 md:p-8 pb-24 max-h-screen overflow-y-auto overflow-x-hidden">
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
                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">Farm analysis</h1>
                      <p className="text-sm md:text-base text-emerald-900/80 font-medium italic">{BRAND_TAGLINE}</p>
                    </div>
                    <p className="text-zinc-500 text-sm mt-1">What is happening across {selectedFarmId ? 'this holding' : 'your holdings'} right now.</p>
                  </div>
                  <button type="button" onClick={() => setActiveTab('activities')} className="df-btn df-btn-primary">
                    <Plus className="w-4 h-4" /> Log today&apos;s work
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[
                    { label: 'Total acres', value: totalAcres, hint: selectedFarmId ? 'Selected holding' : `${visibleFarms.length} holdings`, icon: Sprout },
                    { label: 'Total plants', value: totalTrees.toLocaleString(), hint: 'Trees and plants on file', icon: Trees },
                    { label: 'Active diseases', value: activeDiseaseCount, hint: `Photo checks above ${HIGH_CONFIDENCE}% confidence`, icon: Bug },
                    {
                      label: 'July expenses',
                      value: `₹${Math.round(julyExpensesActual).toLocaleString()}`,
                      hint: expenseMom === null ? 'No June ledger to compare' : `vs June recorded spend`,
                      trend: expenseMom,
                      icon: IndianRupee,
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="glass-card rounded-2xl p-5 flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">{stat.label}</span>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-bold text-zinc-900 tracking-tight">{stat.value}</span>
                          {stat.trend !== undefined && stat.trend !== null && (
                            <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stat.trend >= 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                              {stat.trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                              {Math.abs(Number(stat.trend)).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500">{stat.hint}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-emerald-500/15 bg-emerald-500/10 text-emerald-400 shrink-0">
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Cockpit */}
                {expenseTrendChart.length > 0 && (
                  <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-800">Expense Trend</span>
                      <span className="text-xs text-zinc-500">Amount (₹)</span>
                    </div>
                    <div className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={expenseTrendChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3d6b38" stopOpacity={0.22} />
                              <stop offset="95%" stopColor="#3d6b38" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d4" vertical={false} />
                          <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} />
                          <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="value" name="Expenses" stroke="#3d6b38" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {rainfallHumidityChart.length > 0 && (
                  <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-800">Rainfall vs Humidity</span>
                      <div className="flex gap-2 text-xs">
                        <button type="button" onClick={() => setShowRainSeries((v) => !v)} className={`px-2 py-1 rounded-lg border ${showRainSeries ? 'border-sky-500/40 text-sky-700' : 'border-zinc-200 text-zinc-600'}`}>Rainfall</button>
                        <button type="button" onClick={() => setShowHumiditySeries((v) => !v)} className={`px-2 py-1 rounded-lg border ${showHumiditySeries ? 'border-emerald-500/40 text-emerald-800' : 'border-zinc-200 text-zinc-600'}`}>Humidity</button>
                      </div>
                    </div>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rainfallHumidityChart} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d4" vertical={false} />
                          <XAxis dataKey="day" stroke="#4b5563" fontSize={10} tickLine={false} interval={2} />
                          <YAxis yAxisId="rain" stroke="#38bdf8" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}`} />
                          <YAxis yAxisId="humidity" orientation="right" stroke="#34d399" fontSize={10} tickLine={false} domain={[50, 100]} tickFormatter={(v) => `${v}%`} />
                          <Tooltip content={<CustomTooltip />} />
                          {showRainSeries && <Line yAxisId="rain" type="monotone" dataKey="rainfall" name="Rainfall" stroke="#38bdf8" strokeWidth={2} dot={false} />}
                          {showHumiditySeries && <Line yAxisId="humidity" type="monotone" dataKey="humidity" name="Humidity" stroke="#34d399" strokeWidth={2} dot={false} />}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                      <span>Left axis: rainfall (mm)</span>
                      <span>Right axis: humidity (%)</span>
                    </div>
                  </div>
                )}

                {windTemperatureChart.length > 0 && (
                  <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-zinc-800">Wind vs Temperature</span>
                      <div className="flex gap-2 text-xs">
                        <button type="button" onClick={() => setShowWindSeries((v) => !v)} className={`px-2 py-1 rounded-lg border ${showWindSeries ? 'border-sky-500/40 text-sky-700' : 'border-zinc-200 text-zinc-600'}`}>Wind</button>
                        <button type="button" onClick={() => setShowTempSeries((v) => !v)} className={`px-2 py-1 rounded-lg border ${showTempSeries ? 'border-amber-500/40 text-amber-700' : 'border-zinc-200 text-zinc-600'}`}>Temperature</button>
                      </div>
                    </div>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={windTemperatureChart} margin={{ top: 10, right: 18, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8e2d4" vertical={false} />
                          <XAxis dataKey="day" stroke="#4b5563" fontSize={10} tickLine={false} interval={2} />
                          <YAxis yAxisId="wind" stroke="#0ea5e9" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}`} />
                          <YAxis yAxisId="temp" orientation="right" stroke="#d97706" fontSize={10} tickLine={false} domain={[18, 34]} tickFormatter={(v) => `${v}°`} />
                          <Tooltip content={<CustomTooltip />} />
                          {showWindSeries && <Line yAxisId="wind" type="monotone" dataKey="wind" name="Wind" stroke="#0ea5e9" strokeWidth={2} dot={false} />}
                          {showTempSeries && <Line yAxisId="temp" type="monotone" dataKey="temp" name="Temperature" stroke="#d97706" strokeWidth={2} dot={false} />}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                      <span>Left axis: wind (km/h)</span>
                      <span>Right axis: temperature (°C)</span>
                    </div>
                  </div>
                )}

                <PremiumGate locked={!isPremium} onUpgrade={goToPlans} title="Weather outbreak risk is Premium">
                <WeatherOutbreakRisk
                  token={token}
                  defaults={{
                    rainfall_mm: rainfallHumidityChart.length
                      ? Number(rainfallHumidityChart[rainfallHumidityChart.length - 1].rainfall)
                      : undefined,
                    humidity: dashboardData?.weather?.humidity,
                    temperature: dashboardData?.weather?.temp,
                  }}
                />
                </PremiumGate>

                <div className="glass-card rounded-2xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-bold text-zinc-800">Reports</span>
                      <p className="text-xs text-zinc-500 mt-0.5">Upload soil fertility and pH PDFs. Click a PDF to open it.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(['all', 'soil', 'ph'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setLabReportFilter(key)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                            labReportFilter === key
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:text-zinc-900'
                          }`}
                        >
                          {key === 'all' ? 'All' : key === 'ph' ? 'pH' : 'Soil'}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="df-btn df-btn-primary text-xs"
                        onClick={() => {
                          if (!isPremium) {
                            goToPlans();
                            return;
                          }
                          setReportError(null);
                          setReportFile(null);
                          setReportTitle('');
                          setReportNotes('');
                          setReportCategory('soil');
                          setReportFarmId(farms[0]?.id?.toString() || '');
                          setIsReportModalOpen(true);
                        }}
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload PDF
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 overflow-hidden bg-white">
                    {filteredLabReports.length === 0 && (
                      <p className="px-4 py-6 text-sm text-zinc-500 text-center">No reports in this filter yet. Upload a soil or pH PDF to start.</p>
                    )}
                    {filteredLabReports.map((report: any) => {
                      const open = openLabReportId === String(report.id);
                      const hasPdf = Boolean(report.filename);
                      return (
                        <div key={report.id}>
                          <div className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#f7f4ec]">
                            <button
                              type="button"
                              onClick={() => {
                                if (hasPdf) {
                                  setViewingPdf({ title: report.title, filename: report.filename });
                                  return;
                                }
                                setOpenLabReportId(open ? null : String(report.id));
                              }}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                                {report.category === 'ph' ? 'pH' : 'Soil fertility'}
                              </p>
                              <p className="text-sm font-semibold text-zinc-900 truncate inline-flex items-center gap-1.5">
                                {hasPdf && <FileText className="w-3.5 h-3.5 text-emerald-800 shrink-0" />}
                                {report.title}
                              </p>
                              <p className="text-[11px] text-zinc-500">{report.date} · {report.location}</p>
                            </button>
                            <div className="flex items-center gap-2 shrink-0">
                              {hasPdf && (
                                <button
                                  type="button"
                                  className="df-btn df-btn-ghost text-xs px-3 py-1.5"
                                  onClick={() => setViewingPdf({ title: report.title, filename: report.filename })}
                                >
                                  Open PDF
                                </button>
                              )}
                              {report.uploadId ? (
                                <button
                                  type="button"
                                  className="p-1.5 text-zinc-400 hover:text-red-600"
                                  aria-label="Delete report"
                                  onClick={(e) => handleDeleteLabReport(report.uploadId, e)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  report.status === 'Optimal'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}>
                                  {report.status}
                                </span>
                              )}
                            </div>
                          </div>
                          {open && !hasPdf && (
                            <div className="px-4 pb-4 space-y-3 bg-[#fbfaf6]">
                              <p className="text-xs text-zinc-600 leading-relaxed">{report.summary}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {report.metrics.map((metric: any) => (
                                  <div key={metric.label} className="rounded-lg bg-white border border-zinc-200 px-3 py-2">
                                    <p className="text-[10px] text-zinc-500 font-medium">{metric.label}</p>
                                    <p className="text-sm font-bold text-zinc-900">{metric.value}</p>
                                    <p className="text-[10px] text-zinc-500">Target {metric.range}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dashboard Secondary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Weather and Telemetry */}
                  {dashboardData?.weather && (
                    <div className="glass-card rounded-xl border border-zinc-200 p-5 flex flex-col justify-between h-[280px]">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Telemetry Location</span>
                          <h4 className="text-sm font-bold text-zinc-900">{dashboardData.weather.location}</h4>
                          {dashboardData.weather.latitude != null && dashboardData.weather.longitude != null && (
                            <p className="text-[10px] text-zinc-400">
                              {Number(dashboardData.weather.latitude).toFixed(4)}, {Number(dashboardData.weather.longitude).toFixed(4)}
                            </p>
                          )}
                        </div>
                        {getWeatherIcon(dashboardData.weather.condition)}
                      </div>

                      <div className="my-auto py-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-extrabold text-zinc-900 tracking-tight">{dashboardData.weather.temp}°</span>
                          <span className="text-zinc-450 text-sm font-medium">{dashboardData.weather.condition}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-emerald-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Humidity</span>
                            <span className="text-xs font-semibold text-zinc-800">{dashboardData.weather.humidity}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-sky-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Wind Speed</span>
                            <span className="text-xs font-semibold text-zinc-800">{dashboardData.weather.wind} km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Disease Warnings */}
                  <div className="glass-card rounded-xl border border-zinc-200 p-5 flex flex-col justify-between h-[280px]">
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
            className="bg-[#f7f4ec] hover:bg-emerald-50 border border-zinc-200 p-2.5 rounded-lg flex items-center gap-3 transition-colors duration-150 cursor-pointer"
                          >
                            {alert.filename ? (
                              <img
                                src={`/api/uploads/${alert.filename}`}
                                alt={alert.disease}
                                className="w-10 h-10 rounded-md object-cover border border-zinc-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-md bg-red-500/5 flex items-center justify-center border border-red-500/10">
                                <AlertTriangle className="w-5 h-5 text-red-450" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">{alert.disease}</p>
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
                  <div className="glass-card rounded-xl border border-zinc-200 p-5 flex flex-col justify-between h-[280px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Recent activity</span>
                      <button type="button" className="text-[10px] text-emerald-400 font-semibold" onClick={() => setActiveTab('activities')}>Open logs</button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                      {dashboardData?.recentActivities?.length > 0 ? (
                        dashboardData.recentActivities.slice(0, 4).map((act: any) => (
                          <div
                            key={act.id}
                            className="flex gap-3 cursor-pointer hover:bg-emerald-50 rounded-lg p-1 -mx-1"
                            onClick={() => setActiveTab('activities')}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-800 leading-normal">{act.description}</p>
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
                  <div className="glass-card rounded-xl border border-zinc-200 p-5 flex flex-col justify-between h-[280px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pesticide sprays</span>
                      <button type="button" className="text-[10px] text-emerald-400 font-semibold" onClick={() => setActiveTab('pesticides')}>
                        Open logs
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                      {pesticideWindowLogs.length > 0 ? (
                        pesticideWindowLogs.map(act => (
                          <div
                            key={act.id}
                            className="bg-[#f7f4ec] border border-zinc-200 p-2.5 rounded-lg space-y-1.5 cursor-pointer"
                            onClick={() => setActiveTab('pesticides')}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-900 truncate max-w-[120px]">{act.pesticideName || 'Unknown'}</span>
                              <span className="text-[9px] text-zinc-500 font-semibold">{new Date(act.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-zinc-400">
                              <span>Qty: {act.pesticideQuantity || '—'}</span>
                              <span className="text-emerald-400 font-semibold">{act.farm?.name}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <Droplets className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500">No pesticide sprays in the last 7 days of recorded logs.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="glass-card rounded-xl border border-zinc-200 p-5 flex flex-col justify-between h-[280px]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Upcoming work</span>
                      <button type="button" className="text-[10px] text-emerald-400 font-semibold" onClick={() => setActiveTab('todos')}>
                        Open to-do
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {openTodos.length > 0 ? (
                        openTodos.slice(0, 5).map((todo) => (
                          <button
                            key={todo.id}
                            type="button"
                            onClick={() => setActiveTab('todos')}
                            className="w-full text-left bg-[#f7f4ec] border border-zinc-200 p-2.5 rounded-lg cursor-pointer hover:bg-emerald-50"
                          >
                            <p className="text-xs font-semibold text-zinc-900 truncate">{todo.title}</p>
                            <p className={`text-[10px] mt-0.5 ${todoOverdue(todo) ? 'text-red-500 font-semibold' : 'text-zinc-500'}`}>
                              {todoDueLabel(todo.dueDate)}
                              {todo.farm?.name ? ` · ${todo.farm.name}` : ''}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <ListTodo className="w-8 h-8 text-zinc-700 mb-2" />
                          <p className="text-xs text-zinc-500">No upcoming work written yet.</p>
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
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Registered Holdings</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Manage and inspect physical holdings parameters.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (farms.length >= 1 && !isPremium) {
                        goToPlans();
                        toast.message('Unlimited holdings are included in Premium.');
                        return;
                      }
                      setEditingFarm(null);
                      setFormName('');
                      setFormAddress('');
                      setFormTotalAcres('');
                      setFormNumberOfTrees('');
                      setFormCropVariety('');
                      setFormCropSeasonStart('');
                      setFormLocationLabel('');
                      setFormLatitude('');
                      setFormLongitude('');
                      setFormError(null);
                      setIsModalOpen(true);
                    }}
                    className="df-btn df-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Farm</span>
                  </button>
                </div>

                {farms.length === 0 ? (
                  <div className="glass-card border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#f7f4ec] border border-zinc-200 flex items-center justify-center mb-4">
                      <MapIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">No registered holdings found</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Create and structure your first crop holding boundary parameters.</p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 df-btn df-btn-primary"
                    >
                      Create Farm Holding
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {farms.map(farm => (
                      <div key={farm.id} className="glass-card rounded-xl border border-zinc-200 p-5 flex flex-col justify-between relative group hover:border-indigo-500/20 transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-zinc-900 tracking-tight">{farm.name}</h3>
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                                <span>{farm.locationLabel || farm.address}</span>
                              </p>
                              {hasFarmCoordinates(farm) && (
                                <p className="text-[10px] text-zinc-400 mt-1">
                                  {Number(farm.latitude).toFixed(4)}, {Number(farm.longitude).toFixed(4)}
                                </p>
                              )}
                            </div>
                            <span className="text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                              {farm.cropVariety}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-200">
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Acreage</span>
                              <p className="text-sm font-bold text-zinc-800 mt-0.5">{farm.totalAcres} Acres</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tree Count</span>
                              <p className="text-sm font-bold text-zinc-800 mt-0.5">{farm.numberOfTrees.toLocaleString()} trees</p>
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
                                setFormLocationLabel(farm.locationLabel || '');
                                setFormLatitude(farm.latitude != null && farm.latitude !== '' ? String(farm.latitude) : '');
                                setFormLongitude(farm.longitude != null && farm.longitude !== '' ? String(farm.longitude) : '');
                                setFormError(null);
                                setIsModalOpen(true);
                              }}
                              className="p-2 rounded-lg border border-zinc-200 hover:border-zinc-200 bg-[#f7f4ec] text-zinc-450 hover:text-zinc-900 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteFarm(farm.id)}
                              className="p-2 rounded-lg border border-zinc-200 hover:border-red-500/20 bg-[#f7f4ec] text-zinc-455 hover:text-red-400 transition-all cursor-pointer"
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
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Expenses</h1>
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
                    className="df-btn df-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add expense</span>
                  </button>
                </div>

                {/* Filter Ledger */}
                <div className="flex flex-col sm:flex-row gap-4 bg-[#f7f4ec] p-4 rounded-xl border border-zinc-200">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 text-zinc-500 w-4 h-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 pl-10 pr-4 text-xs text-zinc-800 placeholder-zinc-600 outline-none"
                      placeholder="Search items..."
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-[180px]">
                    <select
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 outline-none"
                      value={expenseFilterCategory}
                      onChange={(e) => setExpenseFilterCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <input type="date" className="bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800" value={expenseFrom} onChange={(e) => setExpenseFrom(e.target.value)} aria-label="From date" />
                  <input type="date" className="bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800" value={expenseTo} onChange={(e) => setExpenseTo(e.target.value)} aria-label="To date" />
                  <select className="bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800" value={expenseSort} onChange={(e) => setExpenseSort(e.target.value as any)}>
                    <option value="date-desc">Newest</option>
                    <option value="date-asc">Oldest</option>
                    <option value="amount-desc">Highest amount</option>
                  </select>
                </div>

                {filteredExpenses.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card rounded-xl p-4"><p className="text-[10px] uppercase text-zinc-500 font-bold">Shown total</p><p className="text-lg font-bold">₹{filteredExpenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}</p></div>
                    <div className="glass-card rounded-xl p-4"><p className="text-[10px] uppercase text-zinc-500 font-bold">Average</p><p className="text-lg font-bold">₹{Math.round(expenseAverage).toLocaleString()}</p></div>
                    <div className="glass-card rounded-xl p-4"><p className="text-[10px] uppercase text-zinc-500 font-bold">Highest</p><p className="text-lg font-bold">₹{expenseHighest.toLocaleString()}</p></div>
                  </div>
                )}
                {categoryBreakdown.length > 0 && (
                  <div className="glass-card rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase">Category breakdown</p>
                    {categoryBreakdown.map((row) => (
                      <div key={row.cat} className="flex justify-between text-sm text-zinc-800">
                        <span>{row.cat}</span>
                        <span className="font-semibold">₹{row.total.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {totalExpensesSum > 0 && (
                  <div className="glass-card rounded-xl border border-zinc-200 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-200 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Capital allocation</h3>
                        <p className="text-zinc-500 text-[11px] font-semibold mt-0.5">Grouped from logged categories (₹{totalExpensesSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}).</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {expenseAllocations.map((row) => (
                        <div key={row.label} className="bg-[#f7f4ec] border border-zinc-200 p-4 rounded-lg space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{row.label}</span>
                          <p className="text-lg font-bold text-zinc-900">₹{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <span className="text-[9px] text-zinc-600 block">
                            {row.hint}
                            {totalExpensesSum > 0 ? ` · ${Math.round((row.amount / totalExpensesSum) * 100)}%` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredExpenses.length === 0 ? (
                  <EmptyState
                    icon={IndianRupee}
                    title={expenses.length === 0 ? 'No expenses recorded yet' : 'No expenses match these filters'}
                    description={expenses.length === 0 ? 'Add your first expense to start tracking farm spending.' : 'Try another category or date range.'}
                    action={expenses.length === 0 ? (
                      <button type="button" className="df-btn df-btn-primary" onClick={() => { setIsExpenseModalOpen(true); setFormExpDate(new Date().toISOString().split('T')[0]); }}>Add expense</button>
                    ) : undefined}
                  />
                ) : (
                  <div className="bg-white border border-zinc-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-[#f7f4ec] text-zinc-400 font-semibold">
                          <th className="p-4 text-xs uppercase tracking-wider">Date</th>
                          <th className="p-4 text-xs uppercase tracking-wider">Category</th>
                          <th className="p-4 text-xs uppercase tracking-wider">Description</th>
                          <th className="p-4 text-xs uppercase tracking-wider">Amount</th>
                          <th className="p-4 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map(exp => (
                          <tr key={exp.id} className="border-b border-zinc-100 hover:bg-[#f7f4ec] transition-colors duration-150">
                            <td className="p-4 text-zinc-800 font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                            <td className="p-4">
                              <span className="bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-xs font-semibold text-zinc-600">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-4 text-zinc-400 max-w-[200px] truncate">{exp.notes || <em className="text-zinc-650">No notes</em>}</td>
                            <td className="p-4 font-bold text-zinc-900">₹{Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
                                  className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 cursor-pointer"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-500 hover:text-red-600 cursor-pointer"
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
              </>
            )}

            {/* DAILY ACTIVITIES TAB */}
            {activeTab === 'activities' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Daily Operations</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Audit task assignments, spraying protocols, yields, and structures.</p>
                  </div>
                  <button
                    onClick={() => openActivityLog()}
                    className="df-btn df-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Operation</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-[#f7f4ec] p-4 rounded-xl border border-zinc-200">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 text-zinc-500 w-4 h-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 pl-10 pr-4 text-xs text-zinc-800 placeholder-zinc-600 outline-none"
                      placeholder="Search descriptions..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-[200px]">
                    <select
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 outline-none"
                      value={activityFilterFarmId}
                      onChange={(e) => setActivityFilterFarmId(e.target.value)}
                    >
                      <option value="">All Farms</option>
                      {farms.map(f => (
                        <option key={f.id} value={f.id.toString()}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    className="w-full sm:w-[200px] bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800"
                    value={activityTypeFilter}
                    onChange={(e) => setActivityTypeFilter(e.target.value)}
                  >
                    <option value="">All activity types</option>
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {filteredActivities.length === 0 ? (
                  <div className="glass-card border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#f7f4ec] border border-zinc-200 flex items-center justify-center mb-4">
                      <ClipboardList className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">No operations recorded</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Register irrigation, soil treatments, or pruning sessions to document farm progression.</p>
                  </div>
                ) : (
                  <div className="relative border-l border-zinc-200 pl-6 ml-3 space-y-6">
                    {filteredActivities.map(act => (
                      <div key={act.id} className="relative group">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white group-hover:bg-emerald-700 transition-colors duration-150" />

                        <div className="glass-card border border-zinc-200 rounded-xl p-5 hover:border-indigo-500/20 transition-all duration-300">
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
                                onClick={() => openActivityLog(act, isPesticideLog(act))}
                                className="p-1.5 rounded bg-[#f7f4ec] border border-zinc-200 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">{act.notes}</p>
                          {act.pesticideName && act.pesticideName !== 'None' && (
                            <div className="mt-3 p-3 bg-[#f7f4ec] border border-zinc-200 rounded-lg text-xs space-y-1">
                              <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Pesticide Application Telemetry</p>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div><span className="text-zinc-500">Name:</span> <strong className="text-zinc-800">{act.pesticideName}</strong></div>
                                <div><span className="text-zinc-500">Qty:</span> <strong className="text-zinc-800">{act.pesticideQuantity}</strong></div>
                                <div><span className="text-zinc-500">Time:</span> <strong className="text-zinc-800">{act.pesticideTime}</strong></div>
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

            {activeTab === 'pesticides' && (
              <PremiumGate locked={!isPremium} onUpgrade={goToPlans} title="Pesticide logs are Premium">
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Pesticide Logs</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Record sprays the same way as daily logs: date, holding, product, quantity, and notes.</p>
                  </div>
                  <button
                    onClick={() => openActivityLog(undefined, true)}
                    className="df-btn df-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log Spray</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-[#f7f4ec] p-4 rounded-xl border border-zinc-200">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 text-zinc-500 w-4 h-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 pl-10 pr-4 text-xs text-zinc-800 placeholder-zinc-600 outline-none"
                      placeholder="Search pesticide name, quantity, or notes..."
                      value={pesticideSearch}
                      onChange={(e) => setPesticideSearch(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-[200px]">
                    <select
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 outline-none"
                      value={pesticideFilterFarmId}
                      onChange={(e) => setPesticideFilterFarmId(e.target.value)}
                    >
                      <option value="">All Farms</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id.toString()}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredPesticideLogs.length === 0 ? (
                  <div className="glass-card border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#f7f4ec] border border-zinc-200 flex items-center justify-center mb-4">
                      <Droplets className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">No pesticide logs yet</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[360px] mx-auto">Log a spray with product name, quantity, time of day, and which holding it was applied on.</p>
                    <button type="button" onClick={() => openActivityLog(undefined, true)} className="mt-4 df-btn df-btn-primary">
                      <Plus className="w-4 h-4" /> Log Spray
                    </button>
                  </div>
                ) : (
                  <div className="relative border-l border-zinc-200 pl-6 ml-3 space-y-6">
                    {filteredPesticideLogs.map((act) => (
                      <div key={act.id} className="relative group">
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white group-hover:bg-emerald-700 transition-colors duration-150" />
                        <div className="glass-card border border-zinc-200 rounded-xl p-5">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs font-bold px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-800 border-emerald-500/20">
                                  {act.pesticideName || 'Pesticide'}
                                </span>
                                <span className="text-xs text-zinc-500 font-semibold">{act.farm?.name}</span>
                              </div>
                              <span className="text-[10px] text-zinc-600 block">{new Date(act.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openActivityLog(act, true)}
                                className="p-1.5 rounded bg-[#f7f4ec] border border-zinc-200 text-zinc-400 hover:text-zinc-900 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 p-3 bg-[#f7f4ec] border border-zinc-200 rounded-lg text-xs mb-3">
                            <div><span className="text-zinc-500">Name:</span> <strong className="text-zinc-800">{act.pesticideName || '—'}</strong></div>
                            <div><span className="text-zinc-500">Qty:</span> <strong className="text-zinc-800">{act.pesticideQuantity || '—'}</strong></div>
                            <div><span className="text-zinc-500">Time:</span> <strong className="text-zinc-800">{act.pesticideTime || '—'}</strong></div>
                          </div>
                          {act.notes ? <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">{act.notes}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
              </PremiumGate>
            )}

            {activeTab === 'todos' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">To-do</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Write upcoming farm work, then tick it off when it is done.</p>
                  </div>
                  <span className="text-xs font-semibold text-zinc-500">
                    {openTodos.length} open · {doneTodos.length} done
                  </span>
                </div>

                <form onSubmit={handleAddTodo} className="glass-card rounded-xl border border-zinc-200 p-5 space-y-3">
                  <input
                    className="df-input w-full"
                    placeholder="What needs doing? e.g. prune block 2, order micronutrients"
                    value={todoTitle}
                    onChange={(e) => setTodoTitle(e.target.value)}
                  />
                  <textarea
                    className="df-input w-full min-h-[72px]"
                    placeholder="Notes (optional)"
                    value={todoNotes}
                    onChange={(e) => setTodoNotes(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="date"
                      className="df-input sm:w-[180px]"
                      value={todoDue}
                      onChange={(e) => setTodoDue(e.target.value)}
                      aria-label="Due date"
                    />
                    <select
                      className="df-input flex-1"
                      value={todoFarmId}
                      onChange={(e) => setTodoFarmId(e.target.value)}
                    >
                      <option value="">All farms / no farm</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id.toString()}>{f.name}</option>
                      ))}
                    </select>
                    <button type="submit" disabled={todoSubmitting} className="df-btn df-btn-primary shrink-0">
                      <Plus className="w-4 h-4" />
                      <span>{todoSubmitting ? 'Saving…' : 'Add work'}</span>
                    </button>
                  </div>
                </form>

                {openTodos.length === 0 && doneTodos.length === 0 ? (
                  <div className="glass-card border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#f7f4ec] border border-zinc-200 flex items-center justify-center mb-4">
                      <ListTodo className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">No upcoming work yet</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[360px] mx-auto">Add jobs you plan to do next: spraying, irrigation, labour, purchases, or anything you do not want to forget.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Open</h2>
                      {openTodos.length === 0 ? (
                        <p className="text-sm text-zinc-500">Everything on the list is done.</p>
                      ) : (
                        openTodos.map((todo) => (
                          <div key={todo.id} className="glass-card rounded-xl border border-zinc-200 p-4 flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleTodo(todo)}
                              className="mt-0.5 w-5 h-5 rounded-md border border-zinc-300 bg-white hover:border-emerald-500 cursor-pointer shrink-0"
                              aria-label={`Mark ${todo.title} done`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-900">{todo.title}</p>
                              {todo.notes ? <p className="text-xs text-zinc-500 mt-1 whitespace-pre-wrap">{todo.notes}</p> : null}
                              <p className={`text-[11px] mt-1.5 ${todoOverdue(todo) ? 'text-red-500 font-semibold' : 'text-zinc-500'}`}>
                                {todoDueLabel(todo.dueDate)}
                                {todo.farm?.name ? ` · ${todo.farm.name}` : ''}
                                {todoOverdue(todo) ? ' · overdue' : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 cursor-pointer"
                              aria-label={`Delete ${todo.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {doneTodos.length > 0 && (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setTodoShowDone((v) => !v)}
                          className="text-xs font-bold uppercase tracking-wider text-zinc-500"
                        >
                          Done ({doneTodos.length}) {todoShowDone ? '▾' : '▸'}
                        </button>
                        {todoShowDone && doneTodos.map((todo) => (
                          <div key={todo.id} className="glass-card rounded-xl border border-zinc-200 p-4 flex items-start gap-3 opacity-70">
                            <button
                              type="button"
                              onClick={() => handleToggleTodo(todo)}
                              className="mt-0.5 w-5 h-5 rounded-md bg-emerald-600 border border-emerald-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                              aria-label={`Mark ${todo.title} open again`}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-zinc-700 line-through">{todo.title}</p>
                              {todo.notes ? <p className="text-xs text-zinc-500 mt-1">{todo.notes}</p> : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-1.5 rounded bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 cursor-pointer"
                              aria-label={`Delete ${todo.title}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* GALLERY TAB */}
            {activeTab === 'gallery' && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Gallery</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Farm photos. Send any of them to disease check without re-uploading.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadCaption('');
                      setUploadFarmId(farms.length > 0 ? farms[0].id.toString() : '');
                      setUploadError(null);
                      setIsUploadModalOpen(true);
                    }}
                    className="df-btn df-btn-primary"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-[#f7f4ec] p-4 rounded-xl border border-zinc-200">
                  <div className="w-full sm:w-[280px]">
                    <select
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 outline-none"
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
                  <div className="glass-card border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#f7f4ec] border border-zinc-200 flex items-center justify-center mb-4">
                      <ImageIcon className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">No photos yet</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Upload a field photo, then you can send it to disease check from here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredGalleryImages.map(img => (
                      <div
                        key={img.id}
                        className="glass-card rounded-xl border border-zinc-200 overflow-hidden relative group"
                      >
                        <button
                          type="button"
                          onClick={() => setActiveLightboxImage(img)}
                          className="w-full text-left cursor-pointer"
                        >
                        <div className="h-[200px] overflow-hidden relative bg-[#efe9d8]">
                          <img
                            src={`/api/uploads/${img.filename}`}
                            alt={img.caption}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-xs font-semibold text-zinc-800 line-clamp-2 leading-relaxed">
                            {img.caption || <span className="text-zinc-500">No caption</span>}
                          </p>
                          <div className="flex justify-between items-center text-[10px] text-zinc-500">
                            <span>{new Date(img.uploadedAt).toLocaleDateString()}</span>
                            {img.farm && <span className="text-emerald-800 font-semibold">{img.farm.name}</span>}
                          </div>
                        </div>
                        </button>
                        <div className="px-4 pb-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPendingGalleryAnalyze({
                                id: img.id,
                                filename: img.filename,
                                caption: img.caption,
                                farmId: img.farm?.id,
                              });
                              setActiveTab('diseases');
                            }}
                            className="df-btn df-btn-primary flex-1 text-xs"
                          >
                            Check for disease
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteImage(img.id, e)}
                            className="df-btn df-btn-ghost px-3"
                            aria-label="Delete photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Diseases</h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">Check a photo first. Log an outbreak only when you already know what you saw in the field.</p>
                  </div>
                  <button
                    onClick={openDiseaseModal}
                    className="df-btn df-btn-ghost"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Log outbreak by hand</span>
                  </button>
                </div>

                <PremiumGate locked={!isPremium} onUpgrade={goToPlans} title="Photo disease analysis is Premium">
                <DiseasePredictor
                  token={token}
                  farms={farms}
                  galleryImages={galleryImages.map((img) => ({
                    id: img.id,
                    filename: img.filename,
                    caption: img.caption,
                    farmId: img.farm?.id,
                  }))}
                  pendingGallery={pendingGalleryAnalyze}
                  onAnalyzed={refreshPredictions}
                />
                </PremiumGate>

                <div className="space-y-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-900">High-confidence detections</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">Photo checks with model confidence above {HIGH_CONFIDENCE}%. Healthy results are not counted.</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                      {activeDiseaseCount} active
                    </span>
                  </div>
                  {highConfidencePredictions.length === 0 ? (
                    <div className="glass-card border border-zinc-200 rounded-2xl p-8 text-center">
                      <p className="text-sm text-zinc-500">No photo check has passed {HIGH_CONFIDENCE}% confidence yet. Analyze a leaf or fruit above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {highConfidencePredictions.map((row) => (
                        <div key={row.id} className="glass-card rounded-xl overflow-hidden border border-emerald-200">
                          <div className="h-[140px] bg-[#efe9d8]">
                            <img
                              src={`/api/uploads/${row.imageUrl}`}
                              alt={row.predictedDisease}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 space-y-1">
                            <p className="text-sm font-bold text-zinc-900 truncate">{formatPredictedDisease(row.predictedDisease)}</p>
                            <p className="text-[11px] font-semibold text-emerald-800">{Number(row.confidence).toFixed(1)}% confidence</p>
                            <p className="text-[10px] text-zinc-500">
                              {row.plantPart}
                              {row.farm?.name ? ` · ${row.farm.name}` : ''}
                              {' · '}
                              {new Date(row.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Logged outbreaks</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Manual field records with weather noted at logging time.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 bg-[#f7f4ec] p-4 rounded-xl border border-zinc-200">
                  <div className="w-full sm:w-[280px]">
                    <select
                      className="w-full bg-white border border-zinc-200 focus:border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 outline-none"
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
                  <div className="glass-card border border-zinc-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-xl bg-[#f7f4ec] border border-zinc-200 flex items-center justify-center mb-4">
                      <Bug className="w-6 h-6 text-zinc-500" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">No outbreaks logged yet</h3>
                    <p className="text-sm text-zinc-500 mt-1 max-w-[320px] mx-auto">Use photo check above, or log an outbreak by hand if you already identified it in the field.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDiseases.map(event => {
                      const level = getDiseaseSeverity(event);
                      return (
                        <div
                          key={event.id}
                          onClick={() => setSelectedDisease(event)}
                          className="glass-card rounded-xl overflow-hidden relative group cursor-pointer"
                        >
                          <div className="h-[170px] overflow-hidden relative bg-[#efe9d8]">
                            <img
                              src={`/api/uploads/${event.filename}`}
                              alt={event.diseaseName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${severityBadge(level)}`}>
                                {level}
                              </span>
                            </div>
                            <div className="absolute top-2.5 right-2.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
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
                              <h3 className="text-sm font-bold text-zinc-900 tracking-tight">{event.diseaseName}</h3>
                              <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">{event.farm?.name}</p>
                            </div>

                            {/* Weather grid */}
                            <div className="grid grid-cols-3 gap-2 bg-[#f7f4ec] p-2 rounded-lg border border-zinc-200 text-center">
                              <div className="space-y-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold block uppercase">Heat</span>
                                <span className="text-[11px] font-bold text-zinc-800">{Number(event.temp)}°C</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold block uppercase">Humid</span>
                                <span className="text-[11px] font-bold text-zinc-800">{event.humidity}%</span>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[8px] text-zinc-500 font-bold block uppercase">Rain</span>
                                <span className="text-[11px] font-bold text-zinc-800">{Number(event.rainfall)}mm</span>
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
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Help & Support</h1>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Guides, FAQs, and a way to reach Daruru Farms.</p>
                </div>

                <div className="glass-card rounded-2xl p-5 space-y-2">
                  <h3 className="text-sm font-bold text-zinc-900 mb-3">Getting started</h3>
                  {[
                    { q: 'What is included in Premium?', a: 'Premium is ₹3,000 per year. It adds unlimited holdings, photo disease analysis, weather outbreak risk, pesticide logs, lab PDFs, gallery photo check, and the AI assistant. Open Plans in the sidebar to see the full list and start Premium.' },
                    { q: 'How do I write upcoming work?', a: 'Open To-do, type the job, optionally set a due date and farm, then Add. Tick the box when it is done.' },
                    { q: 'How do I log a pesticide spray?', a: 'Open Pesticide Logs, then Log Spray. Enter the product, quantity, time of day, holding, and notes. You can edit or delete a spray the same way as a daily log.' },
                    { q: 'How do I upload soil or pH reports?', a: 'On Analysis, open Reports, choose Upload PDF, pick Soil fertility or pH, then add the file. Click the report or Open PDF to view it.' },
                    { q: 'How do I check a leaf or fruit for disease?', a: 'Open Diseases, choose Leaf or Fruit, add a photo or pick one from Gallery, then Analyze. If confidence is above 85% and it is not healthy, the result is added to High-confidence detections and counted under Active diseases on Analysis.' },
                    { q: 'Where do expenses show on Analysis?', a: 'July totals come from your expense ledger. Trends use dashboard chart data from the API.' },
                    { q: 'How is disease severity decided?', a: 'For logged outbreaks, it is inferred from temperature, humidity, and rainfall stored with the record. Photo analysis uses a separate image model.' },
                    { q: 'Photos are not loading', a: 'Confirm the backend is running and files exist under backend/uploads. Gallery images are served from /uploads.' },
                    { q: 'Who can I contact?', a: 'Use the ticket form here, email darurugirish@gmail.com, or call +91 93911 77307 on weekdays.' },
                  ].map((item, idx) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full text-left rounded-xl border border-zinc-200 px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-zinc-900">{item.q}</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                      </div>
                      {openFaq === idx && <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.a}</p>}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Contact Info Cards */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">Email Inquiries</h4>
                        <a
                          href="mailto:darurugirish@gmail.com"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold block mt-1 transition-colors"
                        >
                          darurugirish@gmail.com
                        </a>
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-semibold">Average SLA Response: &lt; 24 Hours</span>
                    </div>

                    <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">Direct Hotline</h4>
                        <a
                          href="tel:9391177307"
                          className="text-xs text-violet-400 hover:text-violet-300 font-semibold block mt-1 transition-colors"
                        >
                          +91 93911 77307
                        </a>
                      </div>
                      <span className="text-[10px] text-zinc-500 block font-semibold">Active: Mon - Fri, 9AM - 6PM IST</span>
                    </div>

                    <div className="glass-card rounded-xl border border-zinc-200 p-5 space-y-3">
                      <BrandLogo size={36} />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">DaruruFarms HQ</h4>
                        <p className="text-xs text-zinc-400 leading-normal mt-1">
                          Daruru Farms Private Limited<br />
                          Agricultural Engineering Block
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submission inquiry form */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card rounded-xl border border-zinc-200 p-6 space-y-6">
                      <h3 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Submit support ticket</h3>

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
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3 text-xs text-zinc-400 outline-none select-none pointer-events-none"
                              value={profile?.name || ''}
                              disabled
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</label>
                            <input
                              type="text"
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3 text-xs text-zinc-400 outline-none select-none pointer-events-none"
                              value={profile?.email || ''}
                              disabled
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subject / Concern</label>
                          <input
                            type="text"
                            className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                            placeholder="E.g., Drip line calibration error, new holding limit"
                            value={contactSubject}
                            onChange={(e) => setContactSubject(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Detailed Message</label>
                          <textarea
                            className="w-full min-h-[120px] bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none resize-none"
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
                            className="df-btn df-btn-primary text-xs"
                          >
                            {contactSubmitting ? 'Sending Ticket...' : 'File Support Inquiry'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Support history table */}
                    {contactInquiries.length > 0 && (
                      <div className="glass-card rounded-xl border border-zinc-200 p-6 space-y-4">
                        <h3 className="text-base font-bold text-zinc-900 pb-1">Support History</h3>
                        <div className="space-y-3 overflow-y-auto max-h-[300px]">
                          {contactInquiries.map(ticket => (
                            <div key={ticket.id} className="p-4 bg-[#f7f4ec] border border-zinc-200 rounded-xl space-y-2">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <h4 className="text-xs font-bold text-zinc-900">{ticket.subject}</h4>
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

            {activeTab === 'assistant' && (
              <PremiumGate locked={!isPremium} onUpgrade={goToPlans} title="AI assistant is Premium">
              <>
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900">AI farm assistant</h1>
                  <p className="text-sm text-zinc-500 mt-1">Answers from your logs, weather telemetry, and general guidance. Not a live LLM.</p>
                </div>
                <div className="glass-card rounded-2xl p-4 max-w-3xl space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      'How much did I spend this month?',
                      'What diseases are currently active?',
                      'How much water did we use this week?',
                      'Is irrigation required tomorrow?',
                      'Why is disease risk high?',
                      'Show my recent farm activities.',
                    ].map((q) => (
                      <button key={q} type="button" className="text-[11px] px-3 py-1.5 rounded-full border border-emerald-800 text-emerald-200 hover:bg-emerald-950" onClick={() => { setChatInput(q); }}>
                        {q}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500">Use the chat panel (bottom right) or type a question there. Suggested chips fill the input — press send to ask.</p>
                </div>
              </>
              </PremiumGate>
            )}

            {activeTab === 'plans' && (
              <PricingPlans token={token} profile={profile} onSubscribed={() => { fetchData(); }} />
            )}

            {/* IDENTITY TAB */}
            {activeTab === 'profile' && (
              <>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Identity Credentials</h1>
                  <p className="text-zinc-500 text-sm font-medium mt-1">Review active connection details and session authorization tokens.</p>
                </div>

                <div className="glass-card border border-zinc-200 rounded-2xl p-6 max-w-2xl space-y-6">
                  <h2 className="text-base font-bold text-zinc-900 border-b border-zinc-200 pb-3">Session Profile</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Account Name</span>
                      <p className="text-sm font-semibold text-zinc-800 mt-1">{profile?.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Email Address</span>
                      <p className="text-sm font-semibold text-zinc-800 mt-1">{profile?.email}</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Plan</span>
                      <p className="text-sm font-semibold text-zinc-800 mt-1">
                        {isPremium
                          ? `Premium${profile?.premiumUntil ? ` until ${new Date(profile.premiumUntil).toLocaleDateString()}` : ''}`
                          : 'Free'}
                      </p>
                      {!isPremium && (
                        <button type="button" className="text-xs font-semibold text-emerald-800 mt-1" onClick={goToPlans}>
                          Upgrade to Premium · ₹3,000/year
                        </button>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Holdings</span>
                      <p className="text-sm font-semibold text-zinc-800 mt-1">{farms.length} registered</p>
                    </div>
                    <div>
                      <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Session</span>
                      <p className="text-sm font-semibold text-zinc-800 mt-1">Signed in with a secure token stored on this device.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl flex items-start gap-3 text-xs leading-normal text-zinc-400">
                    <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p>
                      Your password is stored hashed on the server and is not shown in this app. Sign out on shared devices.
                    </p>
                  </div>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </main>
      </div>

      {selectedDisease && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex justify-end" onClick={() => setSelectedDisease(null)}>
          <aside className="w-full max-w-md h-full bg-white border-l border-zinc-200 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Disease details">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-2 ${severityBadge(getDiseaseSeverity(selectedDisease))}`}>{getDiseaseSeverity(selectedDisease)}</p>
                <h2 className="text-lg font-bold text-zinc-900">{selectedDisease.diseaseName}</h2>
                <p className="text-xs text-zinc-500 mt-1">{selectedDisease.farm?.name} · {new Date(selectedDisease.detectedAt).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => setSelectedDisease(null)} aria-label="Close details"><X className="w-5 h-5 text-zinc-400" /></button>
            </div>
            <img src={`/api/uploads/${selectedDisease.filename}`} alt="" className="w-full h-48 object-cover rounded-xl border border-zinc-200 mb-4" />
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="rounded-xl bg-[#f7f4ec] p-3 text-center"><p className="text-[10px] text-zinc-500">Temp</p><p className="text-sm font-bold">{Number(selectedDisease.temp)}°C</p></div>
              <div className="rounded-xl bg-[#f7f4ec] p-3 text-center"><p className="text-[10px] text-zinc-500">Humidity</p><p className="text-sm font-bold">{selectedDisease.humidity}%</p></div>
              <div className="rounded-xl bg-[#f7f4ec] p-3 text-center"><p className="text-[10px] text-zinc-500">Rain</p><p className="text-sm font-bold">{Number(selectedDisease.rainfall)} mm</p></div>
            </div>
            <p className="text-xs text-zinc-400 mb-4">Severity is inferred from weather at detection. Treatment status is not stored in the API.</p>
            <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2">Related sprays on this holding</h3>
            <div className="space-y-2 mb-4">
              {activities.filter((a) => a.farm?.id === selectedDisease.farm?.id && (a.activityType === 'Pesticide Application' || (a.pesticideName && a.pesticideName !== 'None'))).slice(0, 4).map((a) => (
                <p key={a.id} className="text-xs text-zinc-800">{new Date(a.date).toLocaleDateString()} · {a.pesticideName} · {a.pesticideQuantity}</p>
              ))}
              {activities.filter((a) => a.farm?.id === selectedDisease.farm?.id && a.activityType === 'Pesticide Application').length === 0 && (
                <p className="text-xs text-zinc-500">No pesticide logs on this holding.</p>
              )}
            </div>
            <h3 className="text-xs font-bold uppercase text-zinc-500 mb-2">Recent logs on this holding</h3>
            <div className="space-y-2">
              {activities.filter((a) => a.farm?.id === selectedDisease.farm?.id).slice(0, 5).map((a) => (
                <p key={a.id} className="text-xs text-zinc-800">{new Date(a.date).toLocaleDateString()} · {a.activityType}</p>
              ))}
            </div>
            <button type="button" className="mt-6 df-btn df-btn-ghost w-full" onClick={() => { setActiveLightboxImage({ ...selectedDisease, caption: selectedDisease.diseaseName }); }}>Open photo</button>
          </aside>
        </div>
      )}

      {/* FARM LOCATION PROMPT */}
      {showLocationPrompt && (
        <div className="modal-backdrop fixed inset-0 z-[80] bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[480px] rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button type="button" onClick={skipLocationPrompt} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer" aria-label="Skip for now">
              <X className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-emerald-800" />
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Where is the farm?</h2>
            <p className="text-sm text-zinc-500 mt-1 mb-5">
              Save the place now so weather and other location APIs can use the same coordinates later.
            </p>

            {locationError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{locationError}</div>}

            {farms.length > 1 && (
              <div className="space-y-1.5 mb-4">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Apply to</label>
                <select
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3 text-sm text-zinc-800 outline-none"
                  value={locationPromptFarmId}
                  onChange={(e) => setLocationPromptFarmId(e.target.value)}
                >
                  <option value="all">All holdings without a location</option>
                  {farms.map((farm) => (
                    <option key={farm.id} value={farm.id}>
                      {farm.name}{hasFarmCoordinates(farm) ? ' (already set)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5 mb-3">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">City, village, or district</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="E.g., Mysuru"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      searchFarmPlaces();
                    }
                  }}
                />
                <button type="button" onClick={searchFarmPlaces} disabled={locationSearching} className="df-btn df-btn-primary text-xs shrink-0">
                  {locationSearching ? 'Searching…' : 'Find'}
                </button>
              </div>
            </div>

            {locationMatches.length > 1 && (
              <div className="mb-4 space-y-1.5">
                {locationMatches.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => applyPlaceToPrompt(place)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border ${
                      locationLat === String(place.latitude)
                        ? 'border-emerald-700 bg-emerald-50 text-zinc-900'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:bg-[#f7f4ec]'
                    }`}
                  >
                    {placeLabel(place)}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={useDeviceLocation}
              disabled={locationLocating}
              className="df-btn df-btn-ghost w-full text-xs mb-4"
            >
              <Locate className="w-4 h-4" />
              {locationLocating ? 'Locating…' : 'Use my current location'}
            </button>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Latitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                  readOnly={false}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Longitude</label>
                <input
                  type="number"
                  step="any"
                  className="w-full bg-white border border-zinc-200 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                  value={locationLng}
                  onChange={(e) => setLocationLng(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5 mb-5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Saved place name</label>
              <input
                type="text"
                className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                placeholder="Shown on weather and holdings"
                value={locationLabelInput}
                onChange={(e) => setLocationLabelInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={skipLocationPrompt} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer">
                Later
              </button>
              <button type="button" onClick={saveFarmLocation} disabled={locationSaving} className="df-btn df-btn-primary text-xs">
                {locationSaving ? 'Saving…' : 'Save location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FARM MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border-gradient shadow-2xl p-6 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-zinc-900 mb-5">{editingFarm ? 'Update Farm Holding' : 'Register New Farm Holding'}</h2>

            {formError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{formError}</div>}

            <form onSubmit={handleFarmSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Farm Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
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
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="E.g., 551 Sector B, California"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Map location (for weather APIs)</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="E.g., Mysuru, Karnataka"
                  value={formLocationLabel}
                  onChange={(e) => setFormLocationLabel(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                    placeholder="Latitude"
                    value={formLatitude}
                    onChange={(e) => setFormLatitude(e.target.value)}
                  />
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                    placeholder="Longitude"
                    value={formLongitude}
                    onChange={(e) => setFormLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Acreage</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
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
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
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
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
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
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                  value={formCropSeasonStart}
                  onChange={(e) => setFormCropSeasonStart(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer">Cancel</button>
                <button type="submit" disabled={formSubmitting} className="df-btn df-btn-primary text-xs">
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
            <button onClick={() => setIsExpenseModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-zinc-900 mb-5">{editingExpense ? 'Modify Ledger Entry' : 'Log Operational Expense'}</h2>

            {formExpError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{formExpError}</div>}

            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    step="any"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                    placeholder="E.g., 25000.00"
                    value={formExpAmount}
                    onChange={(e) => setFormExpAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
                  <select
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3 text-sm text-zinc-800 outline-none"
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
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                  value={formExpDate}
                  onChange={(e) => setFormExpDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Overhead details</label>
                <input
                  type="text"
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="Purchased winter fertilizer"
                  value={formExpNotes}
                  onChange={(e) => setFormExpNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer">Cancel</button>
                <button type="submit" disabled={formExpSubmitting} className="df-btn df-btn-primary text-xs">
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
            <button onClick={() => { setIsActivityModalOpen(false); setLoggingPesticide(false); }} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-zinc-900 mb-5">
              {editingActivity
                ? (loggingPesticide ? 'Revise pesticide log' : 'Revise Operation Log')
                : (loggingPesticide ? 'Log pesticide spray' : 'Record Farm Operation')}
            </h2>

            {formActError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{formActError}</div>}

            <form onSubmit={handleActivitySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Operation Date</label>
                  <input
                    type="date"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 outline-none"
                    value={formActDate}
                    onChange={(e) => setFormActDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Farm</label>
                  <select
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3 text-sm text-zinc-800 outline-none"
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

              {!loggingPesticide && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Activity Type</label>
                <select
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3 text-sm text-zinc-800 outline-none"
                  value={formActType}
                  onChange={(e) => setFormActType(e.target.value)}
                  required
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              )}

              {/* Pesticide Application Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Pesticide Name</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2 px-2.5 text-xs text-zinc-800 outline-none"
                    placeholder={loggingPesticide ? 'E.g. Mancozeb' : 'E.g. None'}
                    value={formActPestName}
                    onChange={(e) => setFormActPestName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quantity</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2 px-2.5 text-xs text-zinc-800 outline-none"
                    placeholder={loggingPesticide ? 'E.g. 20 ml / 10 L' : 'E.g. None'}
                    value={formActPestQty}
                    onChange={(e) => setFormActPestQty(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Time (e.g. AM/PM)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2 px-2.5 text-xs text-zinc-800 outline-none"
                    placeholder={loggingPesticide ? 'E.g. Morning' : 'E.g. None'}
                    value={formActPestTime}
                    onChange={(e) => setFormActPestTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Attached Log Details</label>
                <textarea
                  className="w-full min-h-[100px] bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none resize-none"
                  placeholder={loggingPesticide ? 'E.g. Sprayed north block after rain. Covered fruit and leaves.' : 'E.g., Drip line inspection complete. Added nitrogen mix in quadrant C.'}
                  value={formActNotes}
                  onChange={(e) => setFormActNotes(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => { setIsActivityModalOpen(false); setLoggingPesticide(false); }} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer">Cancel</button>
                <button type="submit" disabled={formActSubmitting} className="df-btn df-btn-primary text-xs">
                  {formActSubmitting ? 'Logging...' : editingActivity ? 'Save' : loggingPesticide ? 'Log Spray' : 'Log Activity'}
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
            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-zinc-900 mb-5">Upload Telemetry Photo</h2>

            {uploadError && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{uploadError}</div>}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div
                onClick={() => document.getElementById('fileUploadGallery')?.click()}
                onDragOver={(e) => { e.preventDefault(); setGalleryDropActive(true); }}
                onDragLeave={() => setGalleryDropActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setGalleryDropActive(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) acceptImageFile(file);
                }}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${galleryDropActive ? 'border-emerald-400 bg-emerald-500/10' : 'border-zinc-200 hover:border-zinc-700 bg-[#f7f4ec]'}`}
              >
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-xs font-semibold text-zinc-800">{uploadSubmitting ? 'Uploading…' : 'Drop a photo here, or browse'}</p>
                <span className="text-[10px] text-zinc-500 mt-1">Supports PNG, JPEG, WEBP under 5MB</span>
                <input
                  id="fileUploadGallery"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <span className="text-[11px] font-bold text-emerald-800 mt-3 truncate max-w-full">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Associate with Farm (Optional)</label>
                <select
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3 text-sm text-zinc-800 outline-none"
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
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="Soil testing in quadrant 4"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer">Cancel</button>
                <button type="submit" disabled={uploadSubmitting} className="df-btn df-btn-primary text-xs">
                  {uploadSubmitting ? 'Uploading…' : 'Upload image'}
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
            <button onClick={() => setIsDiseaseModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-zinc-900 mb-5">Log Disease Outbreak</h2>

            {diseaseErrorMsg && <div className="p-3 bg-red-500/5 border border-red-500/20 text-xs text-red-400 rounded-lg mb-4">{diseaseErrorMsg}</div>}

            <form onSubmit={handleDiseaseSubmit} className="space-y-4">
              <div
                onClick={() => document.getElementById('fileUploadDisease')?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-zinc-700 bg-[#f7f4ec] rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <Upload className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-xs font-semibold text-zinc-800">Upload crop infection photo</p>
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
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none"
                  placeholder="E.g., Powdery Mildew"
                  value={diseaseNameInput}
                  onChange={(e) => setDiseaseNameInput(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Farm</label>
                <select
                  className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2.5 px-3 text-sm text-zinc-800 outline-none"
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
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2 px-2.5 text-xs text-zinc-800 outline-none"
                    value={diseaseTempInput}
                    onChange={(e) => setDiseaseTempInput(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Humid (%)</label>
                  <input
                    type="number"
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2 px-2.5 text-xs text-zinc-800 outline-none"
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
                    className="w-full bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg py-2 px-2.5 text-xs text-zinc-800 outline-none"
                    value={diseaseRainfallInput}
                    onChange={(e) => setDiseaseRainfallInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setIsDiseaseModalOpen(false)} className="px-4 py-2 border border-zinc-200 bg-white rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-900 cursor-pointer">Cancel</button>
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
              className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-zinc-900 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={`/api/uploads/${activeLightboxImage.filename}`}
              alt={activeLightboxImage.caption || activeLightboxImage.diseaseName}
              className="w-full max-h-[70vh] object-contain rounded-lg border border-zinc-200 shadow-2xl"
            />
            <div className="w-full text-center px-4 py-3 bg-white border border-zinc-200 rounded-xl space-y-2">
              <p className="text-sm font-bold text-zinc-900 leading-normal">
                {activeLightboxImage.caption || activeLightboxImage.diseaseName || 'Daily Snap'}
              </p>
              <div className="flex justify-center items-center gap-3 text-xs text-zinc-500 font-semibold">
                <span>Date: {new Date(activeLightboxImage.uploadedAt || activeLightboxImage.detectedAt).toLocaleString()}</span>
                {activeLightboxImage.farm && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-800">{activeLightboxImage.farm.name}</span>
                  </>
                )}
              </div>

              {/* Show disease weather telemetry if lightbox image is a disease event */}
              {activeLightboxImage.temp !== undefined && (
                <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-zinc-200 text-xs">
                  <span className="text-zinc-600">Temperature: <strong className="text-zinc-800">{Number(activeLightboxImage.temp)}°C</strong></span>
                  <span className="text-zinc-600">Humidity: <strong className="text-zinc-800">{activeLightboxImage.humidity}%</strong></span>
                  <span className="text-zinc-600">Rainfall: <strong className="text-zinc-800">{Number(activeLightboxImage.rainfall)}mm</strong></span>
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
              className="w-[360px] h-[450px] glass-panel border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col mb-4"
            >
              <div className="px-4 py-3 bg-[#f7f4ec] border-b border-zinc-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 tracking-tight leading-none">Daruru Assistant</h3>
                    <span className="text-[9px] text-zinc-500 font-semibold mt-0.5 block">AI Copilot Node</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chat History Panel */}
              <div className="px-3 py-2 border-b border-zinc-200 flex flex-wrap gap-1.5">
                {['How much did I spend this month?', 'What diseases are currently active?', 'Show my recent farm activities.'].map((q) => (
                  <button key={q} type="button" className="text-[10px] px-2 py-1 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900" onClick={() => setChatInput(q)}>{q}</button>
                ))}
              </div>
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
                          ? 'bg-emerald-700 text-white'
                          : 'bg-[#f3efe4] text-zinc-700 border border-zinc-200'}
                      `}
                    >
                      {msg.sender === 'bot' && msg.kind && (
                        <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                          {msg.kind === 'farm' ? 'Farm data' : msg.kind === 'weather' ? 'Weather' : 'Guidance'}
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[8px] text-zinc-500">
                          {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === 'bot' && (
                          <button type="button" className="text-zinc-500 hover:text-zinc-900" aria-label="Copy reply" onClick={() => { navigator.clipboard.writeText(msg.text); toast.success('Copied'); }}>
                            <Copy className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {chatTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#f7f4ec] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-500 flex gap-1 items-center">
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
                className="p-3 bg-[#f7f4ec] border-t border-zinc-200 flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask a question about your farm..."
                  className="flex-1 bg-white border border-zinc-200 focus:border-emerald-700 rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 outline-none"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Button */}
        <button
          onClick={() => {
            if (!isPremium) {
              goToPlans();
              return;
            }
            setIsChatOpen(!isChatOpen);
          }}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer border transition-all duration-300 active:scale-90
            ${isChatOpen
              ? 'bg-zinc-900 text-white border-zinc-200 hover:bg-zinc-800'
              : 'bg-emerald-600 text-white border-emerald-500/30 hover:bg-emerald-500'}
          `}
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {isReportModalOpen && (
        <div className="modal-backdrop fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-[440px] rounded-2xl shadow-2xl p-6 relative">
            <button onClick={() => setIsReportModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 cursor-pointer" aria-label="Close"><X className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-zinc-900 mb-1">Upload lab report</h2>
            <p className="text-xs text-zinc-500 mb-5">Add a soil fertility or pH PDF. You can open it from Reports after upload.</p>
            <form onSubmit={handleLabReportUpload} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(['soil', 'ph'] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setReportCategory(kind)}
                    className={`df-btn ${reportCategory === kind ? 'df-btn-primary' : 'df-btn-ghost'}`}
                  >
                    {kind === 'ph' ? 'pH' : 'Soil fertility'}
                  </button>
                ))}
              </div>
              <label className="block text-xs font-semibold text-zinc-600">
                Title
                <input
                  className="df-input mt-1"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={reportCategory === 'ph' ? 'July pH lab report' : 'Soil fertility report'}
                />
              </label>
              {farms.length > 0 && (
                <label className="block text-xs font-semibold text-zinc-600">
                  Holding (optional)
                  <select className="df-input mt-1" value={reportFarmId} onChange={(e) => setReportFarmId(e.target.value)}>
                    <option value="">All holdings</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block text-xs font-semibold text-zinc-600">
                Notes (optional)
                <textarea className="df-input mt-1 min-h-[72px]" value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} placeholder="Lab name, sample location, or date of collection" />
              </label>
              <label className="border-2 border-dashed border-zinc-200 rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:border-emerald-700 bg-[#f7f4ec]">
                <FileText className="w-6 h-6 text-emerald-800 mb-2" />
                <span className="text-sm font-semibold text-zinc-800">{reportFile ? reportFile.name : 'Choose PDF'}</span>
                <span className="text-xs text-zinc-500 mt-1">PDF only, up to 15 MB</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                />
              </label>
              {reportError && <p className="text-sm text-red-700">{reportError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsReportModalOpen(false)} className="df-btn df-btn-ghost">Cancel</button>
                <button type="submit" disabled={reportSubmitting} className="df-btn df-btn-primary">
                  {reportSubmitting ? 'Uploading…' : 'Upload PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingPdf && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm p-3 md:p-6 flex flex-col" role="dialog" aria-modal="true" aria-label={viewingPdf.title}>
          <div className="bg-white rounded-2xl flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{viewingPdf.title}</p>
                <p className="text-[11px] text-zinc-500">PDF report</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/api/uploads/${viewingPdf.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  className="df-btn df-btn-ghost text-xs"
                >
                  Open in new tab
                </a>
                <button type="button" className="p-2 text-zinc-500 hover:text-zinc-900" onClick={() => setViewingPdf(null)} aria-label="Close PDF">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <iframe
              title={viewingPdf.title}
              src={`/api/uploads/${viewingPdf.filename}`}
              className="flex-1 w-full bg-zinc-100 min-h-[70vh]"
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => confirmDialog?.onConfirm()}
      />

    </div>
  );
};
