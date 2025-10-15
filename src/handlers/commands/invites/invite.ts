import { Command } from '../../handlers';
import { ApplicationCommandType } from 'discord.js';

export default new Command({
    name: 'invite',
    type: ApplicationCommandType.User,
    run: async ({ interaction }) => {
        await interaction.reply({
            content: 'Invite command',
            ephemeral: true,
        });
    },
});
