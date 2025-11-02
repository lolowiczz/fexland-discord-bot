import { ChannelType, EmbedBuilder, TextChannel } from 'discord.js';
import { Event } from '../../extensions/event';
import config from '../../../config.json';

export default new Event('channelDelete', async (channel) => {
    const logsChannelId = config.channels.logChannel;

    const logsChannel = channel.client.channels.cache.get(logsChannelId) as TextChannel;
    if (!logsChannel || logsChannel.type !== ChannelType.GuildText) return;
    if (!('name' in channel)) return;

    const embed = new EmbedBuilder()
        .setTitle('🗑️ Kanał usunięty')
        .addFields(
            { name: 'Nazwa', value: `${channel.name}`, inline: true },
            { name: 'ID', value: `${channel.id}`, inline: true },
            { name: 'Typ', value: `${ChannelType[channel.type] || 'Nieznany'}`, inline: true },
        )
        .setColor('Blue')
        .setTimestamp();

    logsChannel.send({ embeds: [embed] }).catch(console.error);
});
