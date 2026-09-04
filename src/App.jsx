import { Routes, Route } from 'react-router-dom'
import { PartnerProvider } from './features/about/context/PartnerContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import SplashScreen from './components/SplashScreen'
import Home from './pages/Home'
import About from "./pages/about";
import Programs from './pages/Programs'
import Events from './pages/Events'
import Impact from './pages/Impact'
import Stories from './pages/Stories'
import StoryDetail from './pages/StoryDetail'
import Gallery from './pages/Gallery'
import DonationThankYou from './pages/DonationThankYou'
import GetInvolved from './pages/GetInvolved'
import Donate from './pages/Donate'
import AlliancePage from './pages/AlliancePage'
import {Toaster} from "sonner";
import ScrollToTop from './components/ScrollToTop'
import WhatsAppFab from './components/WhatsAppFab'
import { AuthProvider } from './admin/auth/AuthContext'
import Login from './admin/pages/Login'
import ProtectedRoute from './admin/auth/ProtectedRoute'
import AdminRoutes from './admin/pages/AdminRoutes'

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SplashScreen />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/events" element={<Events />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/stories/:slug" element={<StoryDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/get-involved" element={<GetInvolved />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/alliance" element={<AlliancePage />} />
          <Route path="/donate/thank-you" element={<DonationThankYou />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFab />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <PartnerProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminRoutes />
              </ProtectedRoute>
            }
          />
          <Route path="/*" element={<SiteLayout />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </PartnerProvider>
    </AuthProvider>
  )
}

export default App