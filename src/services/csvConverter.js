import fs from "fs";
import readline from "readline";


export async function* parseCsv(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let headers = [];
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split by comma (simple case)
    const parts = trimmed.split(",").map((x) => x.trim());

    if (!headers.length) {
      headers = parts;
    } else {
      const obj = {};
      headers.forEach((header, hidx) => {
        const keys = header.split('.');
        let current = obj;
        keys.forEach((key,kidx) => {
          if (kidx === keys.length -1){
            current[key] = parts[hidx];
          }else{
            current[key] = current[key] || {};
            current = current[key];
          }
        })
      });
      yield obj;
    }
  }
}
