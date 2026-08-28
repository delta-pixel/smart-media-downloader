let currentDownloadId = null;
let progressInterval = null;
let isDownloading = false;


// ========================================
// ELEMENTS
// ========================================

const urlInput =
  document.getElementById("url");

const downloadBtn =
  document.getElementById("downloadBtn");

const audioBtn =
  document.getElementById("audioBtn");

const stopBtn =
  document.getElementById("stopBtn");

const bar =
  document.getElementById("bar");

const status =
  document.getElementById("status");

const progressText =
  document.getElementById("progressText");


// ========================================
// VIDEO DOWNLOAD
// ========================================

async function startDownload() {

  if (isDownloading) {
    showPopup(
      "⚠️ Download Already Running",
      "A download is already in progress. Please wait until it finishes."
    );

    return;
  }


  const url =
    urlInput.value.trim();


  if (!url) {
    showPopup(
      "⚠️ URL Required",
      "Please paste a video URL first."
    );

    return;
  }


  await beginDownload(
    url,
    "video"
  );
}


// ========================================
// AUDIO DOWNLOAD
// ========================================

async function startAudioDownload() {

  if (isDownloading) {
    showPopup(
      "⚠️ Download Already Running",
      "A download is already in progress. Please wait until it finishes."
    );

    return;
  }


  const url =
    urlInput.value.trim();


  if (!url) {
    showPopup(
      "⚠️ URL Required",
      "Please paste a video URL first."
    );

    return;
  }


  await beginDownload(
    url,
    "audio"
  );
}


// ========================================
// BEGIN DOWNLOAD
// ========================================

async function beginDownload(
  url,
  type
) {

  isDownloading = true;

  currentDownloadId = null;


  setDownloadingUI(type);


  try {

    const response =
      await fetch(
        "/api/download",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            url,
            type
          })
        }
      );


    const data =
      await response.json();


    // Another download already running
    if (response.status === 409) {

      isDownloading = false;

      resetUI();

      showPopup(
        "⚠️ Already Downloading",
        "Something is already downloading. Please wait for it to finish."
      );

      return;
    }


    if (!response.ok) {
      throw new Error(
        data.error ||
        "Unable to start download."
      );
    }


    currentDownloadId =
      data.id;


    trackProgress(
      currentDownloadId
    );

  } catch (error) {

    console.error(error);

    isDownloading = false;

    resetUI();

    showPopup(
      "❌ Download Error",
      error.message
    );
  }
}


// ========================================
// TRACK PROGRESS
// ========================================

function trackProgress(id) {

  if (progressInterval) {
    clearInterval(
      progressInterval
    );
  }


  progressInterval =
    setInterval(
      async () => {

        try {

          const response =
            await fetch(
              `/api/progress/${id}`
            );


          const data =
            await response.json();


          const progress =
            Number(data.progress) || 0;


          bar.style.width =
            `${progress}%`;


          progressText.innerText =
            `${Math.round(progress)}%`;


          if (
            data.status ===
            "downloading"
          ) {

            status.innerText =
              "⬇️ Downloading...";
          }


          if (
            data.status ===
            "completed"
          ) {

            clearInterval(
              progressInterval
            );

            progressInterval =
              null;


            bar.style.width =
              "100%";


            progressText.innerText =
              "100%";


            status.innerText =
              "✅ Download Complete";


            isDownloading =
              false;


            stopBtn.style.display =
              "none";


            downloadBtn.disabled =
              false;

            audioBtn.disabled =
              false;


            // Download file automatically
            if (data.filename) {

              const link =
                document.createElement(
                  "a"
                );

              link.href =
                `/api/file/${encodeURIComponent(
                  data.filename
                )}`;

              link.download =
                data.filename;

              document.body.appendChild(
                link
              );

              link.click();

              link.remove();
            }


            setTimeout(
              resetUI,
              3000
            );
          }


          if (
            data.status ===
            "cancelled"
          ) {

            clearInterval(
              progressInterval
            );

            progressInterval =
              null;


            isDownloading =
              false;


            status.innerText =
              "⛔ Download Stopped";


            resetButtons();
          }


          if (
            data.status ===
            "error"
          ) {

            clearInterval(
              progressInterval
            );

            progressInterval =
              null;


            isDownloading =
              false;


            status.innerText =
              "❌ Download Failed";


            showPopup(
              "❌ Download Failed",
              data.error ||
              "Something went wrong."
            );


            resetButtons();
          }

        } catch (error) {

          console.error(
            "Progress error:",
            error
          );

        }

      },
      1000
    );
}


// ========================================
// STOP DOWNLOAD
// ========================================

async function stopDownload() {

  if (!currentDownloadId) {
    return;
  }


  try {

    stopBtn.disabled =
      true;


    status.innerText =
      "⛔ Stopping...";


    await fetch(
      `/api/stop/${currentDownloadId}`,
      {
        method: "POST"
      }
    );

  } catch (error) {

    console.error(error);

    stopBtn.disabled =
      false;
  }
}


// ========================================
// UI
// ========================================

function setDownloadingUI(type) {

  downloadBtn.disabled =
    true;

  audioBtn.disabled =
    true;

  stopBtn.style.display =
    "inline-flex";

  stopBtn.disabled =
    false;


  bar.style.width =
    "0%";

  progressText.innerText =
    "0%";


  status.innerText =
    type === "audio"
      ? "🎵 Extracting audio..."
      : "⬇️ Downloading...";
}


function resetButtons() {

  downloadBtn.disabled =
    false;

  audioBtn.disabled =
    false;

  stopBtn.disabled =
    true;

  stopBtn.style.display =
    "none";
}


function resetUI() {

  isDownloading =
    false;

  currentDownloadId =
    null;


  resetButtons();

  bar.style.width =
    "0%";

  progressText.innerText =
    "0%";
}


// ========================================
// POPUP
// ========================================

function showPopup(
  title,
  message
) {

  const oldPopup =
    document.getElementById(
      "downloadPopup"
    );


  if (oldPopup) {
    oldPopup.remove();
  }


  const popup =
    document.createElement(
      "div"
    );


  popup.id =
    "downloadPopup";


  popup.innerHTML = `
    <div class="popup-box">
      <div class="popup-icon">⚠️</div>

      <h2>${title}</h2>

      <p>${message}</p>

      <button onclick="closePopup()">
        OK
      </button>
    </div>
  `;


  document.body.appendChild(
    popup
  );
}


function closePopup() {

  const popup =
    document.getElementById(
      "downloadPopup"
    );

  if (popup) {
    popup.remove();
  }
}