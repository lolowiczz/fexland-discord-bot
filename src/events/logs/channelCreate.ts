import { ChannelType, EmbedBuilder, GuildChannel, TextChannel } from 'discord.js';
import config from '../../../config.json';
import { Event } from '../../extensions/event';

export default new Event('channelCreate', (channel: GuildChannel) => {
    const logsChannelId = config.channels.logChannel;

    const logsChannel = channel.client.channels.cache.get(logsChannelId) as TextChannel;
    if (!logsChannel || logsChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
        .setTitle('📢 Nowy kanał utworzony')
        .addFields(
            { name: 'Nazwa', value: `${channel.name}`, inline: true },
            { name: 'ID', value: `${channel.id}`, inline: true },
            { name: 'Typ', value: `${ChannelType[channel.type] || 'Nieznany'}`, inline: true },
        )
        .setColor('Blue')
        .setTimestamp();

    logsChannel.send({ embeds: [embed] }).catch(console.error);
});
