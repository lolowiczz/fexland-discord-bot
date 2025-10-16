import { Command } from '../../handlers';
import Discord, { ApplicationCommandType, EmbedBuilder } from 'discord.js';

export default new Command({
    name: 'avatar',
    description: "Sprawdź zdjęcie profilowe",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Użytkownik, którego zdjęcie profilowe chcesz sprawdzić',
            type: Discord.ApplicationCommandOptionType.User,
            required: false,
        }
    ],
    run: async ({ interaction, args }) => {
        const user = args.getUser('user') || interaction.user;

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Avatar użytkownika ${user.username}`)
                    .setImage(user.displayAvatarURL({ size: 4096, extension: 'png', forceStatic: false }))
            ],
        });
    },
});
