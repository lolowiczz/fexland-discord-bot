import { Command } from '../../handlers';
import Discord, { ApplicationCommandType, EmbedBuilder, TextChannel } from 'discord.js';

export default new Command({
    name: 'ogloszenie',
    description: "Wyślij ogłoszenie",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'tresc',
            description: 'Treść ogłoszenia',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: 'kanał',
            description: 'Kanał, w którym ma zostać wysłane ogłoszenie',
            type: Discord.ApplicationCommandOptionType.Channel,
            required: true,
        }
    ],
    run: async ({ interaction, args, client }) => {
        const content = args.getString('tresc');
        const channel = args.getChannel('kanał') as TextChannel;
        if (!content || !channel || channel.type !== Discord.ChannelType.GuildText) {
            await interaction.reply({ content: 'Nieprawidłowe dane wejściowe.', flags: 64 });
            return;
        }

        await channel.send({
            embeds: [
                new EmbedBuilder()
                    .setDescription(
                        `
                        # Nowe ogłoszenie 📢
                        ${content}

                        __Dodane przez: ${interaction.user.username}__
                        `
                    )
                    .setFooter({
                        text: `${client.user.username}`,
                        iconURL: client.user?.displayAvatarURL(),
                    })
                    .setTimestamp()
            ]
        });

        await interaction.reply({
            content: `Ogłoszenie zostało wysłane na kanał ${channel}.`,
            flags: 64,
        });
    },
});