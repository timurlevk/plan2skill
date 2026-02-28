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
}
