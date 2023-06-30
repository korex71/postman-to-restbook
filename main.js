const fs = require("fs");
const path = require("path");

class App {
  postmanData = null;
  fileName = null;
  outputFilename = "";

  constructor({fileName}) {
    this.fileName = fileName;
  }

  toRestbookData(params) {
    const { method, body, url } = params;

    const { raw, options } = body;

    const { host, path, raw: href } = url;

    const { language } = options?.raw;

    const uriHref = new URL(href);

    const restbookStr = {
      kind: 2,
      language: "rest-book",
      value: `${method.toUpperCase()} ${uriHref.origin}\n${
        uriHref.search
      }\nUser-Agent: rest-book\n${
        language == "json" ? "Content-Type: application/json" : ""
      }\n\n${raw}`,
      outputs: [],
    };

    return restbookStr;
  }

  tryTranspileFile() {
    try {

      if(!this.fileName) throw new Error("Invalid file name, filename: " + this.fileName);

      if(!fs.existsSync(this.fileName)) throw new Error("Invalid file name, filename: " + this.fileName);

      const jsonData = fs.readFileSync(
        path.resolve(__dirname, this.fileName),
        "utf8"
      );

      const data = JSON.parse(jsonData);

      this.postmanData = data;

      this.transpile();

      return true;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  transpile() {
    const collections = this.postmanData?.item;

    if (
      !this.postmanData ||
      !this.postmanData ||
      (this.postmanData && !Array.isArray(collections))
    )
      throw new Error("Invalid postman data");

    const restbookModel = [];
    this.outputFilename = this.postmanData.info.name;

    for (const { request } of collections) {
      const { method, body, url } = request;

      const toRestbook = this.toRestbookData({ method, body, url });

      restbookModel.push(toRestbook);
    }

    fs.writeFileSync(
      path.resolve(__dirname, `${this.outputFilename}.restbook`),
      JSON.stringify(restbookModel, null, 2)
    );
  }
}

(() => {
  try {
    const fileName = process.argv[2];

    const AppUtils = new App({fileName});

    const successRead = AppUtils.tryTranspileFile();

    if (successRead) {
      console.log(`Generating restbook from ${fileName}`);
    } else {
      throw new Error("Failed to generate restbook from " + fileName);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    
    process.exit(0);
  }
})();
