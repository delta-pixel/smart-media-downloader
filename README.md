# 🎬 Smart Media Downloader

A simple web-based media downloader built with **Node.js, Express,
JavaScript, HTML, and CSS**.

The project uses **yt-dlp** in the backend to download media and
supports:

-   🎬 Video downloading
-   🎵 Audio extraction as MP3
-   📊 Live download progress
-   🛑 Stop/cancel download
-   🚫 Preventing a second download while one is already running
-   ✅ Automatic download when the file is ready
-   💻 Windows PowerShell setup and commands

## 📁 Project Structure

``` text
smart-media-downloader/
│
├── backend/
│   ├── downloads/
│   ├── node_modules/
│   ├── routes/
│   │   └── download.js
│   ├── utils/
│   │   └── downloader.js
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
└── frontend/
    ├── index.html
    ├── app.js
    └── styles.css
```

## ⚙️ How the Project Works

The frontend provides a URL box and buttons for video and audio
downloads.

When the user clicks a download button:

1.  The frontend sends the URL and download type to the backend.
2.  Express receives the request through `/api/download`.
3.  The backend starts `yt-dlp`.
4.  `yt-dlp` downloads the media.
5.  The backend reads the download progress and stores the current
    percentage.
6.  The frontend checks `/api/progress/:id` every second.
7.  The progress bar and percentage are updated on the webpage.
8.  When the download reaches 100%, the finished file is downloaded by
    the browser.

The backend also keeps track of an active download, so another download
can be rejected while one is already running.

## 🎵 Audio Download

For audio mode, the backend uses yt-dlp audio extraction and converts
the result to MP3.

FFmpeg is required for audio extraction and for merging separate
video/audio streams.

## 🛑 Stop Download

The project can stop the active yt-dlp process. On Windows, the backend
uses the `taskkill` command to terminate the process tree.

## 📊 Live Progress

The downloader reads yt-dlp progress messages such as:

``` text
[download] 10.2%
[download] 25.7%
[download] 50.4%
[download] 78.9%
[download] 100%
```

These values are sent to the frontend so the progress bar can move from
0% to 100%.

## 💻 Requirements

Install these before running the project:

-   **Node.js**
-   **FFmpeg**
-   A modern web browser
-   Internet connection

`yt-dlp` is used by the Node.js backend through the project dependency.

## 🚀 Run the Project on Windows PowerShell

### 1. Open PowerShell

Open the project folder in VS Code.

Then open the VS Code terminal and make sure PowerShell is selected.

### 2. Go to the backend

From the project root:

``` powershell
cd backend
```

### 3. Install Node.js dependencies

Run:

``` powershell
npm install
```

This installs the packages required by the backend.

### 4. Install FFmpeg

If FFmpeg is not installed, PowerShell can install it with:

``` powershell
winget install Gyan.FFmpeg
```

After installation, close and reopen PowerShell or VS Code.

Check that FFmpeg is available:

``` powershell
ffmpeg -version
```

Also check:

``` powershell
ffprobe -version
```

If both commands show version information, FFmpeg is ready.

### 5. Start the backend server

Inside the `backend` folder run:

``` powershell
node server.js
```

You should see:

``` text
🚀 Server running at http://localhost:3000
```

### 6. Open the website

Open your browser and visit:

``` text
http://localhost:3000
```

The Smart Media Downloader interface should appear.

## ▶️ Basic Usage

### Download a video

1.  Open the website.
2.  Paste a supported video URL.
3.  Click **Download Video**.
4.  Watch the progress bar.
5.  Wait until it reaches **100%**.
6.  The finished file will be downloaded.

### Extract audio

1.  Paste the video URL.
2.  Click **Extract Audio**.
3.  The backend extracts the audio.
4.  FFmpeg converts it to MP3.
5.  The MP3 file is downloaded when complete.

### Stop a download

1.  Start a download.
2.  Click **Stop Download**.
3.  The backend stops the active yt-dlp process.
4.  The webpage changes to the stopped state.

### Start another download

If a download is already running and the user presses a download button
again, the project responds with an **Already Downloading** message
instead of starting another download.

## 🛠️ Useful PowerShell Commands

### Go to the project

``` powershell
cd "C:\Users\YourName\Desktop\smart-media-downloader"
```

### Go to backend

``` powershell
cd backend
```

### Install dependencies

``` powershell
npm install
```

### Start server

``` powershell
node server.js
```

### Stop server

Press:

``` text
Ctrl + C
```

### Check Node.js

``` powershell
node -v
```

### Check npm

``` powershell
npm -v
```

### Check FFmpeg

``` powershell
ffmpeg -version
```

### Check FFprobe

``` powershell
ffprobe -version
```

### Find FFmpeg

``` powershell
where.exe ffmpeg
```

## 🐛 Troubleshooting

### `Cannot GET /`

Make sure you are opening:

``` text
http://localhost:3000
```

and that the backend server is running.

If the backend only exposes the API and does not serve the frontend in
your current version, open the frontend separately using your configured
frontend method.

### `ffmpeg and ffprobe not found`

Install FFmpeg:

``` powershell
winget install Gyan.FFmpeg
```

Then restart PowerShell/VS Code and verify:

``` powershell
ffmpeg -version
ffprobe -version
```

### `Requested format is not available`

This can happen when yt-dlp cannot find the requested format for a
particular video. The project should use a flexible format selection
rather than requiring one exact format.

### Progress stays at 0%

Check that:

-   The backend is running.
-   The frontend is calling `/api/progress/:id`.
-   The downloader is parsing yt-dlp progress output.
-   yt-dlp is actually producing download progress.
-   The correct `downloader.js` is being used.

### Multiple downloads start

Make sure the current frontend and backend contain the active-download
protection. The backend tracks an active download and returns an
`ALREADY_DOWNLOADING` response when another download is attempted.

## 🔄 Restarting After Code Changes

Whenever you change backend JavaScript files:

1.  Stop the server with `Ctrl + C`.
2.  Start it again:

``` powershell
node server.js
```

If you change only frontend HTML/CSS/JavaScript, refresh the browser. A
hard refresh can be used with:

``` text
Ctrl + Shift + R
```

## 🔐 Notes

-   Use the downloader only for media you are allowed to download.
-   Respect the terms and copyright rules of the website and content
    owner.
-   Do not use the application to bypass access controls or download
    content without permission.

## 👨‍💻 Technologies Used

-   **Node.js** --- backend runtime
-   **Express.js** --- web server and API
-   **JavaScript** --- frontend and backend logic
-   **HTML5** --- webpage structure
-   **CSS3** --- user interface
-   **yt-dlp** --- media downloading
-   **FFmpeg** --- audio extraction and media processing

## ⭐ Project Flow

``` text
User
  │
  ▼
Frontend
  │
  │ POST /api/download
  ▼
Express Backend
  │
  ▼
yt-dlp
  │
  ├── Video ───────► Download
  │
  └── Audio ───────► FFmpeg ───────► MP3
  │
  ▼
Progress Tracking
  │
  ▼
Frontend Progress Bar
  │
  ▼
100% Complete
  │
  ▼
Browser Downloads File
```

## 📌 Quick Start

For most Windows users:

``` powershell
cd "C:\Users\YourName\Desktop\smart-media-downloader\backend"
npm install
winget install Gyan.FFmpeg
node server.js
```

Then open:

``` text
http://localhost:3000
```

------------------------------------------------------------------------

**Smart Media Downloader**\
Built with Node.js, Express, yt-dlp, and FFmpeg.
