const fs = require("fs");

module.exports = {
  name: "setvoyage",

  execute(message, args) {
    // format:
    // example use: !setvoyage Prague Hamburg 2 RO-12 2nd June 5:00 UTC

    if (args.length < 6) {
      return message.reply(
        "❌ Usage: !setvoyage <from> <to> <length 1/2/3> <ship> <date> <time>"
      );
    }

    const filePath = "./data.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const from = args[0];
    const to = args[1];
    const length = parseInt(args[2]);
    const ship = args[3];

    const date = args[4];
    const time = args.slice(5).join(" ");

    // get next voyage ID
    let idNum = data.settings.nextVoyageId || 1;
    const voyageId = idNum.toString().padStart(4, "0");

    // create voyage
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

    // increment ID
    data.settings.nextVoyageId = idNum + 1;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // send staff message (same channel where command is used)
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
$${length === 1 ? 50 : length === 2 ? 75 : 100}
`
    );
  }
};
