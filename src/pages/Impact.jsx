// src/pages/Impact.jsx
import { useEffect, useState } from 'react';
import ImpactHeader from '../components/impact/ImpactHeader';
import ImpactStats from '../components/impact/ImpactStats';
import { caseStudies, impactStats as defaultStats } from '../data/impact';
import CaseStudies from '../components/impact/CaseStudies';
import ReportBanner from '../components/impact/ReportBanner';

// Helper: transform admin stats to public format
function transformAdminStats(adminStats) {
  if (!adminStats || !Array.isArray(adminStats)) return defaultStats;

  const colorMap = {
    red: 'coral',
    green: 'green',
    orange: 'gold',
    blue: 'blue',
  };

  return adminStats.map((stat) => {
    const raw = String(stat.value || '0');
    const numberMatch = raw.match(/\d+/);
    const number = numberMatch ? parseInt(numberMatch[0], 10) : 0;
    const suffix = raw.replace(/\d+/g, '').trim();

    return {
      label: stat.label || 'Untitled',
      target: number,
      suffix: suffix || '',
      accentClass: colorMap[stat.colorKey] || 'coral',
    };
  });
}

const STORAGE_KEY = 'anika_admin_impact_stats';

export default function Impact() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length) {
          const transformed = transformAdminStats(parsed);
          setStats(transformed);
        }
      }
    } catch (e) {
      // ignore, keep default
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return null;

  return (
    <>
      <ImpactHeader />
      <ImpactStats stats={stats} />
      <CaseStudies caseStudies={caseStudies} />
      <ReportBanner />
    </>
  );
}