import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';

const ContactAdmin: React.FC = () => {
  const navigate = useNavigate();

  // Admin contact information
  const admins = [
    {
      name: 'Raheem Ehab',
      email: 'RaheemEhab@gmail.com',
      phone: '+1 (555) 123-4567',
      role: 'System Administrator'
    },
    {
      name: 'Atef Mohamed',
      email: 'Atefmohamed@gmail.com',
      phone: '+1 (555) 234-5678',
      role: 'Administrator'
    },
    {
      name: 'Abdallah',
      email: 'Abdallah@gmail.com',
      phone: '+1 (555) 345-6789',
      role: 'Administrator'
    },
    {
      name: 'Shahd',
      email: 'shahd@gmail.com',
      phone: '+1 (555) 456-7890',
      role: 'Administrator'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/login" label="Back to Login" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contact Administrators</h1>
            <p className="text-muted-foreground mt-1">
              Need access to the system? Contact one of our administrators
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Request Access</CardTitle>
            <CardDescription>
              If you need access to the Health Hub EMR System, please contact one of the administrators listed below.
              They can help you create an account and grant you the appropriate permissions.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Admin Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {admins.map((admin, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{admin.name}</CardTitle>
                    <CardDescription className="mt-1">{admin.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a 
                    href={`mailto:${admin.email}`}
                    className="text-primary hover:underline break-all"
                  >
                    {admin.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a 
                    href={`tel:${admin.phone.replace(/\s/g, '')}`}
                    className="text-foreground hover:text-primary"
                  >
                    {admin.phone}
                  </a>
                </div>
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = `mailto:${admin.email}?subject=Access Request&body=Hello ${admin.name},%0D%0A%0D%0AI would like to request access to the Health Hub EMR System.%0D%0A%0D%0AThank you.`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold">What to Include in Your Request</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Your full name</li>
                <li>Your email address</li>
                <li>Your role or department</li>
                <li>Reason for needing access</li>
                <li>Any specific permissions required</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContactAdmin;

