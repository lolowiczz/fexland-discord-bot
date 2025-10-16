import { Command } from '../../handlers';
import { ApplicationCommandType } from 'discord.js';
import config from '../../../../config.json';

export default new Command({
    name: 'spis-administracji',
    description: "Wyświetla listę osób z rang administracyjnych",
    type: ApplicationCommandType.ChatInput,
    run: async ({ interaction }) => {
        if (!interaction.guild) return;

        const guild = interaction.guild;
        const roleIds: string[] = config['adminsInfo'];

        let message = '**📋 SPIS ADMINISTRACJI**\n';

        for (const roleId of roleIds) {
            const role = guild.roles.cache.get(roleId);
            if (!role) {
                message += `> ❌ Nie znaleziono roli o ID: \`${roleId}\`\n`;
                continue;
            }

            const members = role.members;
            message += `\n> <@&${role.id}>\n`;

            if (!members.size) {
                message += `> - *(Brak członków)*\n`;
                continue;
            }

            for (const member of members.values()) {
                message += `> - <@${member.user.id}>\n`;
            }
        }

        await interaction.reply({ content: message.trim(), allowedMentions: { parse: [] } });
    },
});
