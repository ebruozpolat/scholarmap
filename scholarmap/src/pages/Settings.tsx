import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  CreditCard,
  Bell,
  Palette,
  Shield,
  Database,
  Upload,
  Download,
  Check,
  Trash2,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Globe,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

/* ──────────── types ──────────── */

type SettingsTab =
  | "profile"
  | "subscription"
  | "notifications"
  | "appearance"
  | "security"
  | "data";

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
  { id: "data", label: "Data & Export", icon: Database },
];

/* ──────────── Toggle Switch Component ──────────── */

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-[22px] w-10 shrink-0 cursor-pointer rounded-full transition-colors"
      style={{ background: checked ? "#6366F1" : "#23232D" }}
    >
      <span
        className="inline-block h-[18px] w-[18px] rounded-full bg-white transition-transform absolute top-[2px]"
        style={{ transform: checked ? "translateX(20px)" : "translateX(2px)" }}
      />
    </button>
  );
}

/* ──────────── Profile Section ──────────── */

function ProfileSection() {
  const [name, setName] = useState("Dr. Jane Smith");
  const [institution, setInstitution] = useState("Stanford University");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
          Profile
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8A98" }}>
          Manage your personal information and how it appears across ScholarMap.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold border-2"
          style={{
            background: "rgba(99,102,241,0.12)",
            color: "#6366F1",
            borderColor: "#23232D",
          }}
        >
          JS
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-8 text-xs"
            variant="outline"
            style={{ borderColor: "#23232D", color: "#F0F0F5" }}
          >
            Upload new
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs"
            style={{ color: "#EF4444" }}
          >
            Remove
          </Button>
        </div>
      </div>
      <p className="text-xs" style={{ color: "#5A5A68" }}>
        JPG, PNG or GIF. Max 2MB.
      </p>

      {/* Form */}
      <div className="space-y-5">
        <div className="space-y-1.5">
          <Label className="text-sm" style={{ color: "#8A8A98" }}>
            Full Name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 text-sm rounded-lg"
            style={{
              background: "#0F0F14",
              borderColor: "#23232D",
              color: "#F0F0F5",
            }}
          />
          <p className="text-xs" style={{ color: "#5A5A68" }}>
            This is how your name will appear across the platform.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm" style={{ color: "#8A8A98" }}>
              Email
            </Label>
            <span
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}
            >
              <Check className="w-3 h-3" /> Verified
            </span>
          </div>
          <Input
            value="jane.smith@stanford.edu"
            disabled
            className="h-10 text-sm rounded-lg opacity-60"
            style={{
              background: "#0F0F14",
              borderColor: "#23232D",
              color: "#F0F0F5",
            }}
          />
          <p className="text-xs" style={{ color: "#5A5A68" }}>
            Email cannot be changed. Contact support if needed.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm" style={{ color: "#8A8A98" }}>
            Institution
          </Label>
          <Input
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="Stanford University"
            className="h-10 text-sm rounded-lg"
            style={{
              background: "#0F0F14",
              borderColor: "#23232D",
              color: "#F0F0F5",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm" style={{ color: "#8A8A98" }}>
            Bio
          </Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others about your research interests..."
            rows={4}
            className="text-sm resize-none rounded-lg"
            style={{
              background: "#0F0F14",
              borderColor: "#23232D",
              color: "#F0F0F5",
            }}
          />
          <p
            className={cn(
              "text-xs text-right",
              bio.length > 450 ? "text-[#F59E0B]" : "text-[#5A5A68]"
            )}
          >
            {bio.length}/500
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="h-9 text-sm px-5"
            style={{ background: saved ? "#22C55E" : "#6366F1" }}
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-1.5" /> Saved
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ──────────── Subscription Section ──────────── */

function SubscriptionSection() {
  const billingHistory = [
    { date: "Feb 15, 2025", desc: "Free Plan", amount: "$0.00", status: "Free" },
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
          Subscription
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8A98" }}>
          Manage your plan and billing information.
        </p>
      </div>

      {/* Current Plan */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge
              className="text-[10px] h-5 mb-2"
              style={{
                background: "rgba(99,102,241,0.12)",
                color: "#6366F1",
                border: "none",
              }}
            >
              Free
            </Badge>
            <p className="text-sm" style={{ color: "#8A8A98" }}>
              You are on the Free plan
            </p>
          </div>
        </div>

        {/* Usage bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: "#F0F0F5" }}>Searches</span>
              <span className="text-xs tabular-nums" style={{ color: "#5A5A68" }}>
                7 / 10
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "#1E1E28" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: "70%", background: "#6366F1" }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: "#F0F0F5" }}>Library</span>
              <span className="text-xs tabular-nums" style={{ color: "#5A5A68" }}>
                12 / 100
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "#1E1E28" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: "12%", background: "#6366F1" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pro CTA */}
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{
          background: "rgba(99,102,241,0.06)",
          borderColor: "rgba(99,102,241,0.2)",
        }}
      >
        <div className="relative z-10">
          <h3 className="text-base font-semibold mb-1" style={{ color: "#F0F0F5" }}>
            Upgrade to Pro
          </h3>
          <p className="text-sm mb-3" style={{ color: "#8A8A98" }}>
            $9/month — Unlock the full potential of ScholarMap
          </p>
          <ul className="space-y-1.5 mb-4">
            {[
              "Unlimited searches",
              "Unlimited library storage",
              "Advanced analytics",
              "Priority support",
              "API access",
              "Team collaboration",
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#F0F0F5" }}
              >
                <Check className="w-3.5 h-3.5 text-[#6366F1]" />
                {feature}
              </li>
            ))}
          </ul>
          <Button
            className="h-9 text-sm px-5"
            style={{ background: "#6366F1" }}
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>

      {/* Billing History */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#F0F0F5" }}>
          Billing History
        </h4>
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "#0F0F14", borderColor: "#23232D" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: "#16161D" }}>
                <th
                  className="text-left text-xs font-medium uppercase tracking-wider px-3 py-2"
                  style={{ color: "#8A8A98" }}
                >
                  Date
                </th>
                <th
                  className="text-left text-xs font-medium uppercase tracking-wider px-3 py-2"
                  style={{ color: "#8A8A98" }}
                >
                  Description
                </th>
                <th
                  className="text-right text-xs font-medium uppercase tracking-wider px-3 py-2"
                  style={{ color: "#8A8A98" }}
                >
                  Amount
                </th>
                <th
                  className="text-right text-xs font-medium uppercase tracking-wider px-3 py-2"
                  style={{ color: "#8A8A98" }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((row) => (
                <tr key={row.date} className="border-t" style={{ borderColor: "#23232D" }}>
                  <td className="px-3 py-2 text-sm" style={{ color: "#F0F0F5" }}>
                    {row.date}
                  </td>
                  <td className="px-3 py-2 text-sm" style={{ color: "#8A8A98" }}>
                    {row.desc}
                  </td>
                  <td
                    className="px-3 py-2 text-sm text-right tabular-nums"
                    style={{ color: "#F0F0F5" }}
                  >
                    {row.amount}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Badge
                      className="text-[10px] h-5"
                      style={{
                        background: "rgba(99,102,241,0.12)",
                        color: "#6366F1",
                        border: "none",
                      }}
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────── Notifications Section ──────────── */

interface NotifToggle {
  id: string;
  label: string;
  desc: string;
  value: boolean;
}

function NotificationsSection() {
  const [toggles, setToggles] = useState<NotifToggle[]>([
    { id: "n1", label: "New paper alerts", desc: "Get notified when new papers match your saved searches", value: true },
    { id: "n2", label: "Weekly digest", desc: "Weekly summary of trending papers in your field", value: true },
    { id: "n3", label: "Citation updates", desc: "When one of your saved papers gets cited", value: false },
    { id: "n4", label: "Trending topics", desc: "Notifications about emerging research trends", value: true },
    { id: "n5", label: "Product updates", desc: "New features and improvements", value: true },
    { id: "n6", label: "Library reminders", desc: "Remind me about papers in my reading list", value: false },
    { id: "n7", label: "Team activity", desc: "Updates from shared collections", value: true },
    { id: "n8", label: "Security alerts", desc: "Login from new devices, password changes", value: true },
  ]);

  const updateToggle = (id: string, value: boolean) => {
    setToggles(toggles.map((t) => (t.id === id ? { ...t, value } : t)));
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
          Notifications
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8A98" }}>
          Choose what you want to be notified about.
        </p>
      </div>

      <div className="space-y-3">
        {toggles.map((toggle) => (
          <div
            key={toggle.id}
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{ background: "#0F0F14", borderColor: "#23232D" }}
          >
            <div className="mr-4">
              <p className="text-sm font-medium" style={{ color: "#F0F0F5" }}>
                {toggle.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#5A5A68" }}>
                {toggle.desc}
              </p>
            </div>
            <ToggleSwitch
              checked={toggle.value}
              onChange={(v) => updateToggle(toggle.id, v)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────── Appearance Section ──────────── */

function AppearanceSection() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [density, setDensity] = useState<"compact" | "default" | "comfortable">("default");
  const [accent, setAccent] = useState<string>("#6366F1");

  const accents = [
    { name: "Indigo", value: "#6366F1" },
    { name: "Emerald", value: "#22C55E" },
    { name: "Rose", value: "#EF4444" },
    { name: "Amber", value: "#F59E0B" },
  ];

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
          Appearance
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8A98" }}>
          Customize how ScholarMap looks and feels.
        </p>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <Label className="text-sm" style={{ color: "#8A8A98" }}>
          Theme
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "dark" as const, label: "Dark", icon: Moon },
            { id: "light" as const, label: "Light", icon: Sun },
            { id: "system" as const, label: "System", icon: Monitor },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all"
              style={{
                background: theme === t.id ? "#16161D" : "#0F0F14",
                borderColor:
                  theme === t.id ? "#6366F1" : "#23232D",
                borderWidth: theme === t.id ? "2px" : "1px",
              }}
            >
              <div
                className="w-12 h-8 rounded-md flex items-center justify-center"
                style={{
                  background:
                    t.id === "dark"
                      ? "#08080C"
                      : t.id === "light"
                        ? "#FAFAFB"
                        : "linear-gradient(to right, #08080C 50%, #FAFAFB 50%)",
                  border: "1px solid #23232D",
                }}
              >
                <t.icon
                  className="w-4 h-4"
                  style={{ color: t.id === "light" ? "#18181B" : "#8A8A98" }}
                />
              </div>
              <span className="text-xs font-medium" style={{ color: "#F0F0F5" }}>
                {t.label}
              </span>
              {theme === t.id && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "#6366F1" }}
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div className="space-y-3">
        <Label className="text-sm" style={{ color: "#8A8A98" }}>
          Information Density
        </Label>
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ background: "#0F0F14", borderColor: "#23232D" }}
        >
          {(["compact", "default", "comfortable"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className="px-4 py-2 text-xs font-medium capitalize transition-all"
              style={{
                background: density === d ? "#16161D" : "transparent",
                color: density === d ? "#F0F0F5" : "#5A5A68",
                boxShadow: density === d ? "0 1px 4px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="space-y-3">
        <Label className="text-sm" style={{ color: "#8A8A98" }}>
          Accent Color
        </Label>
        <div className="flex items-center gap-3">
          {accents.map((a) => (
            <button
              key={a.value}
              onClick={() => setAccent(a.value)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                style={{
                  background: a.value,
                  borderColor: accent === a.value ? "#F0F0F5" : "transparent",
                  transform: accent === a.value ? "scale(1.1)" : "scale(1)",
                }}
              >
                {accent === a.value && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="text-[10px]" style={{ color: "#8A8A98" }}>
                {a.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────── Security Section ──────────── */

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const sessions = [
    { device: "Chrome on macOS", location: "San Francisco, CA", active: true },
    { device: "Safari on iPhone", location: "San Francisco, CA", active: false },
    { device: "Firefox on Windows", location: "New York, NY", active: false },
  ];

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
          Security
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8A98" }}>
          Manage your password and account security.
        </p>
      </div>

      {/* Password Change */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <h4 className="text-sm font-semibold mb-4" style={{ color: "#F0F0F5" }}>
          Change Password
        </h4>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#8A8A98" }}>
              Current Password
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10 text-sm pr-10 rounded-lg"
                style={{
                  background: "#16161D",
                  borderColor: "#23232D",
                  color: "#F0F0F5",
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" style={{ color: "#5A5A68" }} />
                ) : (
                  <Eye className="w-4 h-4" style={{ color: "#5A5A68" }} />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#8A8A98" }}>
              New Password
            </Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 text-sm rounded-lg"
              style={{
                background: "#16161D",
                borderColor: "#23232D",
                color: "#F0F0F5",
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: "#8A8A98" }}>
              Confirm New Password
            </Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 text-sm rounded-lg"
              style={{
                background: "#16161D",
                borderColor: "#23232D",
                color: "#F0F0F5",
              }}
            />
          </div>
          <Button
            className="h-9 text-sm"
            style={{ background: "#6366F1" }}
            disabled={
              !currentPassword || !newPassword || newPassword !== confirmPassword
            }
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* 2FA */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold" style={{ color: "#F0F0F5" }}>
              Two-Factor Authentication
            </h4>
            <p className="text-xs mt-0.5" style={{ color: "#5A5A68" }}>
              Add an extra layer of security to your account
            </p>
          </div>
          <ToggleSwitch checked={twoFAEnabled} onChange={setTwoFAEnabled} />
        </div>
      </div>

      {/* Active Sessions */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "#23232D" }}>
          <h4 className="text-sm font-semibold" style={{ color: "#F0F0F5" }}>
            Active Sessions
          </h4>
        </div>
        <div className="divide-y" style={{ borderColor: "#23232D" }}>
          {sessions.map((session, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4" style={{ color: "#5A5A68" }} />
                <div>
                  <p className="text-sm" style={{ color: "#F0F0F5" }}>
                    {session.device}
                  </p>
                  <p className="text-xs" style={{ color: "#5A5A68" }}>
                    {session.location}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.active && (
                  <Badge
                    className="text-[10px] h-5"
                    style={{
                      background: "rgba(34,197,94,0.12)",
                      color: "#22C55E",
                      border: "none",
                    }}
                  >
                    Current
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  style={{ color: "#EF4444" }}
                  disabled={session.active}
                >
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────── Data Export Section ──────────── */

function DataSection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold" style={{ color: "#F0F0F5" }}>
          Data & Export
        </h2>
        <p className="text-sm mt-1" style={{ color: "#8A8A98" }}>
          Export your data or import papers from other sources.
        </p>
      </div>

      {/* Export Formats */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#F0F0F5" }}>
          Export Papers
        </h4>
        <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
          Download your library in your preferred format
        </p>
        <div className="flex items-center gap-2">
          {["BibTeX", "CSV", "PDF"].map((format) => (
            <Button
              key={format}
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              style={{
                borderColor: "#23232D",
                color: "#F0F0F5",
                background: "transparent",
              }}
            >
              <Download className="w-3.5 h-3.5" /> {format}
            </Button>
          ))}
        </div>
      </div>

      {/* Import */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "#0F0F14", borderColor: "#23232D" }}
      >
        <h4 className="text-sm font-semibold mb-3" style={{ color: "#F0F0F5" }}>
          Import Papers
        </h4>
        <p className="text-xs mb-4" style={{ color: "#5A5A68" }}>
          Upload BibTeX, RIS, or EndNote files to add papers to your library
        </p>
        <div
          className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer transition-colors hover:border-[#6366F1]"
          style={{ borderColor: "#2E2E3A" }}
        >
          <Upload className="w-8 h-8" style={{ color: "#5A5A68" }} />
          <p className="text-sm font-medium" style={{ color: "#8A8A98" }}>
            Click to upload or drag and drop
          </p>
          <p className="text-xs" style={{ color: "#5A5A68" }}>
            Supports .bib, .ris, .enw files
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "rgba(239,68,68,0.04)",
          borderColor: "rgba(239,68,68,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
          <h4 className="text-sm font-semibold" style={{ color: "#EF4444" }}>
            Danger Zone
          </h4>
        </div>
        <p className="text-xs mb-4" style={{ color: "#8A8A98" }}>
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              style={{
                borderColor: "rgba(239,68,68,0.3)",
                color: "#EF4444",
                background: "rgba(239,68,68,0.08)",
              }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Account
            </Button>
          </DialogTrigger>
          <DialogContent
            style={{
              background: "#16161D",
              borderColor: "#23232D",
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: "#F0F0F5" }}>
                Delete Account
              </DialogTitle>
              <DialogDescription style={{ color: "#8A8A98" }}>
                This action cannot be undone. This will permanently delete your
                account and all associated data.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-xs" style={{ color: "#8A8A98" }}>
                Type <strong style={{ color: "#F0F0F5" }}>delete</strong> to confirm
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="text-sm rounded-lg"
                style={{
                  background: "#0F0F14",
                  borderColor: "#23232D",
                  color: "#F0F0F5",
                }}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(false)}
                style={{
                  borderColor: "#23232D",
                  color: "#F0F0F5",
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={confirmText !== "delete"}
                style={{
                  background: "#EF4444",
                  color: "#fff",
                }}
              >
                Delete Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

/* ──────────── Main Settings Component ──────────── */

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const renderSection = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSection />;
      case "subscription":
        return <SubscriptionSection />;
      case "notifications":
        return <NotificationsSection />;
      case "appearance":
        return <AppearanceSection />;
      case "security":
        return <SecuritySection />;
      case "data":
        return <DataSection />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden" style={{ background: "#08080C" }}>
      {/* Settings Navigation */}
      <aside
        className="w-[200px] shrink-0 border-r overflow-y-auto"
        style={{ borderColor: "#23232D" }}
      >
        <div className="p-4 space-y-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "text-[#6366F1]"
                    : "text-[#8A8A98] hover:bg-[#1E1E28]"
                )}
                style={
                  isActive
                    ? { background: "rgba(99,102,241,0.12)" }
                    : undefined
                }
              >
                <Icon className="w-[18px] h-[18px]" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {renderSection()}
      </main>
    </div>
  );
}
