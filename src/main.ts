import { Client } from "./Client.js";
import { Bar, Presets } from 'cli-progress';
import { ArgumentParser } from "argparse"


const getParser = () => {
  const parser = new ArgumentParser({
    description: "BitTorrent Client",
  });

  parser.add_argument("files", { nargs: "+" });

  parser.add_argument("-p", "--port", {
    help: "Port of the BitTorrent Application",
  });

  return parser;
};

function main() {
  const args = getParser().parse_args();
  const files = args.files;
  const client = new Client({ port: args.port });
  const torrents = [];
  for (const f of files) {
    const options = {
      downloadPath: args.download_path,
      uploadLimit: args.upload_limit,
      downloadLimit: args.download_limit,
      maxConnections: args.max_connections,
    };
    const torrent = client.addTorrent(f, options);
    const progressBar = new Bar(
      {
        format:
          "\x1b[40m\x1b[35mTorrent Progress\x1b[32m {bar} \x1b[31m{percentage}% | \x1b[36mETA: {eta}s |\x1b[33m {value}/{total}" +
          " \x1b[37mSpeed: {Speed} | \x1b[33m Peers: {peers}",
      },
      Presets.shades_classic
    );
    progressBar.start(torrent.numPieces, 0, { Speed: "N/A", peers: 0 });
    let numDone = 0;
    torrent.start((event, data) => {
      if (event === "progress") {
        progressBar.update(data.numDone);
        numDone = data.numDone;
      }
      if (event === "saved") {
        progressBar.stop();
        client.closeSeeder();
      }
      if (event === "peers") {
        progressBar.update(numDone, { peers: data.peers });
      }
      if (event === "rate-update") {
        const downSpeed = Math.floor(data.downSpeed / 1024);
        if (downSpeed < 1000) {
          progressBar.update(numDone, {
            Speed: Math.floor(downSpeed) + "Kb/s",
          });
        } else {
          progressBar.update(numDone, {
            Speed: Math.floor(downSpeed / 1024) + "Mb/s",
          });
        }
      }
    });
    torrents.push(torrent);
  }
}

main();
