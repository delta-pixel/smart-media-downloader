
"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION
// ==========================================

const backendDir = path.resolve(__dirname, "..");

const ytdlp = path.join(
  backendDir,
  "node_modules",
  "youtube-dl-exec",
  "bin",
  process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
);

const downloadsDir = path.join(backendDir, "downloads");

fs.mkdirSync(downloadsDir, { recursive: true });

// ==========================================
// CHECK YT-DLP VERSION
// Runs once when this module loads.
// ==========================================

function checkYtDlpVersion() {
  if (!fs.existsSync(ytdlp)) {
    console.error("yt-dlp executable not found:", ytdlp);
    return;
  }

  const child = spawn(ytdlp, ["--version"], {
    shell: false,
    windowsHide: true
  });

  child.stdout.on("data", (data) => {
    console.log("yt-dlp version:", data.toString().trim());
  });

  child.stderr.on("data", (data) => {
    console.error("yt-dlp version check:", data.toString().trim());
  });

  child.on("error", (error) => {
    console.error("Unable to run yt-dlp version check:", error.message);
  });

  child.on("close", (code) => {
    if (code !== 0) {
      console.error("yt-dlp version check exited with code:", code);
    }
  });
}

checkYtDlpVersion();

// ==========================================
// START DOWNLOAD
// ==========================================

function startDownload(url, filename, type, onProgress) {
  if (typeof url !== "string" || !url.trim()) {
    return Promise.reject(new Error("A valid media URL is required."));
  }

  if (!["video", "audio"].includes(type)) {
    return Promise.reject(new Error("Download type must be video or audio."));
  }

  if (!fs.existsSync(ytdlp)) {
    return Promise.reject(
      new Error("yt-dlp executable is missing. Check the Render build logs.")
    );
  }

  // Prevent path traversal through the supplied filename.
  const safeFilename = path.basename(String(filename || "download"))
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .trim() || "download";

  const outputTemplate = path.join(
    downloadsDir,
    `${safeFilename}.%(ext)s`
  );

  const args = [
    "--no-playlist",
    "--newline",
    "--js-runtimes",
    "node"
  ];

  if (type === "audio") {
    args.push(
      "--extract-audio",
      "--audio-format", "mp3",
      "--audio-quality", "192K"
    );
  } else {
    args.push(
      "--format", "bestvideo*+bestaudio/best"
    );
  }

  args.push(
    "--output", outputTemplate,
    "--print", "after_move:filepath",
    "--",
    url.trim()
  );

  console.log("Starting yt-dlp");
  console.log("URL:", url);
  console.log("TYPE:", type);

  const child = spawn(ytdlp, args, {
    cwd: backendDir,
    shell: false,
    windowsHide: true
  });

  let stdout = "";
  let stderr = "";
  let progressBuffer = "";
  let settled = false;

  const promise = new Promise((resolve, reject) => {
    function fail(error) {
      if (settled) return;
      settled = true;
      reject(error);
    }

    function processProgress(chunk) {
      progressBuffer += chunk;

      const lines = progressBuffer.split(/\r\n|\n|\r/);
      progressBuffer = lines.pop() || "";

      for (const line of lines) {
        const match = line.match(
          /\[download\]\s+(\d+(?:\.\d+)?)%/
        );

        if (match) {
          const percent = Number(match[1]);
          console.log(`Download progress: ${percent}%`);

          if (typeof onProgress === "function") {
            try {
              onProgress(percent);
            } catch (error) {
              console.error("Progress callback failed:", error.message);
            }
          }
        }
      }
    }

    child.stdout.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
      processProgress(text);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
      processProgress(text);
    });

    child.on("error", (error) => {
      fail(new Error(`Unable to start yt-dlp: ${error.message}`));
    });

    child.on("close", (code) => {
      if (settled) return;

      if (code !== 0) {
        fail(
          new Error(
            (stderr || stdout || `yt-dlp exited with code ${code}`).trim()
          )
        );
        return;
      }

      try {
        const matchingFiles = fs.readdirSync(downloadsDir)
          .filter((file) => file.startsWith(`${safeFilename}.`))
          .map((file) => ({
            filename: file,
            mtime: fs.statSync(path.join(downloadsDir, file)).mtimeMs
          }))
          .sort((a, b) => b.mtime - a.mtime);

        const finalFile = matchingFiles[0]?.filename || null;

        if (!finalFile) {
          fail(new Error("yt-dlp finished, but the downloaded file was not found."));
          return;
        }

        settled = true;

        if (typeof onProgress === "function") {
          try {
            onProgress(100);
          } catch (error) {
            console.error("Progress callback failed:", error.message);
          }
        }

        console.log("Download completed:", finalFile);
        resolve({ filename: finalFile });
      } catch (error) {
        fail(error);
      }
    });
  });

  promise.cancel = () => {
    if (child.pid && child.exitCode === null && !child.killed) {
      console.log("Stopping download...");
      child.kill("SIGTERM");
    }
  };

  return promise;
}

module.exports = {
  startDownload,
  downloadsDir
};
