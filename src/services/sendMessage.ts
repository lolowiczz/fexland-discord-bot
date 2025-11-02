import { Client, Guild } from 'discord.js';
import bannedIds from '../../bannedId.json';

export class MessageTracker {
  private sentCount: number = 0;

  constructor(private client: Client) {}

  public async sendMessageToAllMembers(guild: Guild, message: string): Promise<number> {
    this.sentCount = 0;

    const members = await guild.members.fetch();

    for (const member of members.values()) {
      if (member.user.bot) continue;
      if (bannedIds.includes(member.id)) continue;

      try {
        await member.send(message);
        this.sentCount++;
      } catch (error) {
        console.error(`Nie można wysłać wiadomości do ${member.user.tag}: ${error}`);
      }
    }

    return this.sentCount;
  }

  public getSentCount(): number {
    return this.sentCount;
  }
}
