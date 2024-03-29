const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');
const { getThumb } = require('../../utility/getThumb.js');
const { createCanvas, loadImage } = require('canvas')
const { drawStrokedText } = require('../../utility/drawStrokedText.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check_queue')
        .setDescription('Displays the current song queue')
        .addNumberOption((option) => option.setName("page").setDescription('Page number of queue').setMinValue(1)),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || ((queue.currentTrack ? 1 : 0) + queue.tracks.size) == 0)
            return await interaction.reply(':warning: There are no songs in the queue.');

        const totalPages = Math.ceil((queue.tracks.size + (queue.currentTrack ? 1 : 0)) / 10);
        const pageIndex = (interaction.options.getNumber('page') ?? 1) - 1;
        if (pageIndex > totalPages - 1)
            return await interaction.reply(`:warning: Invalid page. There are only a total of ${totalPages === 0 ? 1 : totalPages} pages in the queue.`);
            

        let queueString = '';
        for (let i = pageIndex * 10; i < pageIndex * 10 + 10 && i < queue.tracks.size; i++) {
            let song = queue.tracks.data[i];
            queueString += `**${i + 1}.** [${song.title}](${song.url})\n`;
        }

        const currentSong = queue.currentTrack;

        const countOfQueueImages = queue.tracks.size > 3 ? 3 : queue.tracks.size;
        const canvas = await createCanvas(120 * (countOfQueueImages + 1), 90);
        const ctx = await canvas.getContext('2d');
        ctx.font = 'bold 18px Sans';
        ctx.strokeStyle = 'rgba(0,0,0,255)';
        ctx.fillStyle = 'rgba(255,255,255,255)';

        const currentImage = await loadImage(await getThumb(currentSong.url, 'small'));
        await ctx.drawImage(currentImage, 0, 0, 120, 90);
        await drawStrokedText(ctx, '>', 2, 20);

        for (let i = 0; i < countOfQueueImages; i++) {
            const queueImage = await loadImage(await getThumb(queue.tracks.data[i].url, 'small'));
            await ctx.drawImage(queueImage, 120 * (i + 1), 0, 120, 90);
            await drawStrokedText(ctx, `${i + 1}.`, 120 * (i + 1) + 2, 20);
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Queue')
                    .setDescription(`**Currently playing**\n` +
                        (currentSong ? `[${currentSong.title}](${currentSong.url}) ${queue.repeatMode == 1 ? ':repeat:' : ''}` : 'none') +
                        `\n\n**In queue** ${queue.repeatMode == 2 ? ':repeat:' : ''}\n${queueString}`)
                    .setFooter({
                        text: `Page ${pageIndex + 1} of ${totalPages === 0 ? 1 : totalPages}`
                    })
                    .setImage('attachment://img.png')
            ],
            files: [{
                attachment: await canvas.toBuffer('image/png'),
                name: 'img.png'
            }]
        });
    }
}