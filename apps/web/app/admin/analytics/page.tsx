'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminAnalyticsPage() {
  return (
    <AdminPageStub
      title="Analytics"
      description="Platform analytics: user growth, retention cohorts, engagement metrics, revenue tracking."
      icon="chart"
      priority="P1"
      features={[
        'DAU / WAU / MAU line charts (30/90/365 day)',
        'Retention cohorts (Week 0/1/4/12 heatmap)',
        'Revenue: MRR, ARPU, churn rate',
        'Funnel: signup → onboarding → first quest → D7 retention',
        'Engagement: quests/user/day, session length, streak distribution',
        'Quest type popularity breakdown',
        'Equipment economy: forge rate, most-crafted items, coin velocity',
      ]}
    />
  );
}
