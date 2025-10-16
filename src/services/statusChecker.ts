import { Client, GuildMember } from 'discord.js';
import config from '../../config.json';

const { roleId, statusKeyword, intervalMinutes } = config.statusCheck;

export function startStatusChecker(client: Client) {
    const intervalMs = intervalMinutes * 60 * 1000;

    setInterval(async () => {
        const guild = client.guilds.cache.get(config.guildId);
        if (!guild) {
            console.warn('❌ Nie znaleziono serwera.');
            return;
        }

        await guild.members.fetch();

        guild.members.cache.forEach(async (member: GuildMember) => {
            if (member.user.bot) return;

            const activities = member.presence?.activities || [];
            const hasStatus = activities.some((activity) =>
                (activity.state || '').toLowerCase().includes(statusKeyword.toLowerCase())
            );

            const hasRole = member.roles.cache.has(roleId);

            if (hasStatus && !hasRole) {
                await member.roles.add(roleId).catch(() => {});
            } else if (!hasStatus && hasRole) {
                await member.roles.remove(roleId).catch(() => {});
            }
        });

    }, intervalMs);
}
