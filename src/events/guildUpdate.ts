import { EmbedBuilder, TextChannel, Guild } from 'discord.js';
import client from '..';
import { Event } from '../extensions/event';
import config from '../../config.json';

export default new Event('guildUpdate', async (oldGuild: Guild, newGuild: Guild) => {
    const channel = client.channels.cache.get(config.channels.boostChannel) as TextChannel;
    if (!channel) return;

    const oldBoostCount = oldGuild.premiumSubscriptionCount || 0;
    const newBoostCount = newGuild.premiumSubscriptionCount || 0;

    if (newBoostCount > oldBoostCount) {
        const embed = new EmbedBuilder()
            .setColor('#B084F7')
            .setAuthor({
                name: `${newGuild.name} - Ulepszony Serwer! 💜`,
                iconURL: client.user?.displayAvatarURL() ?? undefined,
            })
            .setDescription(
                `
                🎉 **Dziękujemy za ulepszenie serwera \`${newGuild.name}\`!**
                
                > 🔼 Aktualnie na serwerze posiadamy **${newBoostCount}** ulepszeń!
            `
            )
            .setFooter({
                text: `${newGuild.name} • Ulepszenia`,
                iconURL: newGuild.iconURL() ?? undefined,
            })
            .setTimestamp();

        channel.send({ embeds: [embed] });
    }
});
