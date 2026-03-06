import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { LeagueService } from './league.service';
import { PartyQuestService } from './party-quest.service';

@Module({
  providers: [FriendService, LeagueService, PartyQuestService],
  exports: [FriendService, LeagueService, PartyQuestService],
})
export class SocialModule {}
