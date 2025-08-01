import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ParseVaccineHistoryRequest, VaccineHistoryResult, CatchUpRequest, CatchUpResult } from "@shared/schema";
import { Syringe, Download, FileText, Shield, Info, CheckCircle, AlertCircle, Loader2, Clock, User, Calendar, Target, RefreshCw } from "lucide-react";

export default function VaccineParser() {
  const [result, setResult] = useState<VaccineHistoryResult | null>(null);
  const [catchUpResult, setCatchUpResult] = useState<CatchUpResult | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showCatchUp, setShowCatchUp] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => {
    // Generate a session ID for this browser session
    return crypto.randomUUID();
  });
  const { toast } = useToast();

  const form = useForm<ParseVaccineHistoryRequest>({
    resolver: zodResolver(ParseVaccineHistoryRequest),
    defaultValues: {
      vaccineData: "",
      birthDate: "",
    },
  });

  const parseVaccinesMutation = useMutation({
    mutationFn: async (data: ParseVaccineHistoryRequest) => {
      const response = await apiRequest("POST", "/api/parse-vaccine-history", data, {
        'X-Session-ID': sessionId
      });
      return await response.json();
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
      const response = await apiRequest("POST", "/api/vaccine-catchup", data, {
        'X-Session-ID': sessionId
      });
      return await response.json();
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
      }))
    };

    setShowCatchUp(true);
    catchUpMutation.mutate(catchUpRequest);
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
            <div className="text-right">
              <div className="text-sm text-slate-600">CDC Guidelines Version</div>
              <div className="text-lg font-semibold text-gray-900">2025.1</div>
              <div className="text-xs text-slate-600">Updated: January 2025</div>
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

        {/* Input Section */}
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
                        Enter the patient's birth date to calculate their current age
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

        {/* Catch-Up Recommendations Section */}
        {catchUpResult && (
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
                  <span className="font-semibold">What's Needed Next:</span> These are vaccines the patient still needs based on their age and history. DTaP (for children) and Tdap (for adolescents/adults) are the same vaccine series.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {catchUpResult.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{rec.vaccineName}</h4>
                      <Badge 
                        variant={rec.seriesComplete ? 'default' : 'secondary'}
                        className={rec.seriesComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}
                      >
                        {rec.seriesComplete ? 'Complete' : 'Action Needed'}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-700 mb-3">
                      <div className="font-medium mb-1">Recommendation:</div>
                      <div>{rec.recommendation}</div>
                    </div>

                    {rec.nextDoseDate && (
                      <div className="text-sm text-blue-600 mb-2 flex items-center">
                        <Calendar className="mr-1 h-4 w-4" />
                        Next dose due: {rec.nextDoseDate}
                      </div>
                    )}

                    {rec.notes.length > 0 && (
                      <div className="text-xs text-slate-600 bg-slate-50 rounded p-2">
                        <div className="font-medium mb-1">Notes:</div>
                        <ul className="list-disc pl-4 space-y-0.5">
                          {rec.notes.map((note, noteIndex) => (
                            <li key={noteIndex}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

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
        )}

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
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-600">
              Vaccine History Parser v1.0 | Medical Professional Tool
            </div>
            <div className="text-sm text-slate-600">
              Based on CDC Guidelines 2025.1 | For healthcare professionals only
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
