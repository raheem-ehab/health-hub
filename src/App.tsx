import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import MainLayout from "@/layouts/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetails from "@/pages/PatientDetails";
import VisitDetails from "@/pages/VisitDetails";
import Appointments from "@/pages/Appointments";
import Visits from "@/pages/Visits";
import Prescriptions from "@/pages/Prescriptions";
import PatientPrescriptions from "@/pages/PatientPrescriptions";
import PatientMedications from "@/pages/PatientMedications";
import LabResults from "@/pages/LabResults";
import Settings from "@/pages/Settings";
import Doctors from "@/pages/Doctors";
import DoctorProfile from "@/pages/DoctorProfile";
import Notifications from "@/pages/Notifications";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import ContactAdmin from "@/pages/ContactAdmin";
import ForgotPassword from "@/pages/ForgotPassword";
import AdminRoute from "@/components/AdminRoute";
import NotFound from "@/pages/NotFound";
import '@/i18n';
import ChatBot from '@/components/ChatBot';
import AIChatbot from '@/components/AIChatbot';
import SmartChat from '@/components/SmartChat';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/contact-admin" element={<ContactAdmin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<Admin />} />
              </Route>
              
              {/* Protected Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:patientId" element={<PatientDetails />} />
                <Route path="/patients/:patientId/visits/:visitId" element={<VisitDetails />} />
                <Route path="/patients/:patientId/prescriptions" element={<PatientPrescriptions />} />
                <Route path="/patients/:patientId/medications" element={<PatientMedications />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/visits" element={<Visits />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/lab-results" element={<LabResults />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <ChatBot />
          <AIChatbot />
          <SmartChat />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
