const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');
const { useHistory } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replay')
        .setDescription('Plays the previous song'),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (queue.repeatMode != 2) {
            const history = useHistory(interaction.guild.id);

            if (history.isEmpty())
                return await interaction.reply(':warning: There are no songs in history.');

            await history.back();
            await interaction.reply(`:track_previous: Replaying **${history.currentTrack.title}**.`);
        }
        else {
            /*const skipIndex = queue.tracks.size;
            const newTrack = queue.tracks.data[skipIndex - 1];
            queue.node.jump(newTrack);
            await interaction.reply(`:track_previous: Replaying **${newTrack.title}**.`);*/
            await interaction.reply(`:warning: Sorry, replay doesn't work with looped queues :(.`);
        }
    }
}