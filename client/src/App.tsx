import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Projects from './pages/Projects'
import Agents from './pages/Agents'
import Knowledge from './pages/Knowledge'
import Requirements from './pages/Requirements'
import APIKeys from './pages/APIKeys'
import QuickStart from './pages/QuickStart'
import UsageStats from './pages/UsageStats'
import Resources from './pages/Resources'
import Settings from './pages/Settings'
import ProtectedRoute from './components/ProtectedRoute'
// import Office3D from './pages/Office3D' // Temporarily disabled - requires @react-three/fiber
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { DeployModeProvider } from './context/DeployModeContext'
import { DemoProvider } from './context/DemoContext'

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DeployModeProvider>
          <DemoProvider>
            <BrowserRouter>
              <Routes>
                {/* Public landing page */}
                <Route path="/" element={<Landing />} />
                
                {/* Protected routes - require login */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="requirements" element={<Requirements />} />
                  <Route path="agents" element={<Agents />} />
                  <Route path="knowledge" element={<Knowledge />} />
                  <Route path="api-keys" element={<APIKeys />} />
                  <Route path="quickstart" element={<QuickStart />} />
                  <Route path="usage" element={<UsageStats />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="resources" element={<Resources />} />
                  {/* <Route path="office3d" element={<Office3D />} /> */}
                </Route>
              </Routes>
            </BrowserRouter>
          </DemoProvider>
        </DeployModeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
