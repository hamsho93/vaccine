import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Download,
  FileText,
  Github,
  Loader2,
  Menu,
  MessageSquare,
  Target,
  Syringe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader as DrawerHeader,
  SheetTitle as DrawerTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Intake", href: "#intake" },
  { label: "History", href: "#history" },
  { label: "Recommendations", href: "#recommendations" },
  { label: "Resources", href: "#resources" },
];

export type SummaryItem = {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
};

export type NextStepItem = {
  id: string;
  title: string;
  detail: string;
  nextLabel?: string;
};

const steps = [
  { id: 1, label: "Input" },
  { id: 2, label: "Processing" },
  { id: 3, label: "Review" },
];

export const SummaryStrip = ({ items }: { items: SummaryItem[] }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {items.map((item) => (
      <div
        key={item.label}
        className="shadow-card rounded-2xl border border-border/70 bg-white p-4 flex items-center justify-between"
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
          {item.helper && <p className="mt-1 text-xs text-slate-500">{item.helper}</p>}
        </div>
        <div className="rounded-full bg-muted p-2 text-primary">
          <item.icon className="h-5 w-5" />
        </div>
      </div>
    ))}
  </div>
);

export const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="rounded-2xl border border-transparent bg-gradient-card p-4 shadow-card">
    <div className="flex items-center justify-between gap-3">
      {steps.map((step, index) => (
        <div key={step.id} className="flex flex-1 items-center">
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                currentStep >= step.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-slate-500 border border-border",
              )}
            >
              {step.id}
            </div>
            <span className="mt-1 text-xs font-medium text-slate-600">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="mx-2 hidden flex-1 h-px bg-slate-200 md:block" />
          )}
        </div>
      ))}
    </div>
  </div>
);

export const NextStepsCard = ({
  items,
  hasResult,
  onExport,
  onFeedback,
}: {
  items: NextStepItem[];
  hasResult: boolean;
  onExport: (type: "json" | "csv") => void;
  onFeedback: () => void;
}) => (
  <Card className="shadow-card border-0">
    <CardHeader className="pb-3">
      <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        Next steps
      </CardTitle>
      <p className="text-sm text-slate-500">Keep the momentum going with these actions.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-800">
          All recommended vaccines are up to date. Great job!
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.detail}</p>
                {item.nextLabel && (
                  <p className="text-xs text-slate-500 mt-1">{item.nextLabel}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onExport("json")}
            disabled={!hasResult}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onExport("csv")}
            disabled={!hasResult}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="justify-start text-primary" onClick={onFeedback}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Share quick feedback
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const QuickActionBar = ({
  visible,
  onExport,
  onFeedback,
}: {
  visible: boolean;
  onExport: (type: "json" | "csv") => void;
  onFeedback: () => void;
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-40 flex items-center gap-3 rounded-2xl border border-[var(--quick-action-border)] bg-[var(--quick-action-bg)] px-4 py-3 shadow-card lg:hidden">
      <Button variant="outline" size="sm" className="flex-1" onClick={() => onExport("json")}>
        <FileText className="mr-2 h-4 w-4" />
        JSON
      </Button>
      <Button variant="outline" size="sm" className="flex-1" onClick={() => onExport("csv")}>
        <Download className="mr-2 h-4 w-4" />
        CSV
      </Button>
      <Button variant="ghost" size="icon" onClick={onFeedback}>
        <MessageSquare className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const ProcessingBanner = ({ isParsing }: { isParsing: boolean }) => (
  <div className="shadow-card rounded-2xl border border-border/60 bg-white p-4 flex items-center gap-4">
    <div className="rounded-full bg-primary/10 p-3 text-primary">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-900">
        {isParsing ? "Parsing vaccine history" : "Building catch-up recommendations"}
      </p>
      <p className="text-sm text-slate-500">This usually takes 10–30 seconds.</p>
    </div>
  </div>
);

export const TopNav = ({ onFeedback }: { onFeedback: () => void }) => (
  <header className="sticky top-0 z-40 border-b border-border/70 bg-white/85 backdrop-blur-xl">
    <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-gradient-primary p-2 shadow-md">
          <Syringe className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">VaxRecord</p>
          <p className="text-sm font-semibold text-slate-900">Clinical Console</p>
        </div>
      </div>
      <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
        {NAV_ITEMS.map((item) => (
          <a key={item.href} href={item.href} className="transition-colors hover:text-primary">
            {item.label}
          </a>
        ))}
      </nav>
      <div className="hidden md:flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <a href="https://github.com/hamsho93/vaccine" target="_blank" rel="noreferrer" aria-label="GitHub">
            <Github className="h-5 w-5" />
          </a>
        </Button>
        <Button variant="secondary" size="sm" onClick={onFeedback}>
          Share feedback
        </Button>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80">
          <DrawerHeader className="space-y-1">
            <DrawerTitle className="text-left text-lg font-semibold">Navigate</DrawerTitle>
          </DrawerHeader>
          <div className="mt-6 flex flex-col space-y-4">
            {NAV_ITEMS.map((item) => (
              <SheetClose asChild key={item.href}>
                <a href={item.href} className="text-base font-semibold text-slate-800">
                  {item.label}
                </a>
              </SheetClose>
            ))}
            <SheetClose asChild>
              <Button variant="outline" asChild>
                <a href="https://github.com/hamsho93/vaccine" target="_blank" rel="noreferrer">
                  Visit GitHub
                </a>
              </Button>
            </SheetClose>
            <Button className="bg-gradient-primary text-white" onClick={onFeedback}>
              Share feedback
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  </header>
);

