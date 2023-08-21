const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMainPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quit')
        .setDescription('Disconnects the bot and clears the queue!'),
    async execute(interaction, client) {
        const player = useMainPlayer();
        const queue = player.nodes.get(interaction.guildId);

        if (!queue)
            return await interaction.reply(':warning: The player is already offline.');

        if(!interaction.member.voice.channel)
            return interaction.reply(':warning: You need to be in a VC to use this command.');
        else if (interaction.member.voice.channel.id != queue.channel.id)
            return interaction.reply(':warning: You need to be in the same VC as the bot to use this command.');

        queue.delete();
        await interaction.reply(':wave: Disconnecting...');
    }
}