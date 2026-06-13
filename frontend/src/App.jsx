import { AppRoutes } from './routes/AppRoutes.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';

function App() {
  return (
    <div className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-text)]">
      <Navbar />
      <main>
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

export default App;
