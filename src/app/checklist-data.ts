export interface ReviewItem {
  id: string;
  description: string;
  priority: 'Must' | 'Should' | 'Opt';
}

export interface ReviewSection {
  id: string;
  title: string;
  items: ReviewItem[];
}

export interface ReviewMember {
  id: string;
  name: string;
}

export interface ReviewTeam {
  id: string;
  shortName: string;
  name: string;
  members: ReviewMember[];
}

export const TEAMS: ReviewTeam[] = [
  { id: 'jl', shortName: 'JL', name: 'Justice LEAPS', members: [] },
  { id: 'lol', shortName: 'LOL', name: 'LEAPS of Legends', members: [] },
  { id: 'aol', shortName: 'AOL', name: 'Agents of LEAP', members: [] },
  { id: 'cad', shortName: 'CAD', name: 'Ctrl Alt DeLEAP', members: [] }
];

export const SECTIONS: ReviewSection[] = [
  {
    id: 'login-security',
    title: 'Login & security',
    items: [
      { id: 'registration-sign-in', description: 'Client registration & secure sign-in; BR-01', priority: 'Must' },
      { id: 'client-data-isolation', description: 'Client can access only their own positions, cash and orders; BR-02', priority: 'Must' },
      { id: 'revocable-sessions', description: 'Sessions time-limited and revocable; BR-03', priority: 'Should' },
      { id: 'account-lockout', description: 'Account lock after 3 failed sign-in attempts; BR-03', priority: 'Should' },
      { id: 'jwt-expiry', description: 'JWT expires < 5 minutes; BR-03', priority: 'Should' }
    ]
  },
  {
    id: 'holdings-orders',
    title: 'Holdings & orders',
    items: [
      { id: 'submit-order', description: 'Submit buy or sell order for supported instrument; BR-04', priority: 'Must' },
      { id: 'validate-order', description: 'Validate cash, holdings and tradability before accepting; BR-05', priority: 'Must' },
      { id: 'market-hours', description: 'Market hours are honored; BR-05', priority: 'Must' },
      { id: 'persist-order', description: 'Persist accepted order before separate execution, including failures; BR-06', priority: 'Must' },
      { id: 'persist-status', description: 'Status transitioned being persisted & displayed; BR-07', priority: 'Should' },
      { id: 'execution-pricing', description: 'Price against current quote at execution and fill/reject; BR-08', priority: 'Must' },
      { id: 'atomic-trade-record', description: 'Update holdings, cash and permanent trade record atomically; BR-09', priority: 'Must' },
      { id: 'current-holdings-cash', description: 'Show accurate current holdings and cash balance; BR-10', priority: 'Must' },
      { id: 'order-fill-history', description: 'Show chronological history of own orders and fills; BR-11', priority: 'Must' },
      { id: 'history-pagination', description: 'History pagination; BR-11', priority: 'Opt' },
      { id: 'multi-exchange-pricing', description: 'Current market pricing for multiple exchanges; BR-12', priority: 'Must' },
      { id: 'indicative-price', description: 'Show indicative price before submitting order; BR-13', priority: 'Should' },
      { id: 'market-limit-order', description: 'Market-limit order; BR-13', priority: 'Should' },
      { id: 'open-limit-order', description: 'Open limit order; BR-13', priority: 'Opt' }
    ]
  },
  {
    id: 'reporting-insights',
    title: 'Reporting & insights',
    items: [
      { id: 'historical-analysis', description: 'Historical analysis independent of live trading; BR-16', priority: 'Must' },
      { id: 'analysis-performance', description: 'Analysis performance < 10 second response times; BR-16', priority: 'Must' },
      { id: 'etl-resilience', description: 'ETL pipeline should be resilient; BR-16', priority: 'Should' },
      { id: 'etl-frequency', description: 'ETL more frequent than daily; BR-16', priority: 'Opt' },
      { id: 'trading-activity-insights', description: 'Quality of internal trading activity insights; BR-17', priority: 'Should' },
      { id: 'reporting-ux-insights', description: 'UX richness of reporting interface; BR-17', priority: 'Should' }
    ]
  },
  {
    id: 'business-administration',
    title: 'Business administration',
    items: [
      { id: 'revoke-permissions', description: 'Trading permissions can be revoked; BR-04', priority: 'Must' },
      { id: 'security-admin-reporting', description: 'Additional security admin & reporting; BR-04', priority: 'Opt' },
      { id: 'permanent-audit-records', description: 'Permanent attributable order/pricing/balance audit records surviving failures; BR-14', priority: 'Must' },
      { id: 'trade-lifecycle', description: 'Reconstruct complete trade lifecycle for disputes/audit; BR-15', priority: 'Must' },
      { id: 'reporting-ux-admin', description: 'UX richness of reporting interface; BR-15', priority: 'Should' }
    ]
  },
  {
    id: 'extra-features',
    title: 'Extra feature(s)',
    items: [
      { id: 'valuable-capability', description: 'Build and justify one additional valuable capability; BR-18', priority: 'Must' },
      { id: 'watchlist-shortcut', description: 'Watchlist w/shortcut to sell if applicable', priority: 'Opt' },
      { id: 'search-shortcut', description: 'Search results w/shortcut to sell if applicable', priority: 'Opt' },
      { id: 'dark-mode', description: 'Dark mode', priority: 'Opt' },
      { id: 'basic-power-view', description: 'Basic vs power user view', priority: 'Opt' },
      { id: 'accessibility-features', description: 'Accessibility features', priority: 'Opt' },
      { id: 'multi-lingual', description: 'Multi-lingual', priority: 'Opt' },
      { id: 'multi-currencies', description: 'Multi-currencies; BR-10', priority: 'Opt' },
      { id: 'mobile-friendly', description: 'Mobile friendly', priority: 'Opt' },
      { id: 'fee-structure', description: 'Fee structure like in labs', priority: 'Opt' },
      { id: 'extra-feature-2', description: 'EXTRA FEATURE #2; BR-18', priority: 'Opt' },
      { id: 'extra-feature-3', description: 'EXTRA FEATURE #3; BR-18', priority: 'Opt' },
      { id: 'extra-feature-4', description: 'EXTRA FEATURE #4; BR-18', priority: 'Opt' },
      { id: 'extra-feature-5', description: 'EXTRA FEATURE #5; BR-18', priority: 'Opt' }
    ]
  }
];

export const RATING_OPTIONS = [
  { value: '', label: 'Not rated', display: '—' },
  { value: '1', label: '1 star', display: '⭐' },
  { value: '2', label: '2 stars', display: '⭐⭐' },
  { value: '3', label: '3 stars', display: '⭐⭐⭐' },
  { value: '4', label: '4 stars', display: '⭐⭐⭐⭐' },
  { value: '5', label: '5 stars', display: '⭐⭐⭐⭐⭐' },
  { value: 'no', label: 'Does not meet', display: '❌' },
  { value: 'football', label: 'Does not meet', display: '🏈' },
  { value: 'confused', label: 'Needs clarification', display: '❓' },
  { value: 'review', label: 'Review further', display: '🔍' }
] as const;

export type RatingValue = '' | '1' | '2' | '3' | '4' | '5' | 'no' | 'football' | 'confused' | 'review';
