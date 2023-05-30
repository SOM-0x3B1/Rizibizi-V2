const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Jump to a given timestamp in the video')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time in "4:20" format, or the number of seconds.')
                .setRequired(true)
        ),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue || !queue.currentTrack)
            return await interaction.reply(':warning: There are no songs in the queue.');

        const time = interaction.options.getString('time');
        let seconds = 0;
        if (time.includes(':')) {
            const timeValues = time.split(':');
            for (let i = 0; i < timeValues.length; i++) {
                let v = parseInt(timeValues[i]);
                let convertValue = (60 * (timeValues.length - i - 1));
                if (!isNaN(v))
                    seconds += v * (convertValue > 0 ? Math.pow(60, convertValue) : 1)
                else
                    return await interaction.reply(`:warning: Invalid time format.`);
            }
        }
        else {
            seconds = parseInt(time);
            if (isNaN(seconds))
                return await interaction.reply(`:warning: Invalid time format.`);
        }

        await queue.node.seek(90);
        await interaction.reply(`:fast_forward: Jumped to **${time}**.`);
    }
}