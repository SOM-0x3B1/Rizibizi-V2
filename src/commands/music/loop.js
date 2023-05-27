const { SlashCommandBuilder } = require('@discordjs/builders');
const { useMasterPlayer } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Choose from a few loop options')
        .addNumberOption(option =>
            option.setName('mode')
                .setDescription('What type of looping do you desire?')
                .setRequired(true)
                .addChoices(
                    { name: 'off', value: 0 },
                    { name: 'loop current music', value: 1 },
                    { name: 'loop queue', value: 2 },
                    { name: 'autoplay related songs', value: 3 }
                )),
    async execute(interaction, client) {
        const player = useMasterPlayer();
        const queue = player.nodes.get(interaction.guildId);
        const mode = interaction.options.getNumber('mode');

        let modeName = ['off', 'music loop', 'queue loop', 'autoplay'][mode];

        if (!queue || !queue.node.isPlaying)
            return await interaction.reply('There are no songs in the queue!');

        queue.setRepeatMode(mode);
        if (mode != 0)
            await interaction.reply(`Enabled **${modeName}**.`);
        else
            await interaction.reply(`Disabled looping.`);
    }
}