import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import dohSeal from './doh-seal.png';
import heroPicture from './hero_picture.jpg';
import bagongLogo from './logo2.png';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={dohSeal}
              alt="Department of Health"
              className="h-9 w-9 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <img
              src={bagongLogo}
              alt="Bagong Pilipinas"
              className="h-9 w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="hidden sm:block w-px h-7 bg-gray-200 mx-1" />
            <div className="hidden sm:block">
              <span className="text-sm font-bold text-gray-900">PMNP</span>
              <span className="text-xs text-gray-400 ml-1.5">Capacity Building Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button size="sm">Login to Portal</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-[1.1fr_1fr] min-h-[580px] items-stretch">

          {/* Left — PMNP visual */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-end justify-center py-10 lg:py-12 lg:pr-8"
          >
            <img
              src={heroPicture}
              alt="Philippine Multisectoral Nutrition Project — Health is Life"
              className="w-full max-w-[480px] lg:max-w-full h-auto object-contain drop-shadow-lg"
            />
          </motion.div>

          {/* Right — Content & CTA */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col justify-center py-12 lg:py-16 lg:pl-8 lg:border-l border-primary-100"
          >
            {/* Government logos */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={dohSeal}
                alt="Department of Health"
                className="h-12 w-12 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="w-px h-10 bg-gray-200" />
              <img
                src={bagongLogo}
                alt="Bagong Pilipinas"
                className="h-12 w-auto object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Philippine Multisectoral Nutrition Project
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-gray-900 leading-tight mb-4">
              Capacity Building<br />
              <span className="text-primary">Program Portal</span>
            </h1>

            <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-sm">
              Manage trainings, import participants, and access Moodle-based learning courses from one unified platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Login to Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Quick stats strip */}
            <div className="flex gap-6 mt-10 pt-8 border-t border-gray-100">
              {[
                { value: '8', label: 'Training Modules' },
                { value: 'Multi-region', label: 'Coverage' },
                { value: 'Moodle', label: 'LMS Integration' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-sm font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  );
}
