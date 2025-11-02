import { EmbedBuilder, Role, TextChannel } from 'discord.js';
import { Event } from '../../extensions/event';
import config from '../../../config.json';

export default new Event('roleCreate', async (role: Role) => {
    const logsChannelId = config.channels.logChannel;

    const logsChannel = role.guild.channels.cache.get(logsChannelId) as TextChannel;
    if (!logsChannel || !logsChannel.isTextBased()) return;

    const embed = new EmbedBuilder()
        .setTitle('🆕 Nowa rola utworzona')
        .addFields(
            { name: 'Nazwa', value: role.name, inline: true },
            { name: 'ID', value: role.id, inline: true },
            { name: 'Kolor', value: role.hexColor, inline: true },
            { name: 'Wzmianka', value: `<@&${role.id}>`, inline: true }
        )
        .setColor('Blue')
        .setTimestamp();

    logsChannel.send({ embeds: [embed] }).catch(console.error);
});
