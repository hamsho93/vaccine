import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Info, Syringe } from "lucide-react";

const privacyPoints = [
  "All processing is performed via secure API calls",
  "No patient data is stored or transmitted to external servers",
  "Data is automatically cleared when the session ends",
];

const clinicalPoints = [
  "Always verify structured data against original records",
  "Use in conjunction with current CDC immunization guidelines",
  "Consider individual patient factors and contraindications",
];

export const ImportantInformationCard = () => (
  <Card className="border-0 shadow-card bg-white/90 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="flex items-center">
        <Info className="text-blue-600 mr-2" />
        Important Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        <section>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Data Privacy &amp; Security</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            {privacyPoints.map((text) => (
              <li key={text} className="flex items-start">
                <CheckCircle className="text-emerald-600 mr-2 mt-0.5 h-4 w-4" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Clinical Use Guidelines</h3>
          <ul className="text-sm text-slate-600 space-y-2">
            {clinicalPoints.map((text) => (
              <li key={text} className="flex items-start">
                <Syringe className="text-blue-600 mr-2 mt-0.5 h-4 w-4" />
                {text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </CardContent>
  </Card>
);

