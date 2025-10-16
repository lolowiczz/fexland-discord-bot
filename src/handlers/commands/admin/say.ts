import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../handlers';

export default new Command({
    name: 'say',
    type: ApplicationCommandType.ChatInput,
    description: 'Powiedz coś',
    options: [
        {
            name: 'tekst',
            description: 'Tekst do powiedzenia',
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    run: async ({ interaction, args }) => {
        const text = args.getString('tekst');    
        
        await interaction.channel.send({
            content: text,
        });

        await interaction.reply({
            content: 'Wiadomość została wysłana!',
            flags: 64,
        });
    },
});
