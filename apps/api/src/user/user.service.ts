import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progression: true,
        streak: true,
        character: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);
    const taskCount = await this.prisma.task.count({
      where: {
        milestone: { roadmap: { userId } },
        status: 'completed',
      },
    });
    const roadmapCount = await this.prisma.roadmap.count({
      where: { userId },
    });

    return {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
      subscriptionTier: user.progression?.subscriptionTier ?? 'free',
      totalXp: user.progression?.totalXp ?? 0,
      level: user.progression?.level ?? 1,
      currentStreak: user.streak?.currentStreak ?? 0,
      longestStreak: user.streak?.longestStreak ?? 0,
      roadmapCount,
      tasksCompleted: taskCount,
    };
  }

  async updateDisplayName(userId: string, displayName: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { displayName },
    });
  }

  async completeOnboarding(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompleted: true },
    });
  }

  async updatePreferences(
    userId: string,
    prefs: { quietMode?: boolean; timezone?: string; locale?: string },
  ) {
    // If locale is changing, propagate to active AI-generated content
    if (prefs.locale) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { locale: true },
      });

      if (currentUser && currentUser.locale !== prefs.locale) {
        await this.onLocaleChanged(userId, prefs.locale);
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: prefs,
    });
  }

  /**
   * Language switch strategy:
   * - Completed content → keep as-is (already consumed)
   * - Active roadmaps → update locale so future regen uses new language
   * - Daily quests → regenerate daily anyway, next batch in new locale
   * - Future episodes → automatically use new locale via buildLocaleInstruction
   * - AI cache → invalidated so regeneration uses new locale
   */
  private async onLocaleChanged(userId: string, newLocale: string) {
    // Update locale on all active roadmaps
    await this.prisma.roadmap.updateMany({
      where: { userId, status: { in: ['active', 'generating'] } },
      data: { locale: newLocale },
    });

    // Invalidate AI cache for this user so content regenerates in new locale
    await this.prisma.aiCache.deleteMany({
      where: { cacheKey: { startsWith: `quest:` } },
    });
  }
}
