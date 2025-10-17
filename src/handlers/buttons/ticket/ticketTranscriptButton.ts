import {
    AttachmentBuilder,
    TextChannel,
} from 'discord.js';
import { Button } from '../../handlers';

export default new Button({
    custom_id: 'ticketTranscriptButton',
    run: async ({ interaction }) => {
        const channel = interaction.channel as TextChannel;

        let allMessages: string[] = [];
        let lastId: string | undefined;

        while (true) {
            const messages = await channel.messages.fetch({ limit: 100, before: lastId });
            if (!messages.size) break;

            messages.forEach(msg => {
                if (!msg.author.bot) {
                    const time = msg.createdAt.toLocaleString();
                    const author = `${msg.author.tag} (${msg.author.id})`;
                    const content = msg.content || msg.attachments.map(a => a.url).join(', ') || '[embed]';
                    allMessages.push(`[${time}] ${author}: ${content}`);
                }
            });

            lastId = messages.last()?.id;
            if (!lastId) break;
        }

        allMessages = allMessages.reverse();

        const transcript = allMessages.join('\n');
        const file = new AttachmentBuilder(Buffer.from(transcript), {
            name: `ticket-transcript-${channel.id}.txt`,
        });

        await interaction.reply({
            content: 'Oto transkrypt ticketu:',
            files: [file],
            flags: 64,
        });
    },
});
