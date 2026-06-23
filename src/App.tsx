import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Library from './pages/Library'
import Analytics from './pages/Analytics'
import Pricing from './pages/Pricing'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route element={<Layout />}>
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/library" element={<Library />} />
        <Route path="/app/analytics" element={<Analytics />} />
        <Route path="/app/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
