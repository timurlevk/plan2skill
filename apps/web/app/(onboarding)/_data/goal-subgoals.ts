// ═══════════════════════════════════════════
// GOAL SUB-GOALS — Presets per goal
// Milestones, dreams, projects
// Used in "Define Your Path" phase
// ═══════════════════════════════════════════

export interface SubGoalPreset {
  id: string;
  label: string;
  type: 'milestone' | 'dream' | 'project';
}

const SUB_GOAL_MAP: Record<string, SubGoalPreset[]> = {
  'ai-ml': [
    { id: 'ai-fundamentals', label: 'Understand ML fundamentals', type: 'milestone' },
    { id: 'ai-python', label: 'Build data pipelines in Python', type: 'project' },
    { id: 'ai-model', label: 'Train my first model', type: 'milestone' },
    { id: 'ai-deploy', label: 'Deploy an ML model to production', type: 'project' },
    { id: 'ai-career', label: 'Land an AI/ML role', type: 'dream' },
  ],
  'fullstack': [
    { id: 'fs-frontend', label: 'Master React & modern frontend', type: 'milestone' },
    { id: 'fs-backend', label: 'Build REST & GraphQL APIs', type: 'project' },
    { id: 'fs-database', label: 'Design database schemas', type: 'milestone' },
    { id: 'fs-deploy', label: 'Deploy full-stack apps', type: 'project' },
    { id: 'fs-career', label: 'Become a full-stack developer', type: 'dream' },
  ],
  'cybersec': [
    { id: 'sec-basics', label: 'Learn networking & Linux basics', type: 'milestone' },
    { id: 'sec-pentest', label: 'Complete a CTF challenge', type: 'project' },
    { id: 'sec-web', label: 'Master web app security (OWASP)', type: 'milestone' },
    { id: 'sec-cert', label: 'Get CompTIA Security+ certification', type: 'dream' },
  ],
  'cloud': [
    { id: 'cloud-docker', label: 'Containerize apps with Docker', type: 'milestone' },
    { id: 'cloud-k8s', label: 'Learn Kubernetes orchestration', type: 'milestone' },
    { id: 'cloud-iac', label: 'Infrastructure as Code (Terraform)', type: 'project' },
    { id: 'cloud-cert', label: 'AWS/GCP certification', type: 'dream' },
  ],
  'mobile': [
    { id: 'mob-rn', label: 'Build a React Native app', type: 'project' },
    { id: 'mob-native', label: 'Understand native APIs', type: 'milestone' },
    { id: 'mob-publish', label: 'Publish to App Store', type: 'dream' },
    { id: 'mob-perf', label: 'Optimize app performance', type: 'milestone' },
  ],
  'data-eng': [
    { id: 'de-sql', label: 'Master advanced SQL', type: 'milestone' },
    { id: 'de-etl', label: 'Build ETL pipelines', type: 'project' },
    { id: 'de-spark', label: 'Process big data with Spark', type: 'milestone' },
    { id: 'de-career', label: 'Land a data engineering role', type: 'dream' },
  ],
  'blockchain': [
    { id: 'bc-solidity', label: 'Write smart contracts in Solidity', type: 'project' },
    { id: 'bc-defi', label: 'Understand DeFi protocols', type: 'milestone' },
    { id: 'bc-dapp', label: 'Build a dApp', type: 'project' },
    { id: 'bc-audit', label: 'Perform a security audit', type: 'dream' },
  ],
  'gamedev': [
    { id: 'gd-unity', label: 'Learn Unity fundamentals', type: 'milestone' },
    { id: 'gd-game', label: 'Build and publish a game', type: 'project' },
    { id: 'gd-3d', label: 'Master 3D modeling basics', type: 'milestone' },
    { id: 'gd-studio', label: 'Join/create a game studio', type: 'dream' },
  ],
  'product': [
    { id: 'pm-frameworks', label: 'Master prioritization frameworks', type: 'milestone' },
    { id: 'pm-roadmap', label: 'Create a product roadmap', type: 'project' },
    { id: 'pm-research', label: 'Conduct user research', type: 'milestone' },
    { id: 'pm-role', label: 'Transition to PM role', type: 'dream' },
  ],
  'startup': [
    { id: 'st-idea', label: 'Validate a business idea', type: 'milestone' },
    { id: 'st-mvp', label: 'Build an MVP', type: 'project' },
    { id: 'st-pitch', label: 'Craft a pitch deck', type: 'project' },
    { id: 'st-funding', label: 'Secure seed funding', type: 'dream' },
    { id: 'st-launch', label: 'Launch to first 100 users', type: 'milestone' },
  ],
  'data-analytics': [
    { id: 'da-sql', label: 'Master SQL for analytics', type: 'milestone' },
    { id: 'da-viz', label: 'Build dashboards (Tableau/Power BI)', type: 'project' },
    { id: 'da-stats', label: 'Understand statistical analysis', type: 'milestone' },
    { id: 'da-career', label: 'Land a data analyst role', type: 'dream' },
  ],
  'marketing': [
    { id: 'mk-seo', label: 'Master SEO fundamentals', type: 'milestone' },
    { id: 'mk-ads', label: 'Run paid ad campaigns', type: 'project' },
    { id: 'mk-content', label: 'Build a content strategy', type: 'project' },
    { id: 'mk-growth', label: 'Drive 10x organic traffic', type: 'dream' },
  ],
  'ui-ux': [
    { id: 'ux-figma', label: 'Master Figma', type: 'milestone' },
    { id: 'ux-system', label: 'Build a design system', type: 'project' },
    { id: 'ux-research', label: 'Conduct usability testing', type: 'milestone' },
    { id: 'ux-portfolio', label: 'Create a UX portfolio', type: 'project' },
    { id: 'ux-career', label: 'Land a UX designer role', type: 'dream' },
  ],
  'prompt-eng': [
    { id: 'pe-basics', label: 'Master prompting techniques', type: 'milestone' },
    { id: 'pe-chain', label: 'Build chain-of-thought workflows', type: 'project' },
    { id: 'pe-rag', label: 'Implement RAG pipelines', type: 'project' },
    { id: 'pe-agents', label: 'Build AI agent systems', type: 'dream' },
  ],
  'productivity': [
    { id: 'prod-system', label: 'Build a personal system (GTD/PKM)', type: 'project' },
    { id: 'prod-habits', label: 'Establish daily habits', type: 'milestone' },
    { id: 'prod-tools', label: 'Master productivity tools', type: 'milestone' },
  ],
};

// Generic fallback for goals without specific presets
const GENERIC_SUBGOALS: SubGoalPreset[] = [
  { id: 'gen-basics', label: 'Learn the fundamentals', type: 'milestone' },
  { id: 'gen-project', label: 'Build a hands-on project', type: 'project' },
  { id: 'gen-advanced', label: 'Master advanced concepts', type: 'milestone' },
  { id: 'gen-career', label: 'Apply professionally', type: 'dream' },
];

export function getSubGoalsForGoal(goalId: string): SubGoalPreset[] {
  return SUB_GOAL_MAP[goalId] || GENERIC_SUBGOALS;
}
