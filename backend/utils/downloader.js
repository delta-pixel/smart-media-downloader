const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const ytdlp = path.join(
  __dirname,
  "../node_modules/youtube-dl-exec/bin",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

const downloadsDir = path.join(
  __dirname,
  "../downloads"
);


const versionCheck = spawn(ytdlp, ["--version"]);

versionCheck.stdout.on("data", (data) => {
  console.log("yt-dlp version:", data.toString().trim());
});

versionCheck.stderr.on("data", (data) => {
  console.error("yt-dlp version check:", data.toString());
});


// Create downloads folder if it doesn't exist
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, {
    recursive: true
  });
}


// ==========================================
// START DOWNLOAD
// ==========================================

function startDownload(url, filename, type, onProgress) {

  const outputTemplate = path.join(
    downloadsDir,
    `${filename}.%(ext)s`
  );

  const args = [
    url,

    "--no-playlist",
    "--newline",

    // YouTube JavaScript challenge support
    "--js-runtimes",
    "node"
  ];


  // ========================================
  // AUDIO
  // ========================================

  if (type === "audio") {

    args.push(
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "192K"
    );

  }

  // ========================================
  // VIDEO
  // ========================================

  else {

    args.push(
      "--format",
      "bestvideo*+bestaudio/best"
    );

  }


  args.push(
    "--output",
    outputTemplate,

    "--print",
    "after_move:filepath"
  );


  console.log("\n🎬 Starting yt-dlp");
  console.log("URL:", url);
  console.log("TYPE:", type);


  // ========================================
  // SPAWN YT-DLP
  // ========================================

  const child = spawn(
    ytdlp,
    args,
    {
      shell: false,
      windowsHide: true
    }
  );


  let stdout = "";
  let stderr = "";

  // Used to handle progress lines that arrive
  // split across multiple data chunks.
  let progressBuffer = "";


  // ========================================
  // PROCESS PROGRESS
  // ========================================

  function processProgress(text) {

    progressBuffer += text;

    // yt-dlp can use \r or \n
    const lines = progressBuffer.split(/\r?\n|\r/);

    // Keep last incomplete line
    progressBuffer = lines.pop() || "";


    for (const line of lines) {

      const match = line.match(
        /\[download\]\s+(\d+(?:\.\d+)?)%/
      );

      if (match) {

        const percent = parseFloat(match[1]);

        console.log(`📊 Progress: ${percent}%`);

        if (onProgress) {
          onProgress(percent);
        }
      }
    }
  }


  // ========================================
  // STDOUT
  // ========================================

  child.stdout.on("data", (data) => {

    const text = data.toString();

    stdout += text;

    process.stdout.write(text);

    // Some yt-dlp output may contain progress
    processProgress(text);
  });


  // ========================================
  // STDERR
  // ========================================

  child.stderr.on("data", (data) => {

    const text = data.toString();

    stderr += text;

    process.stderr.write(text);

    // IMPORTANT:
    // yt-dlp normally sends download progress
    // through stderr.
    processProgress(text);
  });


  // ========================================
  // PROMISE
  // ========================================

  const promise = new Promise(
    (resolve, reject) => {

      child.on("error", (error) => {

        reject(error);

      });


      child.on("close", (code) => {

        if (code !== 0) {

          reject(
            new Error(
              stderr ||
              `yt-dlp exited with code ${code}`
            )
          );

          return;
        }


        // Download finished
        if (onProgress) {
          onProgress(100);
        }


        // ======================================
        // FIND FINAL FILE
        // ======================================

        const files =
          fs.readdirSync(downloadsDir);

        const matchingFiles =
          files.filter(
            (file) =>
              file.startsWith(filename)
          );


        let finalFile = null;


        if (matchingFiles.length > 0) {

          matchingFiles.sort(
            (a, b) =>
              fs.statSync(
                path.join(
                  downloadsDir,
                  b
                )
              ).mtimeMs -
              fs.statSync(
                path.join(
                  downloadsDir,
                  a
                )
              ).mtimeMs
          );


          finalFile =
            matchingFiles[0];
        }


        console.log(
          "✅ Download completed:",
          finalFile
        );


        resolve({
          filename: finalFile
        });

      });

    }
  );


  // ========================================
  // CANCEL DOWNLOAD
  // ========================================

  promise.cancel = () => {

    console.log(
      "⛔ Stopping download..."
    );


    if (child.pid && child.exitCode === null) {
  child.kill("SIGTERM");
}

  };


  return promise;
}


module.exports = {
  startDownload,
  downloadsDir
};


// Create downloads folder if it doesn't exist
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, {
    recursive: true
  });
}


// ==========================================
// START DOWNLOAD
// ==========================================

function startDownload(url, filename, type, onProgress) {

  const outputTemplate = path.join(
    downloadsDir,
    `${filename}.%(ext)s`
  );

  const args = [
    url,

    "--no-playlist",
    "--newline",

    // YouTube JavaScript challenge support
    "--js-runtimes",
    "node"
  ];


  // ========================================
  // AUDIO
  // ========================================

  if (type === "audio") {

    args.push(
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "192K"
    );

  }

  // ========================================
  // VIDEO
  // ========================================

  else {

    args.push(
      "--format",
      "bestvideo*+bestaudio/best"
    );

  }


  args.push(
    "--output",
    outputTemplate,

    "--print",
    "after_move:filepath"
  );


  console.log("\n🎬 Starting yt-dlp");
  console.log("URL:", url);
  console.log("TYPE:", type);


  // ========================================
  // SPAWN YT-DLP
  // ========================================

  const child = spawn(
    ytdlp,
    args,
    {
      shell: false,
      windowsHide: true
    }
  );


  let stdout = "";
  let stderr = "";

  // Used to handle progress lines that arrive
  // split across multiple data chunks.
  let progressBuffer = "";


  // ========================================
  // PROCESS PROGRESS
  // ========================================

  function processProgress(text) {

    progressBuffer += text;

    // yt-dlp can use \r or \n
    const lines = progressBuffer.split(/\r?\n|\r/);

    // Keep last incomplete line
    progressBuffer = lines.pop() || "";


    for (const line of lines) {

      const match = line.match(
        /\[download\]\s+(\d+(?:\.\d+)?)%/
      );

      if (match) {

        const percent = parseFloat(match[1]);

        console.log(`📊 Progress: ${percent}%`);

        if (onProgress) {
          onProgress(percent);
        }
      }
    }
  }


  // ========================================
  // STDOUT
  // ========================================

  child.stdout.on("data", (data) => {

    const text = data.toString();

    stdout += text;

    process.stdout.write(text);

    // Some yt-dlp output may contain progress
    processProgress(text);
  });


  // ========================================
  // STDERR
  // ========================================

  child.stderr.on("data", (data) => {

    const text = data.toString();

    stderr += text;

    process.stderr.write(text);

    // IMPORTANT:
    // yt-dlp normally sends download progress
    // through stderr.
    processProgress(text);
  });


  // ========================================
  // PROMISE
  // ========================================

  const promise = new Promise(
    (resolve, reject) => {

      child.on("error", (error) => {

        reject(error);

      });


      child.on("close", (code) => {

        if (code !== 0) {

          reject(
            new Error(
              stderr ||
              `yt-dlp exited with code ${code}`
            )
          );

          return;
        }


        // Download finished
        if (onProgress) {
          onProgress(100);
        }


        // ======================================
        // FIND FINAL FILE
        // ======================================

        const files =
          fs.readdirSync(downloadsDir);

        const matchingFiles =
          files.filter(
            (file) =>
              file.startsWith(filename)
          );


        let finalFile = null;


        if (matchingFiles.length > 0) {

          matchingFiles.sort(
            (a, b) =>
              fs.statSync(
                path.join(
                  downloadsDir,
                  b
                )
              ).mtimeMs -
              fs.statSync(
                path.join(
                  downloadsDir,
                  a
                )
              ).mtimeMs
          );


          finalFile =
            matchingFiles[0];
        }


        console.log(
          "✅ Download completed:",
          finalFile
        );


        resolve({
          filename: finalFile
        });

      });

    }
  );


  // ========================================
  // CANCEL DOWNLOAD
  // ========================================

  promise.cancel = () => {

    console.log(
      "⛔ Stopping download..."
    );


    if (child.pid && child.exitCode === null) {
  child.kill("SIGTERM");
}

  };


  return promise;
}


module.exports = {
  startDownload,
  downloadsDir
};
