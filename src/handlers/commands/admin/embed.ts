import {
    ApplicationCommandOptionType,
    ApplicationCommandType,
    ColorResolvable,
    EmbedBuilder
} from 'discord.js';
import { Command } from '../../handlers';

export default new Command({
    name: 'embed',
    type: ApplicationCommandType.ChatInput,
    description: 'Wyślij wiadomość z embedem',
    options: [
        {
            name: 'tytuł',
            description: 'Tytuł embeda',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'opis',
            description: 'Opis embeda',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'kolor',
            description: 'Kolor embeda (HEX np. #ff0000 lub ff0000)',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
        {
            name: 'stopka',
            description: 'Stopka embeda',
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    run: async ({ interaction, args }) => {
        const title = args.getString('tytuł');
        const description = args.getString('opis');
        const colorInput = args.getString('kolor');
        const footer = args.getString('stopka');

        let embedColor: ColorResolvable = 0x2f3136;
        if (colorInput) {
            const cleanColor = colorInput.replace(/^#/, '');
            const isValidHex = /^([0-9A-Fa-f]{6})$/.test(cleanColor);
            if (isValidHex) {
                embedColor = `#${cleanColor}`;
            } else {
                return interaction.reply({
                    content: '❌ Podano nieprawidłowy kolor HEX. Użyj formatu `#RRGGBB` lub `RRGGBB`.',
                    flags: 64,
                });
            }
        }

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(title || '')
            .setDescription(description || '')
            .setFooter(footer ? { text: footer } : null);

        await interaction.reply({
            embeds: [embed],
        });
    },
});
