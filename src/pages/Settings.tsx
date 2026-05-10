import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Bell, Shield, Palette, Globe, Database, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  
  // Profile state (stored in local state for frontend-only)
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '(555) 123-4567',
    specialty: 'General Medicine'
  });
  
  // Preferences state
  const [preferences, setPreferences] = useState({
    language: i18n.language || 'en',
    theme: theme,
    emailNotifications: true,
    criticalAlerts: true,
    labResults: true,
    appointmentReminders: false,
    compactMode: false,
    highContrast: false
  });

  // Sync theme state with actual theme
  useEffect(() => {
    setPreferences(prev => ({ ...prev, theme }));
  }, [theme]);

  // Try to load persisted profile from server (if authenticated)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.profile) {
          setProfile(prev => ({ ...prev, ...data.profile }));
        }
      } catch (err) {
        console.warn('Failed to load profile from server', err);
      }
    };

    loadProfile();
  }, []);


  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setPreferences({ ...preferences, language: langCode });
    
    // Set RTL for Arabic
    if (langCode === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = langCode;
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setPreferences({ ...preferences, theme: newTheme });
  };

  const handleSaveProfile = async () => {
    // Save to localStorage for immediate persistence
    localStorage.setItem('userProfile', JSON.stringify(profile));

    // Also attempt to persist to server profile endpoint if authenticated
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(profile)
        });

        if (!response.ok) {
          console.warn('Failed to save profile to server', await response.json().catch(() => ({})));
          toast.success(t('toast.profileSaved'));
          return;
        }

        const data = await response.json();
        // Replace local profile with persisted version if server returned anything
        if (data?.profile) {
          setProfile(prev => ({ ...prev, ...data.profile }));
        }
      }

      toast.success(t('toast.profileSaved'));
    } catch (err) {
      console.warn('Error saving profile to server', err);
      toast.success(t('toast.profileSaved'));
    }
  };

  const handleSavePreferences = () => {
    // Save to localStorage for persistence
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    toast.success(t('toast.preferencesSaved'));
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Profile Section */}
      <section className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('settings.doctorProfile')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.manageAccount')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">{t('settings.fullName')}</label>
            <Input 
              value={profile.name} 
              onChange={(e) => setProfile({...profile, name: e.target.value})}
            />
          </div>
          <div>
            <label className="input-label">{t('settings.email')}</label>
            <Input 
              value={profile.email} 
              type="email"
              onChange={(e) => setProfile({...profile, email: e.target.value})}
            />
          </div>
          <div>
            <label className="input-label">{t('settings.specialty')}</label>
            <Select 
              value={profile.specialty}
              onValueChange={(value) => setProfile({...profile, specialty: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Medicine">General Medicine</SelectItem>
                <SelectItem value="Cardiology">Cardiology</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
                <SelectItem value="Orthopedics">Orthopedics</SelectItem>
                <SelectItem value="Dermatology">Dermatology</SelectItem>
                <SelectItem value="Neurology">Neurology</SelectItem>
                <SelectItem value="Oncology">Oncology</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="input-label">{t('settings.phone')}</label>
            <Input 
              value={profile.phone}
              onChange={(e) => setProfile({...profile, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveProfile} className="gap-2">
            <Save className="w-4 h-4" />
            {t('settings.saveChanges')}
          </Button>
        </div>
      </section>

      {/* Language & Theme */}
      <section className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-info/10 rounded-lg">
            <Globe className="w-5 h-5 text-info" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('settings.languageAndTheme')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.customizeExperience')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="input-label">{t('settings.language')}</label>
            <Select 
              value={preferences.language}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="input-label">{t('settings.theme')}</label>
            <Select 
              value={preferences.theme}
              onValueChange={(value: 'light' | 'dark' | 'system') => handleThemeChange(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('settings.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                <SelectItem value="system">{t('settings.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-warning/10 rounded-lg">
            <Bell className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('settings.notifications')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.configureNotifications')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.emailNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</p>
            </div>
            <Switch 
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => setPreferences({...preferences, emailNotifications: checked})}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.criticalAlerts')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.criticalAlertsDesc')}</p>
            </div>
            <Switch 
              checked={preferences.criticalAlerts}
              onCheckedChange={(checked) => setPreferences({...preferences, criticalAlerts: checked})}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.labResultsNotif')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.labResultsNotifDesc')}</p>
            </div>
            <Switch 
              checked={preferences.labResults}
              onCheckedChange={(checked) => setPreferences({...preferences, labResults: checked})}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.appointmentReminders')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.appointmentRemindersDesc')}</p>
            </div>
            <Switch 
              checked={preferences.appointmentReminders}
              onCheckedChange={(checked) => setPreferences({...preferences, appointmentReminders: checked})}
            />
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('settings.security')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.manageSecurityDesc')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.twoFactorAuth')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.twoFactorDesc')}</p>
            </div>
            <Button variant="outline">{t('settings.enable')}</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.changePassword')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.changePasswordDesc')}</p>
            </div>
            <Button variant="outline">{t('settings.update')}</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.activeSessions')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.activeSessionsDesc')}</p>
            </div>
            <Button variant="outline">{t('settings.viewSessions')}</Button>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/50 rounded-lg">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('settings.appearance')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.customizeAppLook')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.compactMode')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.compactModeDesc')}</p>
            </div>
            <Switch 
              checked={preferences.compactMode}
              onCheckedChange={(checked) => setPreferences({...preferences, compactMode: checked})}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.highContrast')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.highContrastDesc')}</p>
            </div>
            <Switch 
              checked={preferences.highContrast}
              onCheckedChange={(checked) => setPreferences({...preferences, highContrast: checked})}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSavePreferences} className="gap-2">
            <Save className="w-4 h-4" />
            {t('settings.savePreferences')}
          </Button>
        </div>
      </section>

      {/* System */}
      <section className="bg-card rounded-xl shadow-card border border-border/50 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-success/10 rounded-lg">
            <Database className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{t('settings.systemSection')}</h2>
            <p className="text-sm text-muted-foreground">{t('settings.systemInfo')}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.exportData')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.exportDataDesc')}</p>
            </div>
            <Button variant="outline">{t('settings.export')}</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('settings.version')}</p>
              <p className="text-sm text-muted-foreground">MediCare EMR v1.0.0</p>
            </div>
            <span className="text-sm text-success">{t('settings.upToDate')}</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
