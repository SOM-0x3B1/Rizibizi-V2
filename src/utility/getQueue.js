module.exports = {
    async getQueue(player, interaction) {
        let queue = player.nodes.get(interaction.guildId);
        if (!queue) {            
            queue = await player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
                },
                selfDeaf: false,
                volume: 20,
                leaveOnEmpty: true,
                leaveOnEmptyCooldown: 300000,
                leaveOnEnd: true,
                leaveOnEndCooldown: 300000,
            });
        }
        return queue;
    }
}