const fs = require("fs");

module.exports = {
  name: "setvoyage",

  execute(message, args) {
    if (args.length < 6) {
      return message.reply(
        "❌ Usage: !setvoyage <from> <to> <length 1/2/3> <ship> <date> <time>"
      );
    }

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      return message.reply("❌ Data file error.");
    }

    if (!data.settings) {
      data.settings = { nextVoyageId: 1 };
    }

    if (!data.voyages) {
      data.voyages = {};
    }

    const from = args[0];
    const to = args[1];

    const length = parseInt(args[2]);

    if (![1, 2, 3].includes(length)) {
      return message.reply("❌ Length must be 1, 2, or 3.");
    }

    const ship = args[3];
    const date = args[4];
    const time = args.slice(5).join(" ");

    let idNum = Number(data.settings.nextVoyageId || 1);

    const voyageId = idNum.toString().padStart(4, "0");

    // safety: prevent overwrite
    if (data.voyages[voyageId]) {
      return message.reply("❌ Voyage ID collision. Try again.");
    }

    data.voyages[voyageId] = {
      from,
      to,
      length,
      ship,
      date,
      time,

      salesOpen: false,
      cancelled: false,

      crew: {
        captain: null,
        fo: null,
        gc: null
      },

      cabinMap: {},
      seatMap: {}
    };

    data.settings.nextVoyageId = idNum + 1;

    try {
      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    } catch (err) {
      return message.reply("❌ Failed to save voyage.");
    }

    const price = length === 1 ? 50 : length === 2 ? 75 : 100;

    message.channel.send(
`🚢 VOYAGE CREATED

Voyage ID
${voyageId}

From
${from}

To
${to}

Ship
${ship}

Captain
[unclaimed]

F/O
[unclaimed]

GC
[unclaimed]

Departing
${date}, ${time}

Voyage Length
${length === 1 ? "Short" : length === 2 ? "Medium" : "Long"}

Base Price
$${price}
`
    );
  }
};
