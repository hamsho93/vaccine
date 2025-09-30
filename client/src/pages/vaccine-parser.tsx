import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { amplifyVaccineService } from "@/lib/amplify-client";
import { ParseVaccineHistoryRequest, VaccineHistoryResult, CatchUpRequest, CatchUpResult } from "@shared/schema";
import { Syringe, Download, FileText, Shield, Info, CheckCircle, AlertCircle, Loader2, Clock, User, Calendar, Target, RefreshCw, AlertTriangle, Globe, ShieldCheck, Link as LinkIcon, Plus, Trash2, MessageSquare, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  // Helper functions for vaccine categorization - aligned with actual system
  const categorizeVaccines = (recommendations: any[]) => {
    const categories = {
      actionNeeded: [] as any[],
      complete: [] as any[],
      sharedDecision: [] as any[],
      riskBased: [] as any[],
      international: [] as any[],
      notRecommended: [] as any[]
    };

    recommendations.forEach(rec => {
      // Categorize primarily by decisionType, then by seriesComplete
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
          // For routine and catch-up, categorize by completion status
          if (rec.seriesComplete) {
            categories.complete.push(rec);
          } else {
            categories.actionNeeded.push(rec);
          }
          break;
      }
    });

    return categories;
  };

  const getPriorityIcon = (category: string) => {
    switch (category) {
      case 'actionNeeded': return AlertTriangle;
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
      case 'complete': return 'border-l-emerald-500 bg-emerald-50';
      case 'sharedDecision': return 'border-l-blue-500 bg-blue-50';
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
                  rec.seriesComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {rec.decisionType === 'international-advisory' ? 'International Advisory' :
                 rec.decisionType === 'aged-out' ? 'Aged Out' :
                 rec.seriesComplete ? 'Complete' : 'Action Needed'}
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
    onSuccess: (data: VaccineHistoryResult) => {
      setResult(data);
      setCurrentStep(3);
      toast({
        title: "Vaccine history parsed successfully",
        description: `Processed ${data.vaccines.length} vaccine series`,
      });
    },
    onError: (error: Error) => {
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
      toast({
        title: "Catch-up recommendations generated",
        description: `Generated recommendations for ${data.recommendations.length} vaccines`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Catch-up analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ParseVaccineHistoryRequest) => {
    setCurrentStep(2);
    parseVaccinesMutation.mutate(data);
  };

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

    toast({
      title: `${format.toUpperCase()} exported`,
      description: `Downloaded ${filename}`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Syringe className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vaccine History Parser</h1>
                <p className="text-sm text-slate-600">Medical Professional Tool</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Feedback Button */}
              <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Feedback</span>
                  </Button>
                </DialogTrigger>
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
                        <p className="text-xs text-slate-600">
                          We'll use this to follow up on your feedback
                        </p>
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
                        <p className="text-xs text-slate-600">
                          {feedbackText.length}/1000 characters
                        </p>
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
                        className="bg-blue-600 hover:bg-blue-700"
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

              <div className="text-right">
                <div className="text-sm text-slate-600">CDC Guidelines Version</div>
                <div className="text-lg font-semibold text-gray-900">2025.1</div>
                <div className="text-xs text-slate-600">Updated: September 30, 2025</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workflow Indicator */}
        <div className="mb-8">
          <nav aria-label="Progress" className="flex justify-center">
            <ol className="flex items-center space-x-5">
              <li className="flex items-center">
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <span className={`text-sm font-medium ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>1</span>
                </div>
                <span className={`ml-3 text-sm font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Input Data
                </span>
              </li>
              <li className="flex items-center">
                <div className="flex-auto border-t-2 border-gray-300"></div>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ml-6 ${
                  currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <span className={`text-sm font-medium ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>2</span>
                </div>
                <span className={`ml-3 text-sm font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Process
                </span>
              </li>
              <li className="flex items-center">
                <div className="flex-auto border-t-2 border-gray-300"></div>
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full ml-6 ${
                  currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  <span className={`text-sm font-medium ${currentStep >= 3 ? 'text-white' : 'text-gray-500'}`}>3</span>
                </div>
                <span className={`ml-3 text-sm font-medium ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                  Review & Export
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Input Section */
        }
        <Card className="mb-8">
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
                {/* Mode Toggle */}
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-700 font-medium">Input Mode:</div>
                  <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'text' | 'structured')}>
                    <TabsList>
                      <TabsTrigger value="text">Free Text</TabsTrigger>
                      <TabsTrigger value="structured">Structured</TabsTrigger>
                    </TabsList>
                  </Tabs>
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
                        disabled={parseVaccinesMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {parseVaccinesMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Syringe className="mr-2 h-4 w-4" />
                        )}
                        Parse & Structure Data
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Structured builder */}
                    <div className="space-y-6">
                      {/* Enhanced Add Vaccine Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-dashed border-blue-300">
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
                          <Card key={v.name} className="border-2 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow">
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
                      <Button onClick={handleStructuredSubmit} disabled={parseVaccinesMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                        {parseVaccinesMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Syringe className="mr-2 h-4 w-4" />
                        )}
                        Parse & Structure Data
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Processing State */}
        {parseVaccinesMutation.isPending && (
          <Card className="mb-8">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Vaccine Data</h3>
                <p className="text-slate-600 mb-4">Using AI to parse and structure vaccine history...</p>
                <div className="w-64 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all duration-1000"></div>
                </div>
                <p className="text-sm text-slate-600 mt-2">This may take 10-30 seconds</p>
              </div>
            </CardContent>
          </Card>
        )}
        {parseVaccinesMutation.isError && (
          <Button onClick={() => parseVaccinesMutation.mutate(form.getValues())}>
            Retry Parsing
          </Button>
        )}

        {/* Results Section */}
        {result && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <CheckCircle className="text-emerald-600 mr-2" />
                  Structured Vaccine History
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCatchUpRecommendations}
                    disabled={catchUpMutation.isPending || !result.patientInfo.dateOfBirth}
                  >
                    {catchUpMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Target className="mr-2 h-4 w-4" />
                    )}
                    Generate Catch-Up Plan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportData('json')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => exportData('csv')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Patient Summary */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h3 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-slate-600">Date of Birth:</span>
                    <div className="text-sm text-gray-900">
                      {result.patientInfo.dateOfBirth ? new Date(result.patientInfo.dateOfBirth).toLocaleDateString() : "Not determined"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-600">Current Age:</span>
                    <div className="text-sm text-gray-900">
                      {result.patientInfo.currentAge || "Not determined"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-600">Total Vaccines:</span>
                    <div className="text-sm text-gray-900">
                      {result.patientInfo.totalVaccines} vaccine series
                    </div>
                  </div>
                </div>
              </div>

              {/* Vaccines Table */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Parsed History:</span> Vaccines already given to the patient based on your input. DTaP/Tdap are the same vaccine series but named differently by age.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vaccine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doses Given
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Administration Dates
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient Age at Doses
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Series Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.vaccines.map((vaccine, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{vaccine.standardName}</div>
                            {vaccine.abbreviation && (
                              <div className="text-xs text-slate-600 ml-2">({vaccine.abbreviation})</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {vaccine.doses.length} dose{vaccine.doses.length !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 space-y-1">
                            {vaccine.doses.map((dose, doseIndex) => (
                              <div key={doseIndex}>{dose.date}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 space-y-1">
                            {vaccine.doses.map((dose, doseIndex) => (
                              <div key={doseIndex}>{dose.patientAge}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={vaccine.seriesStatus === 'Complete' ? 'default' : 'secondary'}
                            className={vaccine.seriesStatus === 'Complete' ? 'bg-emerald-100 text-emerald-800' : ''}
                          >
                            {vaccine.seriesStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Processing Notes */}
              {result.processingNotes.length > 0 && (
                <Alert className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Processing Notes</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1 mt-2">
                      {result.processingNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Special Conditions Section removed per request */}

        {/* Enhanced Catch-Up Recommendations Section */}
        {catchUpResult && (() => {
          const categories = categorizeVaccines(catchUpResult.recommendations);
          
          // Smart default tab selection - show most important category first
          const getDefaultTab = () => {
            if (categories.actionNeeded.length > 0) return 'actionNeeded';
            if (categories.sharedDecision.length > 0) return 'sharedDecision';
            if (categories.international.length > 0) return 'international';
            if (categories.complete.length > 0) return 'complete';
            return 'notRecommended';
          };
          
          return (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="text-blue-600 mr-2" />
                  CDC Catch-Up Immunization Recommendations
                </CardTitle>
                <p className="text-sm text-slate-600">
                  Based on patient age ({catchUpResult.patientAge}) and current vaccine history
                </p>
                <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">What&apos;s Needed Next:</span> These are vaccines the patient still needs based on their age and history. DTaP (for children) and Tdap (for adolescents/adults) are the same vaccine series.
                  </p>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Total vaccines:</span> {catchUpResult.recommendations.length}
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Action needed:</span> {categories.actionNeeded.length + categories.sharedDecision.length}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="text-xs">
                      <FileText className="w-3 h-3 mr-1" />
                      Export PDF
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Print Summary
                    </Button>
                  </div>
                </div>

                <Tabs defaultValue={getDefaultTab()} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-6">
                    <TabsTrigger value="actionNeeded" className="flex items-center space-x-1 text-xs sm:text-sm">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Action Needed</span>
                      <span className="sm:hidden">🚨</span>
                      <span>({categories.actionNeeded.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="complete" className="flex items-center space-x-1 text-xs sm:text-sm">
                      <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Complete</span>
                      <span className="sm:hidden">✅</span>
                      <span>({categories.complete.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="sharedDecision" className="flex items-center space-x-1 text-xs sm:text-sm">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Shared Decision</span>
                      <span className="sm:hidden">🤝</span>
                      <span>({categories.sharedDecision.length})</span>
                    </TabsTrigger>
                    {/* Risk-Based tab removed per request */}
                    <TabsTrigger value="international" className="flex items-center space-x-1 text-xs sm:text-sm">
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">International</span>
                      <span className="sm:hidden">🌍</span>
                      <span>({categories.international.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="notRecommended" className="flex items-center space-x-1 text-xs sm:text-sm">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Not Recommended</span>
                      <span className="sm:hidden">❌</span>
                      <span>({categories.notRecommended.length})</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="actionNeeded" className="space-y-4">
                    {categories.actionNeeded.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categories.actionNeeded.map((rec, index) => (
                          <VaccineCard key={index} rec={rec} category="actionNeeded" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                        <p>No vaccinations need immediate action. Great job!</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="complete" className="space-y-4">
                    {categories.complete.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categories.complete.map((rec, index) => (
                          <VaccineCard key={index} rec={rec} category="complete" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                        <p>No completed vaccine series yet.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="sharedDecision" className="space-y-4">
                    {categories.sharedDecision.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categories.sharedDecision.map((rec, index) => (
                          <VaccineCard key={index} rec={rec} category="sharedDecision" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <User className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                        <p>No vaccines requiring shared clinical decision-making.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Risk-Based content removed per request */}

                  <TabsContent value="international" className="space-y-4">
                    {categories.international.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categories.international.map((rec, index) => (
                          <VaccineCard key={index} rec={rec} category="international" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Globe className="w-12 h-12 mx-auto mb-3 text-cyan-500" />
                        <p>No international or travel-related vaccines to consider.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notRecommended" className="space-y-4">
                    {categories.notRecommended.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {categories.notRecommended.map((rec, index) => (
                          <VaccineCard key={index} rec={rec} category="notRecommended" />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                        <p>No contraindicated vaccines. Good safety profile!</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Info className="text-blue-600 mr-2 h-4 w-4" />
                    <span className="font-medium text-blue-900">Important Catch-Up Guidelines</span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Minimum intervals between doses must be maintained</li>
                    <li>• Some vaccines have maximum age limits or special considerations</li>
                    <li>• Always consult CDC catch-up schedule for complex cases</li>
                    <li>• Consider individual patient factors and contraindications</li>
                  </ul>
                </div>

                <div className="mt-4 text-xs text-slate-600 flex items-center justify-between">
                  <span>CDC Guidelines Version: {catchUpResult.cdcVersion}</span>
                  <span>Generated: {new Date(catchUpResult.processedAt).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="text-blue-600 mr-2" />
              Important Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Data Privacy & Security</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="text-emerald-600 mr-2 mt-0.5 h-4 w-4" />
                    All processing is performed via secure API calls
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-emerald-600 mr-2 mt-0.5 h-4 w-4" />
                    No patient data is stored or transmitted to external servers
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="text-emerald-600 mr-2 mt-0.5 h-4 w-4" />
                    Data is automatically cleared when the session ends
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Clinical Use Guidelines</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-start">
                    <Syringe className="text-blue-600 mr-2 mt-0.5 h-4 w-4" />
                    Always verify structured data against original records
                  </li>
                  <li className="flex items-start">
                    <Syringe className="text-blue-600 mr-2 mt-0.5 h-4 w-4" />
                    Use in conjunction with current CDC immunization guidelines
                  </li>
                  <li className="flex items-start">
                    <Syringe className="text-blue-600 mr-2 mt-0.5 h-4 w-4" />
                    Consider individual patient factors and contraindications
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-sm text-slate-600">
                Vaccine History Parser v1.0 | Medical Professional Tool
              </div>
              <div className="text-sm text-slate-600">
                Based on CDC Guidelines 2025.1 | For healthcare professionals only
              </div>
            </div>
            <div className="text-center text-sm text-slate-500 border-t border-gray-100 pt-3">
              Built in New York • Reviewed by Dr.R with love ❤️
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
