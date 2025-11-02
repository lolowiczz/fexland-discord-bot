import { EmbedBuilder, Message, PartialMessage, TextChannel } from 'discord.js';
import { Event } from '../../extensions/event';
import config from '../../../config.json';

export default new Event('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
    const logsChannelId = config.channels.logChannel;

    if (
        oldMessage.author?.bot ||
        newMessage.author?.bot ||
        !oldMessage.content ||
        !newMessage.content ||
        oldMessage.content === newMessage.content
    ) return;

    const logsChannel = oldMessage.guild?.channels.cache.get(logsChannelId) as TextChannel;
    if (!logsChannel || !logsChannel.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setTitle('✏️ Wiadomość edytowana')
        .setAuthor({ name: `${oldMessage.author.tag}`, iconURL: oldMessage.author.displayAvatarURL() })
        .addFields(
            { name: 'Przed', value: oldMessage.content.slice(0, 1024) || 'Brak', inline: false },
            { name: 'Po', value: newMessage.content.slice(0, 1024) || 'Brak', inline: false },
            { name: 'Kanał', value: `<#${oldMessage.channel.id}>`, inline: true },
            { name: 'ID Wiadomości', value: oldMessage.id, inline: true }
        )
        .setColor('Blue')
        .setTimestamp();

    logsChannel.send({ embeds: [embed] }).catch(console.error);
});
