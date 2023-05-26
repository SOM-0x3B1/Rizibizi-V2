const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quit')
        .setDescription('Stops the bot and clears the queue!'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.getQueue(interaction.guildId);

        if(!queue)
            return await interaction.editReply('There are no songs in the queue.');

        queue.destroy();
        await interaction.editReply('Bye!');
    }
}