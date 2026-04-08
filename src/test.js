// app.js — hosted on YOUR cdn, loaded via <script src="...">

let incode;
let session;
let container = document.getElementById("incode-container");

function notifyCompletion(data) {
  const event = new CustomEvent("incodeCompleted", {
    detail: data,
  });

  window.dispatchEvent(event);
}

function waitForIncode(retries = 50) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (window.OnBoarding) {
        clearInterval(interval);
        resolve(window.OnBoarding);
      } else if (retries-- <= 0) {
        clearInterval(interval);
        reject(new Error('Incode SDK not loaded'));
      }
    }, 100);
  });
}

async function init() {
  // 1. Get session token from YOUR backend (keeps API key off the browser)
  //   const res = await fetch(
  //     "https://testint-744443929525.northamerica-south1.run.app/create-session",
  //     {
  //       method: "POST",
  //     }
  //   );
  //   session = await res.json();
  // { token: "..." }
  session = { token: document.getElementById("incode-config").value };
  console.log(session);

  const OnBoarding = await waitForIncode();


  // 2. Initialize the Incode SDK (loaded globally by the CDN script tag)
  incode = await OnBoarding.create({
    apiURL: "https://demo-api.incodesmile.com/0",
    // NO apiKey here — that stays on your backend
  });

  await sendGeo();
}

async function sendGeo() {
  // 3. Geolocation — SDK calls browser GPS + sends to Omni API directly
  await incode.sendFingerprint({ token: session.token }).catch(console.error);
  await incode.sendGeolocation({ token: session.token }).catch(console.error);
  renderID();
}

function renderID() {
  // 4. ID capture — SDK opens camera UI inside the container div
  incode.renderCaptureId(container, {
    session: session,
    onSuccess: renderFace,
    onError: console.error,
  });
}

function renderFace() {
  // 5. Face capture — selfie + liveness, same pattern
  incode.renderCaptureFace(container, {
    session: session,
    onSuccess: doFaceMatch,
    onError: console.error,
  });
}

async function doFaceMatch() {
  // 6. processFace triggers face match (selfie vs ID photo) on Omni API
  await incode.processFace({ token: session.token });
  await incode.processId({ token: session.token });
  // 7. Tell YOUR backend the session is done — retrieve scores server-side
  notifyCompletion({
    token: session.token,
    status: "completed",
  });
}

function waitForContainer() {
  const el = document.getElementById("incode-container");

  if (el) {
    init();
  } else {
    setTimeout(waitForContainer, 100);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", waitForContainer);
} else {
  waitForContainer();
}

// const allowedOrigin = 'https://coreqa.kosmos.la/';
//     const origin = req.get('origin');

//     if (origin !== allowedOrigin) {
//       return res.status(403).json({ error: 'Forbidden' });
//     }
