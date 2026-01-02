import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { amplifyVaccineService } from "@/lib/amplify-client";
import { ParseVaccineHistoryRequest, VaccineHistoryResult, CatchUpRequest, CatchUpResult } from "@shared/schema";
import { trackVaccineParsed, trackCatchUpGenerated, trackExport, trackSampleDataLoaded, trackError } from "@/lib/heap";
import { Syringe, Download, FileText, Shield, Info, CheckCircle, AlertCircle, Loader2, User, Calendar, Target, RefreshCw, AlertTriangle, Globe, ShieldCheck, Link as LinkIcon, Plus, Trash2, MessageSquare, Send, Clock } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import {
  ProcessingBanner,
  QuickActionBar,
  SummaryStrip,
  TopNav,
  type SummaryItem,
  type NextStepItem,
  type ProgressNode,
} from "@/components/vaccine/layout";

export default function VaccineParser() {
  // CDC note anchors per vaccine (not exhaustive; add as needed)
  const getCdcLink = (vaccineCode: string) => {
    const base = 'https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html';
    const map: Record<string, string> = {
      meningococcal_acwy: '#note-mening',
      meningococcal_b: '#note-mening',
      dtap_tdap: '#note-dtap',
      pneumococcal: '#note-pneumo',
      mmr: '#note-mmr',
      varicella: '#note-varicella',
      hepatitis_b: '#note-hepb',
      hepatitis_a: '#note-hepa',
      ipv: '#note-polio',
      hpv: '#note-hpv',
      influenza: '#note-flu',
      rotavirus: '#note-rotavirus',
      rsv: '',
      covid19: '#note-covid-19'
    };
    const anchor = map[vaccineCode] || '';
    if (anchor) return `${base}${anchor}`;
    // RSV references a separate clinical guidance page for infants/young children
    if (vaccineCode === 'rsv') {
      return 'https://www.cdc.gov/rsv/hcp/vaccine-clinical-guidance/infants-young-children.html';
    }
    return base;
  };

  const [result, setResult] = useState<VaccineHistoryResult | null>(null);
  const [catchUpResult, setCatchUpResult] = useState<CatchUpResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [inputMode, setInputMode] = useState<'text' | 'structured'>('text');
  const [structuredVaccines, setStructuredVaccines] = useState<Array<{ name: string; doses: Array<{ date: string; product?: string }> }>>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>('actionNeeded');

  // Helper functions for vaccine categorization - aligned with actual system
  const categorizeVaccines = (recommendations: any[]) => {
    const categories = {
      actionNeeded: [] as any[],
      upcoming: [] as any[],
      complete: [] as any[],
      sharedDecision: [] as any[],
      riskBased: [] as any[],
      international: [] as any[],
      notRecommended: [] as any[]
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    recommendations.forEach(rec => {
      // Categorize primarily by decisionType, then by seriesComplete and timing
      switch (rec.decisionType) {
        case 'international-advisory':
          categories.international.push(rec);
          break;
        case 'shared-clinical-decision':
          categories.sharedDecision.push(rec);
          break;
        case 'risk-based':
          categories.riskBased.push(rec);
          break;
        case 'not-recommended':
          categories.notRecommended.push(rec);
          break;
        case 'aged-out':
          categories.notRecommended.push(rec); // Group with not-recommended
          break;
        default:
          // For routine and catch-up, categorize by completion status and timing
          if (rec.seriesComplete) {
            categories.complete.push(rec);
          } else {
            // Check if vaccine has a future due date (upcoming) or is due now/overdue (action needed)
            if (rec.nextDoseDate) {
              const nextDoseDate = new Date(rec.nextDoseDate);
              nextDoseDate.setHours(0, 0, 0, 0);
              
              if (nextDoseDate > today) {
                // Future date - this is scheduled/upcoming
                categories.upcoming.push(rec);
              } else {
                // Today or past - action needed
                categories.actionNeeded.push(rec);
              }
            } else {
              // No specific date but incomplete - action needed
              categories.actionNeeded.push(rec);
            }
          }
          break;
      }
    });

    return categories;
  };

  const getPriorityIcon = (category: string) => {
    switch (category) {
      case 'actionNeeded': return AlertTriangle;
      case 'upcoming': return Calendar;
      case 'complete': return ShieldCheck;
      case 'sharedDecision': return User;
      case 'riskBased': return AlertCircle;
      case 'international': return Globe;
      case 'notRecommended': return AlertTriangle;
      default: return Info;
    }
  };

  const getPriorityColor = (category: string) => {
    switch (category) {
      case 'actionNeeded': return 'border-l-orange-500 bg-orange-50';
      case 'upcoming': return 'border-l-blue-500 bg-blue-50';
      case 'complete': return 'border-l-emerald-500 bg-emerald-50';
      case 'sharedDecision': return 'border-l-indigo-500 bg-indigo-50';
      case 'riskBased': return 'border-l-purple-500 bg-purple-50';
      case 'international': return 'border-l-cyan-500 bg-cyan-50';
      case 'notRecommended': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeriesProgress = (rec: any) => {
    // Extract dose information from notes or recommendation text
    const text = `${rec.recommendation} ${rec.notes.join(' ')}`.toLowerCase();
    const doseMatch = text.match(/(\d+)\s*(?:of|\/)\s*(\d+)/);
    
    if (doseMatch) {
      const current = parseInt(doseMatch[1]);
      const total = parseInt(doseMatch[2]);
      return { current, total, percentage: (current / total) * 100 };
    }
    
    // Fallback: if series is complete, assume 100%
    if (rec.seriesComplete) {
      return { current: 1, total: 1, percentage: 100 };
    }
    
    return { current: 0, total: 1, percentage: 0 };
  };

  // Display formatting for internal vaccine codes
  const formatVaccineName = (internalCode: string, ageYears?: number): string => {
    const map: Record<string, string> = {
      meningococcal_acwy: 'MenACWY',
      meningococcal_b: 'MenB',
      pneumococcal: 'Pneumococcal (PCV)',
      mmr: 'MMR',
      varicella: 'Varicella',
      hepatitis_b: 'Hepatitis B',
      hepatitis_a: 'Hepatitis A',
      hpv: 'HPV',
      influenza: 'Influenza',
      ipv: 'Polio (IPV)',
      hib: 'Hib',
      rsv: 'RSV',
      rotavirus: 'Rotavirus',
      cholera: 'Cholera',
      typhoid: 'Typhoid',
      japanese_encephalitis: 'Japanese Encephalitis',
      yellow_fever: 'Yellow Fever',
      covid19: 'COVID-19',
    };
    if (internalCode === 'dtap_tdap') {
      // Age-specific: DTaP for <7y, Tdap for ≥7y
      return (ageYears ?? 7) >= 7 ? 'Tdap' : 'DTaP';
    }
    return map[internalCode] || internalCode;
  };

  // Options for structured entry (common routine vaccines)
  const VACCINE_OPTIONS: string[] = [
    'DTaP', 'Tdap', 'IPV', 'MMR', 'Varicella', 'Hepatitis A', 'Hepatitis B', 'Hib',
    'Pneumococcal Conjugate', 'MenACWY', 'MenB', 'HPV', 'Influenza', 'Rotavirus', 'COVID-19'
  ];

  const addVaccine = (name: string) => {
    setStructuredVaccines(prev => {
      if (prev.some(v => v.name === name)) return prev;
      return [...prev, { name, doses: [{ date: '' }] }];
    });
  };

  const removeVaccine = (name: string) => {
    setStructuredVaccines(prev => prev.filter(v => v.name !== name));
  };

  const addDose = (index: number) => {
    setStructuredVaccines(prev => prev.map((v, i) => i === index ? { ...v, doses: [...v.doses, { date: '' }] } : v));
  };

  const removeDose = (vaccineIndex: number, doseIndex: number) => {
    setStructuredVaccines(prev => prev.map((v, i) => {
      if (i !== vaccineIndex) return v;
      const nextDoses = v.doses.filter((_, di) => di !== doseIndex);
      return { ...v, doses: nextDoses.length > 0 ? nextDoses : [{ date: '' }] };
    }));
  };

  const updateDoseDate = (vaccineIndex: number, doseIndex: number, date: string) => {
    setStructuredVaccines(prev => prev.map((v, i) => {
      if (i !== vaccineIndex) return v;
      const nextDoses = v.doses.map((d, di) => di === doseIndex ? { ...d, date } : d);
      return { ...v, doses: nextDoses };
    }));
  };

  const handleStructuredSubmit = () => {
    const birthDate = form.getValues('birthDate');
    // Serialize to text that parser understands: one line per vaccine, dates separated by spaces
    const lines = structuredVaccines
      .filter(v => v.doses.some(d => d.date))
      .map(v => `${v.name} ${v.doses.filter(d => d.date).map(d => d.date).join(' ')}`);
    const vaccineData = lines.join('\n');

    if (!birthDate || lines.length === 0) {
      toast({ title: 'Missing data', description: 'Enter birth date and at least one vaccine dose date', variant: 'destructive' });
      return;
    }

    setCurrentStep(2);
    parseVaccinesMutation.mutate({ birthDate, vaccineData } as any);
  };

  // Enhanced vaccine card component
  const VaccineCard = ({ rec, category }: { rec: any, category: string }) => {
    const progress = getSeriesProgress(rec);
    const Icon = getPriorityIcon(category);
    const priorityColor = getPriorityColor(category);
    const cdcLink = getCdcLink(rec.vaccineName);
    const displayName = formatVaccineName(rec.vaccineName, catchUpResult?.patientAge ? parseInt(String(catchUpResult.patientAge)) : undefined);

    return (
      <Card className={`relative overflow-hidden border-l-4 ${priorityColor} transition-all duration-200 hover:shadow-md`}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{displayName}</h4>
            </div>
            <div className="flex items-center space-x-2 self-start sm:self-center">
              <Badge 
                variant={rec.seriesComplete ? 'default' : 'secondary'}
                className={`text-xs px-2 py-1 ${
                  rec.decisionType === 'international-advisory' ? 'bg-blue-100 text-blue-800' :
                  rec.decisionType === 'aged-out' ? 'bg-gray-100 text-gray-800' :
                  rec.seriesComplete ? 'bg-emerald-100 text-emerald-800' : 
                  category === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}
              >
                {rec.decisionType === 'international-advisory' ? 'International Advisory' :
                 rec.decisionType === 'aged-out' ? 'Aged Out' :
                 rec.seriesComplete ? 'Complete' : 
                 category === 'upcoming' ? 'Upcoming' :
                 'Action Needed'}
              </Badge>
            </div>
          </div>

          {/* Headline removed per request */}
          
          {/* Progress bar for multi-dose series */}
          {progress.total > 1 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Series Progress</span>
                <span>{progress.current}/{progress.total} doses</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="text-sm text-gray-700">
            <div className="font-medium mb-1">Recommendation:</div>
            <div className="text-gray-600">{rec.recommendation}</div>
          </div>

          {rec.nextDoseDate && (
            <div className="text-sm text-blue-600 flex items-center bg-blue-50 rounded-lg p-2">
              <Calendar className="mr-2 h-4 w-4" />
              <span className="font-medium">Next dose due: {rec.nextDoseDate}</span>
            </div>
          )}

          {/* Reference */}
          <div className="flex flex-wrap gap-2">
            <a href={cdcLink} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm">
                <LinkIcon className="h-3.5 w-3.5 mr-1" /> CDC Reference
              </Button>
            </a>
          </div>

          {rec.decisionType && rec.decisionType !== 'routine' && (
            <Badge 
              variant="outline"
              className={`text-xs px-2 py-1 ${
                rec.decisionType === 'international-advisory' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                rec.decisionType === 'shared-clinical-decision' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                rec.decisionType === 'risk-based' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                rec.decisionType === 'not-recommended' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                rec.decisionType === 'aged-out' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                ''
              }`}
            >
              {rec.decisionType === 'international-advisory' ? 'International Advisory' :
               rec.decisionType === 'shared-clinical-decision' ? 'Shared Clinical Decision' :
               rec.decisionType === 'risk-based' ? 'Risk-Based Recommendation' :
               rec.decisionType === 'not-recommended' ? 'Not Recommended' :
               rec.decisionType === 'aged-out' ? 'Aged Out' :
               rec.decisionType}
            </Badge>
          )}

          {rec.notes.length > 0 && (
            <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
              <div className="font-medium mb-2 flex items-center">
                <Info className="w-3 h-3 mr-1" />
                Notes:
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {rec.notes.map((note: string, noteIndex: number) => (
                  <li key={noteIndex}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          {rec.specialSituations && rec.specialSituations.length > 0 && (
            <div className="text-xs text-purple-700 bg-purple-50 rounded-lg p-3">
              <div className="font-medium mb-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Special Situations:
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {rec.specialSituations.map((situation: string, index: number) => (
                  <li key={index}>{situation}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  const [showCatchUp, setShowCatchUp] = useState(false);
  const [specialConditions, setSpecialConditions] = useState({
    immunocompromised: false,
    pregnancy: false,
    hivInfection: false,
    asplenia: false,
    cochlearImplant: false,
    csfLeak: false,
  });
  const [sessionId, setSessionId] = useState<string>(() => {
    // Generate a session ID for this browser session
    return crypto.randomUUID();
  });
  const { toast } = useToast();
  
  // Feedback form state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const form = useForm<ParseVaccineHistoryRequest>({
    resolver: zodResolver(ParseVaccineHistoryRequest),
    defaultValues: {
      vaccineData: "",
      birthDate: "",
    },
  });

  const parseVaccinesMutation = useMutation({
    mutationFn: async (data: ParseVaccineHistoryRequest) => {
      return await amplifyVaccineService.parseVaccineHistory(data.vaccineData, data.birthDate);
    },
    onSuccess: async (data: VaccineHistoryResult) => {
      setResult(data);
      setCurrentStep(3);
      
      // Track successful parsing
      trackVaccineParsed(data.vaccines.length, !!data.patientInfo.dateOfBirth);
      
      toast({
        title: "Vaccine history parsed successfully",
        description: `Processed ${data.vaccines.length} vaccine series`,
      });
      
      // Automatically generate catch-up recommendations
      if (data.patientInfo.dateOfBirth) {
        const catchUpRequest: CatchUpRequest = {
          birthDate: data.patientInfo.dateOfBirth,
          currentDate: new Date().toISOString().split('T')[0],
          vaccineHistory: data.vaccines.map(vaccine => ({
            vaccineName: vaccine.standardName,
            doses: vaccine.doses.map(dose => ({
              date: dose.date
            }))
          })),
          specialConditions: specialConditions
        };
        
        setShowCatchUp(true);
        catchUpMutation.mutate(catchUpRequest);
      } else {
        toast({
          title: "Birth date required",
          description: "Cannot generate catch-up recommendations without patient's date of birth",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      trackError('parsing_failed', error.message);
      toast({
        title: "Parsing failed",
        description: error.message,
        variant: "destructive",
      });
      setCurrentStep(1);
    },
  });

  const catchUpMutation = useMutation({
    mutationFn: async (data: CatchUpRequest) => {
      return await amplifyVaccineService.generateCatchUpRecommendations(data);
    },
    onSuccess: (data: CatchUpResult) => {
      setCatchUpResult(data);
      
      // Track successful catch-up generation
      const actionNeededCount = data.recommendations.filter(
        r => !r.seriesComplete && r.decisionType !== 'not-recommended' && r.decisionType !== 'aged-out'
      ).length;
      
      trackCatchUpGenerated(
        data.recommendations.length,
        actionNeededCount,
        data.patientAge
      );
      
      toast({
        title: "Catch-up recommendations generated",
        description: `Generated recommendations for ${data.recommendations.length} vaccines`,
      });
    },
    onError: (error: Error) => {
      trackError('catchup_failed', error.message);
      toast({
        title: "Catch-up analysis failed",
        description: error.message,
        variant: "destructive",
      });
      // Still show parsed results even if catch-up fails
      // User can retry catch-up generation if needed
    },
  });

  const categorizedRecommendations = useMemo(() => {
    if (!catchUpResult) {
      return null;
    }
    return categorizeVaccines(catchUpResult.recommendations);
  }, [catchUpResult]);

  const isProcessing = parseVaccinesMutation.isPending || catchUpMutation.isPending;

  const summaryItems: SummaryItem[] = useMemo(() => {
    const patientAgeValue =
      catchUpResult?.patientAge ||
      result?.patientInfo.currentAge ||
      (isProcessing ? "Processing" : "Awaiting data");
    const vaccinesParsed = result?.vaccines.length ? `${result.vaccines.length}` : "0";
    const actionNeededCount = categorizedRecommendations
      ? categorizedRecommendations.actionNeeded.length + categorizedRecommendations.sharedDecision.length
      : 0;
    const lastUpdatedSource = catchUpResult?.processedAt || result?.processedAt;
    const lastUpdatedValue = lastUpdatedSource
      ? formatDistanceToNow(new Date(lastUpdatedSource), { addSuffix: true })
      : isProcessing
        ? "In progress"
        : "Not yet run";

    return [
      {
        label: "Patient Age",
        value: patientAgeValue || "—",
        helper: result?.patientInfo.dateOfBirth
          ? `DOB ${new Date(result.patientInfo.dateOfBirth).toLocaleDateString()}`
          : "Provide date of birth",
        icon: User,
      },
      {
        label: "Vaccines Parsed",
        value: vaccinesParsed,
        helper: result ? "History structured" : "Awaiting input",
        icon: Syringe,
      },
      {
        label: "Action Needed",
        value: `${actionNeededCount}`,
        helper: categorizedRecommendations ? `${actionNeededCount} outstanding` : "Generated after parsing",
        icon: AlertTriangle,
      },
      {
        label: "Last Updated",
        value: lastUpdatedValue,
        helper: lastUpdatedSource ? new Date(lastUpdatedSource).toLocaleString() : "Run parser to update",
        icon: Clock,
      },
    ];
  }, [catchUpResult, result, categorizedRecommendations, isProcessing]);

  const nextStepItems: NextStepItem[] = useMemo(() => {
    if (!categorizedRecommendations) return [];
    const actionable = [
      ...categorizedRecommendations.actionNeeded,
      ...categorizedRecommendations.sharedDecision,
    ];

    return actionable.slice(0, 4).map((rec, index) => ({
      id: `${rec.vaccineName}-${index}`,
      title: formatVaccineName(
        rec.vaccineName,
        catchUpResult?.patientAge ? parseInt(String(catchUpResult.patientAge)) : undefined
      ),
      detail: rec.recommendation,
      nextLabel: rec.nextDoseDate ? `Next dose: ${rec.nextDoseDate}` : undefined,
    }));
  }, [categorizedRecommendations, catchUpResult]);

  const progressNodes = useMemo<ProgressNode[]>(() => {
    const base: ProgressNode[] = [
      {
        label: "Intake",
        href: "#intake",
        status: "current",
        helper: "Paste or enter records",
      },
      {
        label: "History",
        href: "#history",
        status: "upcoming",
        helper: "Review parsed data",
      },
      {
        label: "Recommendations",
        href: "#recommendations",
        status: "upcoming",
        helper: "Catch-up plan",
      },
      {
        label: "Resources",
        href: "#resources",
        status: "upcoming",
        helper: "Privacy & guides",
      },
    ];

    if (result && !catchUpResult) {
      base[0].status = "complete";
      base[1].status = "current";
    }

    if (catchUpResult) {
      base[0].status = "complete";
      base[1].status = "complete";
      base[2].status = "current";
    }

    return base;
  }, [result, catchUpResult]);

  const onSubmit = (data: ParseVaccineHistoryRequest) => {
    setCurrentStep(2);
    parseVaccinesMutation.mutate(data);
  };

  // Keep function for retry in case catch-up fails
  const generateCatchUpRecommendations = () => {
    if (!result || !result.patientInfo.dateOfBirth) {
      toast({
        title: "Date of birth required",
        description: "Cannot generate catch-up recommendations without patient's date of birth",
        variant: "destructive",
      });
      return;
    }

    const catchUpRequest: CatchUpRequest = {
      birthDate: result.patientInfo.dateOfBirth,
      currentDate: new Date().toISOString().split('T')[0],
      vaccineHistory: result.vaccines.map(vaccine => ({
        vaccineName: vaccine.standardName,
        doses: vaccine.doses.map(dose => ({
          date: dose.date
        }))
      })),
      specialConditions: specialConditions
    };

    setShowCatchUp(true);
    catchUpMutation.mutate(catchUpRequest);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!feedbackEmail || !feedbackText) {
      toast({
        title: "Missing information",
        description: "Please provide both email and feedback",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedbackEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setFeedbackSubmitting(true);

    try {
      // Submit to FormSubmit.co - a free form submission service
      // Replace 'your-email@example.com' with your actual email
      const formData = new FormData();
      formData.append('email', feedbackEmail);
      formData.append('message', feedbackText);
      formData.append('timestamp', new Date().toISOString());
      formData.append('sessionId', sessionId);
      formData.append('_subject', 'VaxRecord Feedback Submission');
      formData.append('_template', 'table'); // Use table format for email
      formData.append('_captcha', 'false'); // Disable captcha for better UX
      
      const response = await fetch('https://formsubmit.co/mahmoudhamsho@gmail.com', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      toast({
        title: "Feedback submitted! 🎉",
        description: "Thank you for helping us improve. We'll review your feedback soon.",
      });

      // Reset form
      setFeedbackEmail("");
      setFeedbackText("");
      setFeedbackOpen(false);
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: "Submission failed",
        description: "Please try again later or email us directly at mahmoudhamsho@gmail.com",
        variant: "destructive",
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const loadSampleData = () => {
    const sampleData = `DTaP, Unspecified
   6/26/2020 (6 m.o.)
   9/24/2020 (9 m.o.)
   6/22/2023 (3 y.o.)
   12/19/2023 (4 y.o.)
   Hep B, Unspecified
   11/28/2019 (0 days)
   1/15/2020 (6 wk.o.)
   9/24/2020 (9 m.o.)
   HiB
   6/26/2020 (6 m.o.)
   9/24/2020 (9 m.o.)
   8/28/2023 (3 y.o.)
   Influenza, Unspecified
   12/19/2023 (4 y.o.)
   MMR
   5/17/2022 (2 y.o.)
   Pneumococcal Conjugate, Unspecified
   6/26/2020 (6 m.o.)
   9/24/2020 (9 m.o.)
   6/22/2023 (3 y.o.)
   Poliovirus
   6/26/2020 (6 m.o.)
   9/24/2020 (9 m.o.)
   6/22/2023 (3 y.o.)
   12/19/2023 (4 y.o.)
   Rotavirus, Unspecified
   6/26/2020 (6 m.o.)
   Varicella (Chicken Pox)
   5/17/2022 (2 y.o.)`;

    form.setValue('vaccineData', sampleData);
    form.setValue('birthDate', '2019-11-28');
    
    // Track sample data loaded
    trackSampleDataLoaded();
    
    toast({
      title: "Sample data loaded",
      description: "Click 'Parse & Generate Recommendations' to see how it works",
    });
  };

  const exportData = (format: 'json' | 'csv') => {
    if (!result) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = JSON.stringify(result, null, 2);
      filename = `vaccine-history-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      // Convert to CSV
      const headers = ['Vaccine Name', 'Standard Name', 'Doses Count', 'Administration Dates', 'Patient Ages', 'Series Status'];
      const rows = result.vaccines.map(vaccine => [
        vaccine.vaccineName,
        vaccine.standardName,
        vaccine.doses.length.toString(),
        vaccine.doses.map(d => d.date).join('; '),
        vaccine.doses.map(d => d.patientAge).join('; '),
        vaccine.seriesStatus
      ]);
      
      content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      filename = `vaccine-history-${new Date().toISOString().split('T')[0]}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track export action
    trackExport(format);
    
    toast({
      title: `${format.toUpperCase()} exported`,
      description: `Downloaded ${filename}`,
    });
  };


  return (
    <div className="min-h-screen bg-[var(--background)] text-foreground">
      <TopNav onFeedback={() => setFeedbackOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Bar - Always visible */}
        <section id="overview" className="mb-8">
          <SummaryStrip items={summaryItems} />
        </section>

        {isProcessing && (
          <div className="mb-8">
            <ProcessingBanner isParsing={parseVaccinesMutation.isPending} />
          </div>
        )}

        {/* Full-width single-column layout */}
        <div className="space-y-8">
        {/* Input Section */}
        <section id="intake">
        <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="text-blue-600 mr-2" />
              Paste Vaccine History Data
            </CardTitle>
            <p className="text-sm text-slate-600">
              Copy and paste unstructured vaccine history from medical records. The system will automatically parse and structure the data.
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Mode Toggle and Sample Data */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-700 font-medium">Input Mode:</div>
                    <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'text' | 'structured')}>
                      <TabsList>
                        <TabsTrigger value="text">Free Text</TabsTrigger>
                        <TabsTrigger value="structured">Structured</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={loadSampleData}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Try Sample Data
                  </Button>
                </div>

                {/* Birth date (shared) */}
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Patient Date of Birth <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          className="max-w-xs"
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the patient&apos;s birth date to calculate their current age
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {inputMode === 'text' ? (
                  <>
                    <FormField
                      control={form.control}
                      name="vaccineData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Vaccine History Text <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={10}
                              className="font-mono text-sm"
                              placeholder={`Example:
DTaP, Unspecified1/19/2011 (3 m.o.)2/17/2011 (4 m.o.)4/7/2011 (6 m.o.)11/19/2013 (3 y.o.)
11/19/2014 (4 y.o.)
Hep A, Unspecified9/27/2011 (12 m.o.)11/14/2012 (2 y.o.)
Hep B, Unspecified9/21/2010 (0 days)4/7/2011 (6 m.o.)7/25/2011 (10 m.o.)
HiB1/19/2011 (3 m.o.)2/17/2011 (4 m.o.)4/7/2011 (6 m.o.)8/20/2012 (22 m.o.)
MMR8/20/2012 (22 m.o.)8/29/2017 (6 y.o.)
Pneumococcal Conjugate, Unspecified1/19/2011 (3 m.o.)2/17/2011 (4 m.o.)7/25/2011 (10 m.o.)11/19/2014 (4 y.o.)
Polio, Unspecified1/19/2011 (3 m.o.)2/17/2011 (4 m.o.)11/19/2013 (3 y.o.)11/19/2014 (4 y.o.)
Rotavirus, Unspecified1/19/2011 (3 m.o.)2/17/2011 (4 m.o.)4/7/2011 (6 m.o.)
Tdap7/31/2025 (14 y.o.)
Varicella (Chicken Pox)8/20/2012 (22 m.o.)2/18/2019 (8 y.o.)`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Supported Formats</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                          <li>Various date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)</li>
                          <li>Common vaccine name variations and abbreviations</li>
                          <li>Age notations (m.o., y.o., months, years)</li>
                          <li>Multi-line or single-line format entries</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600 flex items-center">
                        <Shield className="text-emerald-600 mr-1 h-4 w-4" />
                        All data processing is session-based only. No information is stored.
                      </div>
                      <Button 
                        type="submit" 
                        disabled={parseVaccinesMutation.isPending || catchUpMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        {(parseVaccinesMutation.isPending || catchUpMutation.isPending) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Syringe className="mr-2 h-4 w-4" />
                        )}
                        {parseVaccinesMutation.isPending 
                          ? "Parsing..." 
                          : catchUpMutation.isPending 
                          ? "Generating Recommendations..." 
                          : "Parse & Generate Recommendations"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Structured builder */}
                    <div className="space-y-6">
              {/* Enhanced Add Vaccine Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-dashed border-blue-300 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Add Vaccines to Record</h3>
                            <p className="text-sm text-slate-600 mb-4">
                              Select vaccines from the dropdown below, then enter the dates when each dose was administered.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 items-start">
                              <div className="w-full sm:w-80">
                                <Select onValueChange={addVaccine}>
                                  <SelectTrigger className="bg-white border-2 border-blue-300 hover:border-blue-400 transition-colors">
                                    <SelectValue placeholder="🔍 Select a vaccine to add..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VACCINE_OPTIONS.map(name => (
                                      <SelectItem key={name} value={name} className="cursor-pointer hover:bg-blue-50">
                                        <div className="flex items-center">
                                          <Syringe className="w-4 h-4 mr-2 text-blue-600" />
                                          {name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  // Trigger the select to open
                                  const selectTrigger = document.querySelector('[role="combobox"]') as HTMLElement;
                                  if (selectTrigger) selectTrigger.click();
                                }}
                                className="whitespace-nowrap bg-white border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Browse Vaccines
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Add Common Vaccines */}
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Quick Add Common Vaccines:</div>
                          <div className="flex flex-wrap gap-2">
                            {['DTaP', 'MMR', 'IPV', 'Hepatitis B', 'Varicella', 'COVID-19'].map(name => (
                              <Button
                                key={name}
                                variant="outline"
                                size="sm"
                                onClick={() => addVaccine(name)}
                                disabled={structuredVaccines.some(v => v.name === name)}
                                className="text-xs bg-white hover:bg-blue-100 border-blue-200"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Vaccine List */}
                      <div className="space-y-4">
                        {structuredVaccines.length === 0 && (
                          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <Syringe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No vaccines added yet</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              Click the dropdown above or use the quick-add buttons to start building your vaccine record
                            </p>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-1">1</div>
                                Add vaccine
                              </div>
                              <span>→</span>
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-1">2</div>
                                Enter dates
                              </div>
                              <span>→</span>
                              <div className="flex items-center">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-1">3</div>
                                Submit
                              </div>
                            </div>
                          </div>
                        )}
                        {structuredVaccines.map((v, vi) => (
                          <Card key={v.name} className="border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                            <CardHeader className="pb-3 bg-blue-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                                    <Syringe className="w-4 h-4 text-white" />
                                  </div>
                                  <CardTitle className="text-lg">{v.name}</CardTitle>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeVaccine(v.name)} 
                                  aria-label="Remove vaccine"
                                  className="hover:bg-red-100 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4">
                              <div className="space-y-2">
                                {v.doses.map((d, di) => (
                                  <div key={di} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 min-w-20">
                                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                                        {di + 1}
                                      </div>
                                      <span className="text-sm font-medium text-slate-700">Dose</span>
                                    </div>
                                    <Input 
                                      type="date" 
                                      className="flex-1 max-w-xs border-blue-200 focus:border-blue-400 focus:ring-blue-400" 
                                      value={d.date} 
                                      onChange={(e) => updateDoseDate(vi, di, e.target.value)}
                                      placeholder="Select date"
                                    />
                                    {v.doses.length > 1 && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeDose(vi, di)} 
                                        aria-label="Remove dose"
                                        className="hover:bg-red-100 hover:text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addDose(vi)}
                                className="w-full border-2 border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-medium"
                              >
                                <Plus className="h-4 w-4 mr-2" /> 
                                Add Another Dose
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-slate-600 flex items-center">
                        <Shield className="text-emerald-600 mr-1 h-4 w-4" />
                        All data processing is session-based only. No information is stored.
                      </div>
                      <Button onClick={handleStructuredSubmit} disabled={parseVaccinesMutation.isPending || catchUpMutation.isPending} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5">
                        {(parseVaccinesMutation.isPending || catchUpMutation.isPending) ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Syringe className="mr-2 h-4 w-4" />
                        )}
                        {parseVaccinesMutation.isPending 
                          ? "Parsing..." 
                          : catchUpMutation.isPending 
                          ? "Generating Recommendations..." 
                          : "Parse & Generate Recommendations"}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
        </section>

        {parseVaccinesMutation.isError && (
          <Button onClick={() => parseVaccinesMutation.mutate(form.getValues())}>
            Retry Parsing
          </Button>
        )}

        {/* Results Section - Full Width Card-Based Layout */}
        {result && (
          <section id="history" className="space-y-6">
            {/* Header with Patient Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Vaccine History Parsed</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      DOB: {result.patientInfo.dateOfBirth ? new Date(result.patientInfo.dateOfBirth).toLocaleDateString() : "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Age: {result.patientInfo.currentAge || "Unknown"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Syringe className="h-4 w-4" />
                      {result.patientInfo.totalVaccines} vaccine series
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {catchUpMutation.isError && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCatchUpRecommendations}
                    disabled={catchUpMutation.isPending || !result.patientInfo.dateOfBirth}
                  >
                    {catchUpMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Retry
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => exportData('json')}>
                  <Download className="h-4 w-4 mr-1" />
                  JSON
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
                  <FileText className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            </div>

            {/* Vaccine Cards Grid - Full Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {result.vaccines.map((vaccine, index) => (
                <div
                  key={index}
                  className={`rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
                    vaccine.seriesStatus === "Complete"
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-amber-200 bg-amber-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        vaccine.seriesStatus === "Complete" ? "bg-emerald-500" : "bg-amber-500"
                      }`}>
                        {vaccine.seriesStatus === "Complete" ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{vaccine.abbreviation || vaccine.standardName}</p>
                        {vaccine.abbreviation && (
                          <p className="text-xs text-gray-500">{vaccine.standardName}</p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={vaccine.seriesStatus === "Complete" ? "default" : "secondary"}
                      className={`text-xs ${
                        vaccine.seriesStatus === "Complete"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-amber-100 text-amber-700 border-amber-200"
                      }`}
                    >
                      {vaccine.seriesStatus}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Doses given</span>
                      <span className="font-medium text-gray-900">{vaccine.doses.length}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2">
                      <p className="text-xs text-gray-500 mb-1">Administration dates:</p>
                      <div className="flex flex-wrap gap-1">
                        {vaccine.doses.slice(0, 3).map((dose, doseIndex) => (
                          <span key={doseIndex} className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200">
                            {dose.date}
                          </span>
                        ))}
                        {vaccine.doses.length > 3 && (
                          <span className="text-xs text-gray-400">+{vaccine.doses.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Processing Notes - Collapsible */}
            {result.processingNotes.length > 0 && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Processing Notes</AlertTitle>
                <AlertDescription className="text-blue-800">
                  <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
                    {result.processingNotes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </section>
        )}

        {/* Catch-Up Recommendations Section - Full Width */}
        {catchUpResult && (() => {
          const categories = categorizeVaccines(catchUpResult.recommendations);
          
          const filterOptions = [
            { key: 'actionNeeded', label: 'Action Needed', count: categories.actionNeeded.length, color: 'orange', icon: AlertTriangle },
            { key: 'upcoming', label: 'Upcoming', count: categories.upcoming.length, color: 'blue', icon: Calendar },
            { key: 'complete', label: 'Complete', count: categories.complete.length, color: 'emerald', icon: ShieldCheck },
            { key: 'sharedDecision', label: 'Shared Decision', count: categories.sharedDecision.length, color: 'indigo', icon: User },
            { key: 'international', label: 'International', count: categories.international.length, color: 'cyan', icon: Globe },
            { key: 'notRecommended', label: 'Not Recommended', count: categories.notRecommended.length, color: 'gray', icon: AlertCircle },
          ];
          
          const getFilteredRecs = () => {
            if (!activeFilter) return catchUpResult.recommendations;
            return categories[activeFilter as keyof typeof categories] || [];
          };
          
          return (
            <section id="recommendations" className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Catch-Up Recommendations</h2>
                    <p className="text-sm text-gray-600">
                      Patient age: {catchUpResult.patientAge} · {catchUpResult.recommendations.length} vaccines reviewed
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(isActive ? null : filter.key)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? filter.color === 'orange' ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-500'
                          : filter.color === 'emerald' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500'
                          : filter.color === 'blue' ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                          : filter.color === 'indigo' ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500'
                          : filter.color === 'cyan' ? 'bg-cyan-100 text-cyan-800 ring-2 ring-cyan-500'
                          : 'bg-gray-100 text-gray-800 ring-2 ring-gray-500'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {filter.label}
                      <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                        isActive ? 'bg-white/50' : 'bg-gray-100'
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Recommendation Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredRecs().length > 0 ? (
                  getFilteredRecs().map((rec, index) => (
                    <VaccineCard key={index} rec={rec} category={activeFilter || 'actionNeeded'} />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-emerald-400" />
                    <p className="text-lg font-medium">No vaccines in this category</p>
                    <p className="text-sm">Try selecting a different filter above</p>
                  </div>
                )}
              </div>

              {/* Guidelines Footer */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-slate-600" />
                  <span className="font-medium text-slate-700 text-sm">Important Guidelines</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• Minimum intervals between doses must be maintained</li>
                  <li>• Always consult CDC catch-up schedule for complex cases</li>
                  <li>• Consider individual patient factors and contraindications</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>CDC Guidelines: {catchUpResult.cdcVersion}</span>
                  <span>Generated: {new Date(catchUpResult.processedAt).toLocaleString()}</span>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Resources Section - Collapsible at Bottom */}
        {(result || catchUpResult) && (
          <section id="resources" className="mt-8">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-slate-600" />
                  <span className="font-medium text-slate-700">Privacy & Resources</span>
                </div>
                <span className="text-sm text-slate-500 group-open:hidden">Click to expand</span>
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    Data Privacy
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• All processing via secure API</li>
                    <li>• No patient data stored</li>
                    <li>• Session-based only</li>
                  </ul>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                    <Syringe className="h-4 w-4 text-blue-600" />
                    Clinical Guidelines
                  </h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Verify against original records</li>
                    <li>• Use with CDC guidelines</li>
                    <li>• Consider contraindications</li>
                  </ul>
                </div>
              </div>
            </details>
          </section>
        )}
        </div>
      </main>

      <QuickActionBar visible={Boolean(result)} onExport={exportData} onFeedback={() => setFeedbackOpen(true)} />

      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 mt-16 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-slate-600">
                Vaccine History Parser v1.0 | Medical Professional Tool
              </div>
              <div className="text-sm text-slate-600">
                Based on CDC Guidelines 2025.2 (Dec 2025) | For healthcare professionals only
              </div>
            </div>
            <div className="text-center text-sm text-slate-500 border-t border-gray-100 pt-3">
              Built in New York • Reviewed by Dr.R with love ❤️
            </div>
          </div>
        </div>
      </footer>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleFeedbackSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Send Feedback
              </DialogTitle>
              <DialogDescription>
                Help us improve! Share your thoughts, report issues, or suggest new features.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="feedback-email" className="text-sm font-medium text-gray-900">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  id="feedback-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  required
                  className="w-full"
                />
                <p className="text-xs text-slate-600">We&apos;ll use this to follow up on your feedback</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="feedback-text" className="text-sm font-medium text-gray-900">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <Textarea
                  id="feedback-text"
                  placeholder="Tell us what you think... suggestions, bugs, feature requests, etc."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  required
                  rows={6}
                  className="w-full resize-none"
                />
                <p className="text-xs text-slate-600">{feedbackText.length}/1000 characters</p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFeedbackOpen(false)}
                disabled={feedbackSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={feedbackSubmitting || !feedbackEmail || !feedbackText}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {feedbackSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

