import {
    TextChannel,
    EmbedBuilder,
    ActionRowBuilder,
    MessageActionRowComponentBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import config from '../../../config.json';
import client from '../..';
import { SelectMenu } from '../handlers';

export default new SelectMenu({
    custom_id: 'panelSelectMenu',
    type: 'String',
    run: async ({ interaction }) => {
        if (interaction.values[0] == 'panel-ticket') {
            const ticketChannel = interaction.guild.channels.cache.get(
                config.channels.ticketPanelChannel
            ) as TextChannel;

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setThumbnail(client.user?.displayAvatarURL())
                .setDescription(
                    `
                    ## 🎫 Centrum pomocy
					> Chcesz **zadać pytanie**, zgłosić **problem** bądź rozpocząć **współpracę**?
                    > Skorzystaj z przycisku poniżej aby utworzyć zgłoszenie!
                    `
                );

            const ticketButton =
                new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticketButton')
                        .setLabel('Utwórz Zgłoszenie')
                        .setStyle(ButtonStyle.Primary)
                );

            await ticketChannel.send({
                embeds: [embed],
                components: [ticketButton],
            });

            await interaction.reply({
                content: `Pomyślnie wysłano panel ticketowy!`,
                flags: 64,
            });
        }
    },
});
