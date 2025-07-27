"use client";

import Guard from "@/components/Guard";
import React, { useState } from "react";
import { useAuth } from "@/stores/useAuth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/Client/Shell";
import {
  User,
  Shield,
  Bell,
  Trash2,
  Palette,
  Globe,
  Camera,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Building,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useTheme } from "@/stores/useTheme";
import ClientSidebar from "@/components/dashboard/Client/Sidebar";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    projectUpdates: true,
    marketingEmails: false,
    invoiceReminders: true,
    securityAlerts: true,
  });
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("utc");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Guard>
      <DashboardLayout>

      <div className="space-y-8">
        {/* Header Section */}
        <div className="border-b pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Manage your account settings and preferences to customize your
                experience.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="px-3 py-1">
                <User className="h-3 w-3 mr-1" />
                {user?.role === "client" ? "Client Account" : "User Account"}
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="personal-info" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-muted/50">
            <TabsTrigger
              value="personal-info"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal-info" className="space-y-6">
            <Card className="overflow-hidden ">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b -m-6 mb-0 px-12 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Personal Information
                </CardTitle>
                <CardDescription className="text-base">
                  Update your personal details and profile information to keep
                  your account current.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                {/* Profile Picture Section */}
                <div className="flex items-start space-x-6 mb-8 p-6 bg-muted/30 rounded-xl">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-primary" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 shadow-lg group-hover:scale-110 transition-transform"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {user?.name || "Client User"}
                    </h3>
                    <p className="text-muted-foreground mb-2">{user?.email}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="px-3 py-1">
                        {user?.role === "client" ? "Client" : "User"}
                      </Badge>
                      <Badge variant="outline" className="px-3 py-1">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>

                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        defaultValue={user?.name?.split(" ")[0] || ""}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <User className="h-4 w-4" />
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        defaultValue={user?.name?.split(" ")[1] || ""}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@example.com"
                      defaultValue={user?.email || ""}
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+1 (555) 123-4567"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="company"
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        <Building className="h-4 w-4" />
                        Company
                      </Label>
                      <Input
                        id="company"
                        placeholder="Your Company Name"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <textarea
                      id="bio"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Tell us about yourself and your business..."
                    />
                  </div>

                  <Button className="flex items-center gap-2 h-11 px-6">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b -m-6 mb-0 px-12 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Shield className="h-5 w-5 text-accent-foreground" />
                  </div>
                  Security Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Manage your password and security preferences to keep your
                  account safe.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Password Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Change Password
                  </h3>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="currentPassword"
                        className="text-sm font-medium"
                      >
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="newPassword"
                        className="text-sm font-medium"
                      >
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new password"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium"
                      >
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="h-11 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button type="submit" className="h-11 px-6">
                      Update Password
                    </Button>
                  </form>
                </div>

                {/* Two-Factor Authentication */}
                <div className="space-y-4 p-6 bg-muted/30 rounded-xl">
                  <h3 className="text-lg font-semibold">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Enable 2FA</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account with
                        two-factor authentication
                      </p>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                  {twoFactorEnabled && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Two-factor authentication is enabled. You'll receive a
                        code via SMS or authenticator app when signing in.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b -m-6 mb-0 px-12 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-base">
                  Choose what notifications you want to receive and how you want
                  to receive them.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  {/* Communication Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      Communication Methods
                    </h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" />
                            <Label className="font-medium">
                              Email Notifications
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("email", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <Label className="font-medium">
                              SMS Notifications
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via SMS
                          </p>
                        </div>
                        <Switch
                          checked={notifications.sms}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("sms", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">
                      What to notify me about
                    </h3>
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="font-medium">Project Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about project progress, milestones, and
                            deliverables
                          </p>
                        </div>
                        <Switch
                          checked={notifications.projectUpdates}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("projectUpdates", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="font-medium">
                            Invoice Reminders
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Get reminded about upcoming payments and invoices
                          </p>
                        </div>
                        <Switch
                          checked={notifications.invoiceReminders}
                          onCheckedChange={(checked) =>
                            handleNotificationChange(
                              "invoiceReminders",
                              checked
                            )
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="font-medium">Security Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Important security notifications about your account
                          </p>
                        </div>
                        <Switch
                          checked={notifications.securityAlerts}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("securityAlerts", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="space-y-1">
                          <Label className="font-medium">
                            Marketing Emails
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive updates about new features, tips, and
                            promotions
                          </p>
                        </div>
                        <Switch
                          checked={notifications.marketingEmails}
                          onCheckedChange={(checked) =>
                            handleNotificationChange("marketingEmails", checked)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5 border-b -m-6 mb-0 px-12 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Palette className="h-5 w-5 text-accent-foreground" />
                  </div>
                  Appearance & Language
                </CardTitle>
                <CardDescription className="text-base">
                  Customize your experience with theme and language preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  {/* Theme Selection */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Theme Preference
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred theme for the interface
                      </p>
                    </div>
                    <Button
                      onClick={toggleTheme}
                      className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition"
                    >
                      Toggle to {theme === "light" ? "Dark" : "Light"} Mode
                    </Button>
                  </div>

                  {/* Language Selection */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Language
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred language for the interface
                      </p>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                        <SelectItem value="fr">🇫🇷 French</SelectItem>
                        <SelectItem value="de">🇩🇪 German</SelectItem>
                        <SelectItem value="pt">🇵🇹 Portuguese</SelectItem>
                        <SelectItem value="it">🇮🇹 Italian</SelectItem>
                        <SelectItem value="ru">🇷🇺 Russian</SelectItem>
                        <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Timezone */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timezone
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Set your timezone for accurate scheduling and
                      notifications
                    </p>
                  </div>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">
                        UTC (Coordinated Universal Time)
                      </SelectItem>
                      <SelectItem value="est">
                        EST (Eastern Standard Time)
                      </SelectItem>
                      <SelectItem value="pst">
                        PST (Pacific Standard Time)
                      </SelectItem>
                      <SelectItem value="cet">
                        CET (Central European Time)
                      </SelectItem>
                      <SelectItem value="jst">
                        JST (Japan Standard Time)
                      </SelectItem>
                      <SelectItem value="ist">
                        IST (India Standard Time)
                      </SelectItem>
                      <SelectItem value="aest">
                        AEST (Australian Eastern Standard Time)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="flex items-center gap-2 h-11 px-6">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Management Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b -m-6 mb-0 px-12 py-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Download className="h-5 w-5 text-orange-600" />
                  </div>
                  Data Export
                </CardTitle>
                <CardDescription className="text-base">
                  Download a copy of all your data before making any permanent
                  changes.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="p-6 bg-orange-50 dark:bg-orange-950 rounded-xl border border-orange-200 dark:border-orange-800">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Your Data
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                    Download a comprehensive copy of all your projects,
                    messages, invoices, and account data. This includes all your
                    activity history and settings.
                  </p>
                  <Button
                    variant="outline"
                    className="border-orange-300 text-orange-800 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-200 dark:hover:bg-orange-900 h-11 px-6"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Data Archive
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-destructive/20">
              <CardHeader className="bg-gradient-to-r from-red-500/10 to-red-500/5 border-b -m-6 mb-0 px-12 py-6 border-destructive/20">
                <CardTitle className="flex items-center gap-3 text-xl text-destructive">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-base">
                  Permanent actions that cannot be undone. Please be careful.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="p-6 bg-red-50 dark:bg-red-950 rounded-xl border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account Permanently
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-6">
                    Once you delete your account, there is no going back. This
                    action will permanently remove:
                  </p>
                  <ul className="text-sm text-red-700 dark:text-red-300 mb-6 space-y-1 ml-4">
                    <li>• All your projects and work history</li>
                    <li>• Messages and communication records</li>
                    <li>• Invoices and financial data</li>
                    <li>• Profile information and settings</li>
                    <li>• All associated files and documents</li>
                  </ul>
                  <div className="flex items-center gap-4">
                    <Button variant="destructive" className="h-11 px-6">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </DashboardLayout>

    </Guard>
  );
};

export default SettingsPage;
