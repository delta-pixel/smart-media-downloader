const express = require("express");
const router = express.Router();

const {
  startDownload,
  downloadsDir
} = require("../utils/downloader");

const fs = require("fs");
const path = require("path");


// Active downloads
const downloads = new Map();

let activeDownloadId = null;


// ==========================================
// START DOWNLOAD
// ==========================================

router.post("/download", async (req, res) => {

  const {
    url,
    type = "video"
  } = req.body;


  if (!url) {
    return res.status(400).json({
      error: "Please enter a URL."
    });
  }


  // Prevent second download
  if (activeDownloadId) {

    const active =
      downloads.get(
        activeDownloadId
      );


    if (
      active &&
      active.status === "downloading"
    ) {

      return res.status(409).json({

        error:
          "ALREADY_DOWNLOADING",

        message:
          "A download is already running. Please wait until it finishes."

      });
    }


    activeDownloadId = null;
  }


  const id =
    Date.now().toString();


  const filename =
    `media-${id}`;


  downloads.set(id, {

    id,

    url,

    type,

    progress: 0,

    status: "downloading",

    filename: null,

    process: null

  });


  activeDownloadId =
    id;


  // Tell frontend immediately
  res.json({

    id,

    status:
      "started"

  });


  try {

    const downloadProcess =
      startDownload(

        url,

        filename,

        type,

        (progress) => {

          const download =
            downloads.get(id);


          if (download) {

            download.progress =
              progress;

          }

        }

      );


    // Save process so STOP can kill it
    const download =
      downloads.get(id);


    if (download) {

      download.process =
        downloadProcess;

    }


    const result =
      await downloadProcess;


    const finished =
      downloads.get(id);


    if (finished) {

      finished.progress =
        100;

      finished.status =
        "completed";

      finished.filename =
        result.filename;

    }


    if (
      activeDownloadId === id
    ) {

      activeDownloadId =
        null;

    }


    console.log(
      "✅ Download completed:",
      result.filename
    );


  } catch (error) {

    const download =
      downloads.get(id);


    if (download) {

      if (
        error.message ===
        "DOWNLOAD_CANCELLED"
      ) {

        download.status =
          "cancelled";

      } else {

        download.status =
          "error";

        download.error =
          error.message;

      }

    }


    if (
      activeDownloadId === id
    ) {

      activeDownloadId =
        null;

    }


    console.log(
      "❌ Download error:",
      error.message
    );

  }

});


// ==========================================
// PROGRESS
// ==========================================

router.get(
  "/progress/:id",
  (req, res) => {

    const download =
      downloads.get(
        req.params.id
      );


    if (!download) {

      return res.status(404).json({

        error:
          "Download not found."

      });

    }


    res.json({

      id:
        download.id,

      progress:
        download.progress,

      status:
        download.status,

      filename:
        download.filename,

      error:
        download.error || null

    });

  }
);


// ==========================================
// STOP
// ==========================================

router.post(
  "/stop/:id",
  (req, res) => {

    const id =
      req.params.id;


    const download =
      downloads.get(id);


    if (!download) {

      return res.status(404).json({

        error:
          "Download not found."

      });

    }


    if (
      download.status !==
      "downloading"
    ) {

      return res.json({

        message:
          "Download is not running."

      });

    }


    console.log(
      "⛔ Stopping:",
      id
    );


    if (
      download.process &&
      typeof download.process.cancel ===
        "function"
    ) {

      download.process.cancel();

    }


    download.status =
      "cancelled";


    if (
      activeDownloadId === id
    ) {

      activeDownloadId =
        null;

    }


    // Delete partial files
    try {

      const files =
        fs.readdirSync(
          downloadsDir
        );


      for (
        const file of files
      ) {

        if (
          file.includes(id)
        ) {

          fs.unlinkSync(
            path.join(
              downloadsDir,
              file
            )
          );

        }

      }

    } catch (error) {

      console.log(
        "File cleanup error:",
        error.message
      );

    }


    res.json({

      success:
        true,

      message:
        "Download stopped."

    });

  }
);


// ==========================================
// SERVE DOWNLOADED FILE
// ==========================================

router.get(
  "/file/:filename",
  (req, res) => {

    const filename =
      path.basename(
        req.params.filename
      );


    const filePath =
      path.join(
        downloadsDir,
        filename
      );


    if (
      !fs.existsSync(
        filePath
      )
    ) {

      return res
        .status(404)
        .send(
          "File not found"
        );

    }


    res.download(
      filePath
    );

  }
);


module.exports =
  router;