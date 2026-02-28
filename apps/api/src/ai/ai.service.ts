import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { GenerateRoadmapInput, Rarity, TaskType } from '@plan2skill/types';

interface AiMilestone {
  title: string;
  description: string;
  weekStart: number;
  weekEnd: number;
  tasks: AiTask[];
}

interface AiTask {
  title: string;
  description: string;
  taskType: TaskType;
  estimatedMinutes: number;
  xpReward: number;
  coinReward: number;
  rarity: Rarity;
}

interface AiRoadmapResult {
  title: string;
  description: string;
  milestones: AiMilestone[];
}

@Injectable()
export class AiService {
  private client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateRoadmap(input: GenerateRoadmapInput): Promise<AiRoadmapResult> {
    const prompt = this.buildRoadmapPrompt(input);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      system: `You are Plan2Skill's AI roadmap architect. You create personalized 90-day learning roadmaps.
Your output must be valid JSON matching the schema exactly. No markdown, no explanation — pure JSON only.
Design roadmaps that are achievable, progressive, and motivating.
XP rewards: Common tasks 15-25 XP, Uncommon 30-50 XP, Rare 60-100 XP, Epic 120-200 XP.
Coin rewards: 5-10 per task, bonus for projects.
Task types: video (watch/learn), article (read), quiz (test knowledge), project (build), review (spaced repetition), boss (capstone challenge).`,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    return JSON.parse(textBlock.text) as AiRoadmapResult;
  }

  private buildRoadmapPrompt(input: GenerateRoadmapInput): string {
    return `Create a 90-day personalized learning roadmap.

**Learner Profile:**
- Goal: ${input.goal}
- Current Role: ${input.currentRole}
- Experience Level: ${input.experienceLevel}
- Daily Time: ${input.dailyMinutes} minutes/day
- Superpower Focus: ${input.superpower}
- Tools they use: ${input.selectedTools.join(', ') || 'None specified'}

**Requirements:**
- Create 6-8 milestones spanning 90 days (each ~2 weeks)
- Each milestone has 8-15 tasks
- Mix task types: video, article, quiz, project, review, boss
- First milestone should be beginner-friendly
- Include at least 1 boss-type task per milestone
- Tasks should be completable in ${input.dailyMinutes} min or less
- Rarity distribution: ~40% common, 25% uncommon, 20% rare, 10% epic, 5% legendary
- Boss tasks should be epic or legendary rarity

**Output JSON schema:**
{
  "title": "string — roadmap title",
  "description": "string — 1-2 sentence description",
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "weekStart": number,
      "weekEnd": number,
      "tasks": [
        {
          "title": "string",
          "description": "string — 1-2 sentences",
          "taskType": "video|article|quiz|project|review|boss",
          "estimatedMinutes": number,
          "xpReward": number,
          "coinReward": number,
          "rarity": "common|uncommon|rare|epic|legendary"
        }
      ]
    }
  ]
}

Return ONLY the JSON. No markdown fences, no explanation.`;
  }
}
