import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ForgotPassword: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isArabic = String(i18n.language || 'en').toLowerCase().startsWith('ar');

  const labels = {
    title: isArabic ? 'إعادة تعيين كلمة المرور' : 'Reset Password',
    description: isArabic ? 'أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور.' : 'Enter your email to receive a password reset link.',
    emailPlaceholder: isArabic ? 'أدخل بريدك الإلكتروني' : 'you@example.com',
    submit: isArabic ? 'إرسال' : 'Send',
    back: isArabic ? 'العودة لتسجيل الدخول' : 'Back to sign in'
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) return toast.error(isArabic ? 'الرجاء إدخال بريد إلكتروني صالح.' : 'Please enter a valid email.');
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, lang: i18n.language })
      });
      const data = await res.json();

      // Use returned message if provided; else fallback to language-specific text
      const fallbackAR = 'إذا كان لديك حساب مسجل لدينا، سيتم إرسال رسالة إلى بريدك الإلكتروني تحتوي على رابط إعادة تعيين كلمة المرور.';
      const fallbackEN = 'If you have a registered account, a password reset link will be sent to your email.';
      const reply = data?.message || (isArabic ? fallbackAR : fallbackEN);

      setMessage(reply);
      toast.success(isArabic ? 'تم الإرسال' : 'Sent');
    } catch (err) {
      console.error('Forgot password error', err);
      toast.error(isArabic ? 'حدث خطأ. حاول مرة أخرى.' : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">{labels.title}</h1>
          <p className="text-muted-foreground mt-1">{labels.description}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-elevated p-8 border border-border/50" dir={isArabic ? 'rtl' : 'ltr'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">{isArabic ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={labels.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (isArabic ? 'جاري الإرسال...' : 'Sending...') : labels.submit}
              </Button>
            </div>
          </form>

          {message && (
            <div className="mt-6 bg-muted/5 border border-border rounded-lg p-4 text-center text-sm" dir={isArabic ? 'rtl' : 'ltr'}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <button onClick={() => navigate('/login')} className="text-primary hover:underline">
              {labels.back}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
