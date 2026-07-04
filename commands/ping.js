module.exports = {
  name: "ping",

  async execute(message) {
    const sent = await message.reply("🏓 Pong!");

    const latency = sent.createdTimestamp - message.createdTimestamp;

    await sent.edit(`🏓 Pong! \`${latency}ms\``);
  }
};
