import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendService {
  constructor(private readonly prisma: PrismaService) {}

  /** Send a friend request via publicId */
  async sendRequest(userId: string, friendPublicId: string) {
    const friend = await this.prisma.user.findUnique({
      where: { publicId: friendPublicId },
      select: { id: true },
    });
    if (!friend) throw new NotFoundException('User not found');
    if (friend.id === userId) throw new BadRequestException('Cannot friend yourself');

    // Check for existing friendship in either direction
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: friend.id },
          { userId: friend.id, friendId: userId },
        ],
      },
    });
    if (existing) {
      if (existing.status === 'accepted') throw new BadRequestException('Already friends');
      if (existing.status === 'pending') throw new BadRequestException('Request already pending');
      if (existing.status === 'blocked') throw new BadRequestException('Cannot send request');
    }

    return this.prisma.friendship.create({
      data: { userId, friendId: friend.id, status: 'pending' },
    });
  }

  /** Accept a pending friend request */
  async acceptRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship || friendship.friendId !== userId)
      throw new NotFoundException('Request not found');
    if (friendship.status !== 'pending')
      throw new BadRequestException('Request is not pending');

    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    });
  }

  /** Reject (delete) a pending friend request */
  async rejectRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });
    if (!friendship || friendship.friendId !== userId)
      throw new NotFoundException('Request not found');

    await this.prisma.friendship.delete({ where: { id: friendshipId } });
    return { success: true };
  }

  /** Remove an accepted friend */
  async removeFriend(userId: string, friendId: string) {
    const deleted = await this.prisma.friendship.deleteMany({
      where: {
        status: 'accepted',
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
    if (deleted.count === 0) throw new NotFoundException('Friendship not found');
    return { success: true };
  }

  /** Get accepted friends with their display info */
  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ userId }, { friendId: userId }],
      },
      include: {
        user: {
          select: {
            id: true, displayName: true, publicId: true,
            character: { select: { characterId: true } },
            progression: { select: { totalXp: true, level: true } },
            streak: { select: { currentStreak: true } },
            leagueMemberships: {
              take: 1,
              orderBy: { league: { weekStart: 'desc' } },
              select: { weeklyXp: true },
            },
          },
        },
        friend: {
          select: {
            id: true, displayName: true, publicId: true,
            character: { select: { characterId: true } },
            progression: { select: { totalXp: true, level: true } },
            streak: { select: { currentStreak: true } },
            leagueMemberships: {
              take: 1,
              orderBy: { league: { weekStart: 'desc' } },
              select: { weeklyXp: true },
            },
          },
        },
      },
    });

    return friendships.map((f) => {
      const other = f.userId === userId ? f.friend : f.user;
      return {
        publicId: other.publicId ?? '',
        name: other.displayName,
        xp: other.leagueMemberships[0]?.weeklyXp ?? 0,
        charId: other.character?.characterId ?? 'aria',
        streak: other.streak?.currentStreak ?? 0,
        level: other.progression?.level ?? 1,
      };
    });
  }

  /** Get incoming pending requests */
  async getPendingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: { friendId: userId, status: 'pending' },
      include: {
        user: {
          select: {
            displayName: true, publicId: true,
            character: { select: { characterId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      friendshipId: r.id,
      name: r.user.displayName,
      publicId: r.user.publicId ?? '',
      charId: r.user.character?.characterId ?? 'aria',
      createdAt: r.createdAt,
    }));
  }
}
