import {
    ActionRowBuilder,
    MessageActionRowComponentBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import { Button } from '../../handlers';

export default new Button({
    custom_id: 'ticketButton',
    run: async ({ interaction }) => {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`ticketSelectMenu`)
            .setPlaceholder(`Wybierz kategorię`)
            .addOptions([
                {
                    label: `Pytanie`,
                    emoji: `❓`,
                    value: `ticket-pytanie`,
                },
                {
                    label: `Zgłoszenie`,
                    emoji: `⚠️`,
                    value: `ticket-zgloszenie`,
                },
                {
                    label: `Współpraca`,
                    emoji: `🤝`,
                    value: `ticket-partnerstwo`,
                },
            ]);

        const selectMenuRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([selectMenu]);

        await interaction.reply({
            components: [selectMenuRow],
            flags: 64,
        });
    },
});
