import { ApplicationCommandOptionType, ApplicationCommandType, TextChannel } from 'discord.js';
import { Command } from '../../handlers';

export default new Command({
    name: 'clear',
    type: ApplicationCommandType.ChatInput,
    description: 'Wyczyść wiadomości z kanału',
    options: [
        {
            name: 'ilosc',
            description: 'Ilość wiadomości do wyczyszczenia',
            type: ApplicationCommandOptionType.Integer,
            required: true,
        },
    ],
    run: async ({ interaction, args }) => {
        const amount = args.getInteger('ilosc');

        if (!amount || amount < 1 || amount > 100) {
            return interaction.reply({
                content: '❌ Podaj liczbę wiadomości do wyczyszczenia (1-100).',
                flags: 64,
            });
        }

        const channel = interaction.channel as TextChannel;

        if (!channel) {
            return interaction.reply({
                content: '❌ Nie znaleziono kanału.',
                flags: 64,
            });
        }

        const messages = await channel.messages.fetch({ limit: amount });
        await channel.bulkDelete(messages);

        await interaction.reply({
            content: `✅ Wyczyściłem ${messages.size} wiadomości z kanału ${channel}.`,
            flags: 64,
        });
    },
});
