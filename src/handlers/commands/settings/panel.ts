import {
    ActionRowBuilder,
    ApplicationCommandType,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import { Command } from '../../handlers';

export default new Command({
    name: 'panel',
    description: 'Otwiera panel administracyjny',
    type: ApplicationCommandType.ChatInput,
    run: async ({ interaction }) => {
        const embed = new EmbedBuilder()
            .setColor(`Blue`)
            .setDescription(
                `
                ## 🤖 Panel administracyjny
                > Wybierz jedną z poniższych akcji aby rozpocząć
                `
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`panelSelectMenu`)
            .setPlaceholder(`Wybierz opcję..`)
            .addOptions([
                {
                    label: `Ticket`,
                    description: `Wybierz, aby wysłać panel ticketowy`,
                    emoji: `🎫`,
                    value: `panel-ticket`,
                },
            ]);

        const selectMenuRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([selectMenu]);

        await interaction.reply({
            embeds: [embed],
            components: [selectMenuRow],
            flags: 64,
        });
    },
});
