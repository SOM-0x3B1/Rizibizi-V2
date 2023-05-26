const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quit')
        .setDescription('Stops the bot and clears the queue!'),
    async execute(interaction, client) {
        const player = useMasterPlayer();

        const queue = player.nodes.get(interaction.guildId);

        if(!queue)
            return await interaction.reply('There are no songs in the queue.');

        queue.delete();
        await interaction.reply('Exiting...');
    }
}