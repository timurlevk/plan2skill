// ═══════════════════════════════════════════
// GOALS — 32 goals across 5 categories
// Each: id, label, category, popularity, icon (NeonIcon type),
//   trending, hot, relatedSkills, estimatedWeeks
// Icons use NeonIcon SVG system (no emojis)
// ═══════════════════════════════════════════

import type { GoalCategory } from '@plan2skill/types';
import type { NeonIconType } from '../_components/NeonIcon';

export interface GoalData {
  id: string;
  label: string;
  category: GoalCategory;
  popularity: number;
  icon: NeonIconType;
  trending?: boolean;
  hot?: boolean;
  relatedSkills: string[];
  estimatedWeeks: number;
}

export const GOALS: GoalData[] = [
  // ─── Tech (8) ───
  { id: 'ai-ml',        label: 'AI / Machine Learning',   category: 'tech',     popularity: 95, icon: 'target',    hot: true,     relatedSkills: ['Python', 'TensorFlow', 'Statistics'],    estimatedWeeks: 12 },
  { id: 'fullstack',    label: 'Full-Stack Dev',           category: 'tech',     popularity: 88, icon: 'globe',     trending: true, relatedSkills: ['React', 'Node.js', 'Databases'],         estimatedWeeks: 14 },
  { id: 'cybersec',     label: 'Cybersecurity',            category: 'tech',     popularity: 82, icon: 'lock',                    relatedSkills: ['Networking', 'Linux', 'Pen Testing'],     estimatedWeeks: 12 },
  { id: 'cloud',        label: 'Cloud & DevOps',           category: 'tech',     popularity: 80, icon: 'cloud',                   relatedSkills: ['AWS', 'Docker', 'Kubernetes'],            estimatedWeeks: 10 },
  { id: 'mobile',       label: 'Mobile Development',       category: 'tech',     popularity: 75, icon: 'code',                    relatedSkills: ['React Native', 'Swift', 'Kotlin'],        estimatedWeeks: 12 },
  { id: 'data-eng',     label: 'Data Engineering',         category: 'tech',     popularity: 72, icon: 'refresh',                 relatedSkills: ['SQL', 'Spark', 'ETL'],                    estimatedWeeks: 10 },
  { id: 'blockchain',   label: 'Blockchain / Web3',        category: 'tech',     popularity: 68, icon: 'link',                    relatedSkills: ['Solidity', 'Smart Contracts', 'DeFi'],    estimatedWeeks: 10 },
  { id: 'gamedev',      label: 'Game Development',         category: 'tech',     popularity: 65, icon: 'play',                    relatedSkills: ['Unity', 'C#', 'Game Design'],             estimatedWeeks: 14 },

  // ─── Business (6) ───
  { id: 'product',      label: 'Product Management',       category: 'business', popularity: 85, icon: 'clipboard', trending: true, relatedSkills: ['Strategy', 'User Research', 'Roadmaps'],  estimatedWeeks: 8 },
  { id: 'startup',      label: 'Startup & Entrepreneurship', category: 'business', popularity: 82, icon: 'rocket',                relatedSkills: ['Business Model', 'Pitching', 'MVP'],      estimatedWeeks: 10 },
  { id: 'data-analytics', label: 'Data Analytics',         category: 'business', popularity: 80, icon: 'chart',                   relatedSkills: ['Excel', 'SQL', 'Visualization'],          estimatedWeeks: 8 },
  { id: 'marketing',    label: 'Digital Marketing',        category: 'business', popularity: 78, icon: 'volume',                  relatedSkills: ['SEO', 'Ads', 'Content Strategy'],         estimatedWeeks: 8 },
  { id: 'ux-research',  label: 'UX Research',              category: 'business', popularity: 74, icon: 'search',                  relatedSkills: ['User Interviews', 'Surveys', 'Testing'],  estimatedWeeks: 8 },
  { id: 'growth',       label: 'Growth Hacking',           category: 'business', popularity: 70, icon: 'trendUp',                 relatedSkills: ['Analytics', 'A/B Testing', 'Funnels'],    estimatedWeeks: 8 },

  // ─── Creative (6) ───
  { id: 'ui-ux',        label: 'UI/UX Design',             category: 'creative', popularity: 88, icon: 'sparkle',   trending: true, relatedSkills: ['Figma', 'Design Systems', 'Prototyping'], estimatedWeeks: 10 },
  { id: 'motion-3d',    label: 'Motion & 3D Design',       category: 'creative', popularity: 76, icon: 'film',                    relatedSkills: ['After Effects', 'Blender', 'Cinema 4D'],  estimatedWeeks: 12 },
  { id: 'content',      label: 'Content Creation',         category: 'creative', popularity: 72, icon: 'edit',                    relatedSkills: ['Writing', 'Storytelling', 'SEO'],         estimatedWeeks: 6 },
  { id: 'brand',        label: 'Brand Design',             category: 'creative', popularity: 70, icon: 'star',                    relatedSkills: ['Identity', 'Typography', 'Color'],        estimatedWeeks: 8 },
  { id: 'video',        label: 'Video Production',         category: 'creative', popularity: 68, icon: 'camera',                  relatedSkills: ['Premiere Pro', 'DaVinci', 'Editing'],     estimatedWeeks: 8 },
  { id: 'creative-code', label: 'Creative Coding',         category: 'creative', popularity: 65, icon: 'sparkle',                 relatedSkills: ['p5.js', 'shaders', 'generative art'],     estimatedWeeks: 10 },

  // ─── Personal (6) ───
  { id: 'productivity', label: 'Productivity Systems',     category: 'personal', popularity: 80, icon: 'lightning',               relatedSkills: ['Habits', 'Time Mgmt', 'PKM'],             estimatedWeeks: 4 },
  { id: 'leadership',   label: 'Leadership',               category: 'personal', popularity: 78, icon: 'crown',                   relatedSkills: ['Management', 'Delegation', 'EQ'],         estimatedWeeks: 8 },
  { id: 'finance',      label: 'Financial Literacy',       category: 'personal', popularity: 75, icon: 'coins',                   relatedSkills: ['Investing', 'Budgeting', 'Tax'],          estimatedWeeks: 6 },
  { id: 'speaking',     label: 'Public Speaking',          category: 'personal', popularity: 72, icon: 'mic',                     relatedSkills: ['Storytelling', 'Stage Presence', 'Q&A'],   estimatedWeeks: 6 },
  { id: 'critical',     label: 'Critical Thinking',        category: 'personal', popularity: 70, icon: 'target',                  relatedSkills: ['Logic', 'Problem Solving', 'Analysis'],   estimatedWeeks: 6 },
  { id: 'negotiation',  label: 'Negotiation',              category: 'personal', popularity: 68, icon: 'users',                   relatedSkills: ['Persuasion', 'Active Listening', 'BATNA'], estimatedWeeks: 6 },

  // ─── Emerging (6) ───
  { id: 'prompt-eng',   label: 'Prompt Engineering',       category: 'emerging', popularity: 92, icon: 'chat',      hot: true,     relatedSkills: ['LLMs', 'Chain-of-Thought', 'Tooling'],    estimatedWeeks: 6 },
  { id: 'ar-vr',        label: 'AR / VR Development',      category: 'emerging', popularity: 70, icon: 'eye',                     relatedSkills: ['Unity', '3D', 'Spatial Computing'],       estimatedWeeks: 12 },
  { id: 'sustainability', label: 'Sustainability Tech',    category: 'emerging', popularity: 65, icon: 'sun',                     relatedSkills: ['Green Tech', 'ESG', 'Carbon Tracking'],   estimatedWeeks: 8 },
  { id: 'robotics',     label: 'Robotics & IoT',           category: 'emerging', popularity: 62, icon: 'terminal',                relatedSkills: ['Arduino', 'Sensors', 'Embedded'],         estimatedWeeks: 12 },
  { id: 'quantum',      label: 'Quantum Computing',        category: 'emerging', popularity: 58, icon: 'atom',                    relatedSkills: ['Qubits', 'Qiskit', 'Linear Algebra'],     estimatedWeeks: 14 },
  { id: 'biotech',      label: 'BioTech & Bioinformatics', category: 'emerging', popularity: 55, icon: 'code',                    relatedSkills: ['Genomics', 'Python', 'Statistics'],       estimatedWeeks: 14 },
];

export const GOAL_CATEGORIES: { id: GoalCategory | 'all'; label: string; icon: NeonIconType }[] = [
  { id: 'all',       label: 'All',       icon: 'wand' },
  { id: 'tech',      label: 'Tech',      icon: 'terminal' },
  { id: 'business',  label: 'Business',  icon: 'briefcase' },
  { id: 'creative',  label: 'Creative',  icon: 'sparkle' },
  { id: 'personal',  label: 'Personal',  icon: 'star' },
  { id: 'emerging',  label: 'Emerging',  icon: 'search' },
];
