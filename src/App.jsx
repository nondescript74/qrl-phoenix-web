import { Routes, Route, Navigate } from 'react-router-dom'
import { ProfileProvider } from './stores/ProfileContext'
import { EventLogProvider } from './stores/EventLogContext'
import Layout from './components/Layout'
import Coach from './pages/Coach'
import Strategies from './pages/Strategies'
import Discover from './pages/Discover'
import IASG from './pages/IASG'
import IASGAnalysis from './pages/IASGAnalysis'
import CTAEvaluation from './pages/CTAEvaluation'
import Ledger from './pages/Ledger'
import Settings from './pages/Settings'

export default function App() {
  return (
    <ProfileProvider>
      <EventLogProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/coach" element={<Coach />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/iasg" element={<IASG />} />
            <Route path="/iasg/analysis" element={<IASGAnalysis />} />
            <Route path="/iasg/evaluate" element={<CTAEvaluation />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/coach" replace />} />
            <Route path="*" element={<Navigate to="/coach" replace />} />
          </Route>
        </Routes>
      </EventLogProvider>
    </ProfileProvider>
  )
}
