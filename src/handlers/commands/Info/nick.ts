import { Command } from '../../handlers';
import Discord, { ApplicationCommandType } from 'discord.js';

export default new Command({
    name: 'nick',
    description: "Zmień nick użytkownika",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Użytkownik, którego nick chcesz zmienić',
            type: Discord.ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: 'nick',
            description: 'Nowy nick dla użytkownika',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async ({ interaction, args }) => {
        const user = args.getUser('user');
        const newNick = args.getString('nick');
        const member = interaction.guild?.members.cache.get(user.id);
        if (!member) {
            await interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 });
            return;
        }
        if (!interaction.guild?.members.me?.permissions.has('ManageNicknames')) {
            await interaction.reply({ content: 'Nie mam uprawnień do zarządzania nickami.', flags: 64 });
            return;
        }
        await member.setNickname(newNick);
        await interaction.reply({ content: `Zmieniono nick użytkownika ${user.username} na ${newNick}.`, flags: 64 });
    },
});
