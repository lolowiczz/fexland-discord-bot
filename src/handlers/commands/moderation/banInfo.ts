import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../handlers';

export default new Command({
    name: 'baninfo',
    type: ApplicationCommandType.ChatInput,
    description: 'Informacje o banie',
    options: [
        {
            name: 'osoba',
            description: 'Osoba, o której chcesz uzyskać informacje o banie',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async ({ interaction, args }) => {
        const userId = args.getString('osoba');

        if (!userId) {
            return interaction.reply({
                content: '❌ Nie znaleziono użytkownika.',
                flags: 64,
            });
        }
        const banList = await interaction.guild?.bans.fetch();
        if (!banList) {
            return interaction.reply({
                content: '❌ Nie mogę pobrać listy banów.',
                flags: 64,
            });
        }
        const banInfo = banList.get(userId);
        if (!banInfo) {
            return interaction.reply({
                content: '❌ Użytkownik nie jest zbanowany.',
                flags: 64,
            });
        }
        const embed = new EmbedBuilder()
            .setTitle(`Informacje o banie dla ${banInfo.user.username}`)
            .addFields(
                { name: 'ID', value: banInfo.user.id, inline: true },
                { name: 'Powód', value: banInfo.reason || 'Brak powodu', inline: true },
            )
            .setColor('#00ff43')
            .setTimestamp();

        return interaction.reply({
            embeds: [embed],
        });
    },
});