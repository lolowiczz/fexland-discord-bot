import { Command } from '../../handlers';
import Discord, { ApplicationCommandType, EmbedBuilder } from 'discord.js';

export default new Command({
    name: 'iq',
    description: "Sprawdź swoje IQ",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Użytkownik, którego IQ chcesz sprawdzić',
            type: Discord.ApplicationCommandOptionType.User,
            required: false,
        }
    ],
    run: async ({ interaction, args, client }) => {
        const user = args.getUser('user') || interaction.user;
        const iq = Math.floor(Math.random() * 101) + 50;

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: `Sprawdzanie IQ`,
                        iconURL: client.user?.displayAvatarURL(),
                    })
                    .setDescription(`IQ użytkownika **${user.username}** wynosi **${iq}**.`)
                    .setFooter({
                        text: `${client.user.username} - IQ Checker`,
                        iconURL: client.user?.displayAvatarURL(),
                    })
                    .setTimestamp()
            ]
        });
    },
});
