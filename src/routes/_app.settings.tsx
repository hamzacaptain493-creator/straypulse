import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { upsertUserPreferences } from "@/lib/services";
import {
  User,
  Palette,
  HelpCircle,
  MoreHorizontal,
  Moon,
  Sun,
  Check,
  ChevronRight,
  LogOut,
  Trash2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTheme, ACCENT_THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [tab, setTab] = useState("account");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Settings</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          <TabsTrigger value="account" className="gap-2">
            <User className="h-4 w-4" /> Account
          </TabsTrigger>
          <TabsTrigger value="customization" className="gap-2">
            <Palette className="h-4 w-4" /> Customization
          </TabsTrigger>
          <TabsTrigger value="help" className="gap-2">
            <HelpCircle className="h-4 w-4" /> Help & Support
          </TabsTrigger>
          <TabsTrigger value="more" className="gap-2">
            <MoreHorizontal className="h-4 w-4" /> More
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <AccountTab />
        </TabsContent>
        <TabsContent value="customization" className="mt-6">
          <CustomizationTab />
        </TabsContent>
        <TabsContent value="help" className="mt-6">
          <HelpTab />
        </TabsContent>
        <TabsContent value="more" className="mt-6">
          <MoreTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountTab() {
  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            SP
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">StrayPulse</div>
          <div className="text-sm text-muted-foreground">Update your profile picture</div>
        </div>
        <Button variant="outline" size="sm" className="ml-auto">Change</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="StrayPulse" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="hello@straypulse.app" />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
        <Button variant="outline">
          <LogOut className="mr-2 h-4 w-4" />
          Change Password
        </Button>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </div>
    </Card>
  );
}

function CustomizationTab() {
  const { dark, toggleDark, accentId, selectAccent } = useTheme();
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    upsertUserPreferences(user.id, dark ? "dark" : "light").catch(() => {});
  }, [dark, user]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          <h2 className="text-lg font-semibold">Theme Mode</h2>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-muted p-4">
          <div>
            <div className="font-medium">Dark mode</div>
            <div className="text-sm text-muted-foreground">
              Reduce glare in low-light environments.
            </div>
          </div>
          <Switch checked={dark} onCheckedChange={(v) => toggleDark(v)} />
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <h2 className="text-lg font-semibold">Accent Colors</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACCENT_THEMES.map((theme) => {
            const active = theme.id === accentId;
            return (
              <button
                key={theme.id}
                onClick={() => selectAccent(theme.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: theme.swatch }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {theme.name}
                </span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function HelpTab() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold">We're here to help</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get in touch or report an issue.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1">Contact Support</Button>
          <Button variant="outline" className="flex-1">Report a Problem</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-2 text-lg font-semibold">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="q1">
            <AccordionTrigger>How do I add an animal?</AccordionTrigger>
            <AccordionContent>
              Head to the Animals page and tap "Add Animal" to register a new stray.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>What do the health metrics mean?</AccordionTrigger>
            <AccordionContent>
              StrayPulse tags report temperature, heart rate, and battery from a
              small tracker.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Is my data private?</AccordionTrigger>
            <AccordionContent>
              Yes — only your profile and follows are visible to the community.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
}

function MoreTab() {
  const items = [
    { label: "Privacy Policy" },
    { label: "Terms" },
    { label: "About StrayPulse" },
  ];
  return (
    <Card className="divide-y divide-border p-0">
      {items.map((item) => (
        <button
          key={item.label}
          className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted"
        >
          <span className="font-medium">{item.label}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      ))}
      <div className="flex items-center justify-between px-6 py-4">
        <span className="font-medium">Version</span>
        <span className="text-sm text-muted-foreground">1.0.0</span>
      </div>
    </Card>
  );
}
