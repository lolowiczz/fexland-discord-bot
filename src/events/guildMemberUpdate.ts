import { Event } from '../extensions/event';
import {
  GuildMember,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import config from '../../config.json';
import client from '..';

const LOG_CHANNEL_ID = config.channels.logChannel;

export default new Event('guildMemberUpdate', async (oldMember: GuildMember, newMember: GuildMember) => {
  const logChannel = client.channels.cache.get(LOG_CHANNEL_ID) as TextChannel;
  if (!logChannel) return;

  const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));
  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));

  for (const [, role] of removedRoles) {
    const embed = new EmbedBuilder()
      .setTitle('Rola usunięta')
      .setDescription(`Użytkownik ${newMember} **stracił** rolę ${role}`)
      .setColor('Red')
      .setTimestamp()
      .setFooter({ text: `${client.user?.username} - Logi ról` });

    await logChannel.send({ embeds: [embed] });
  }

  for (const [, role] of addedRoles) {
    const embed = new EmbedBuilder()
      .setTitle('Rola dodana')
      .setDescription(`Użytkownik ${newMember} **otrzymał** rolę ${role}`)
      .setColor('Green')
      .setTimestamp()
      .setFooter({ text: `${client.user?.username} - Logi ról` });

    await logChannel.send({ embeds: [embed] });
  }
});
