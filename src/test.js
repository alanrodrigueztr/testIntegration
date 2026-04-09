// app.js — hosted on YOUR cdn, loaded via <script src="...">

let incode;
let session;
let container = document.getElementById("incode-container");


const UiConfig = {
    branding: {
        logo: { src: 'https://bancrea.com/wp-content/uploads/2024/03/logo-bancrea-1.png', height: '50px' },
        hideFooterBranding: true,
    },
    
  };



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
        reject(new Error("Incode SDK not loaded"));
      }
    }, 100);
  });
}

async function init() {
  session = { token: document.getElementById("incode-config").value };
  console.log(session);

  const OnBoarding = await waitForIncode();

  incode = await OnBoarding.create({
    apiURL: "https://demo-api.incodesmile.com/0",
  });

  await sendGeo();
}

async function sendGeo() {
  await incode.sendFingerprint({ token: session.token }).catch(console.error);
  await incode.sendGeolocation({ token: session.token }).catch(console.error);
  renderID();
}

function renderID() {
  incode.renderCaptureId(container, {
    session: session,
    onSuccess: renderFace,
    onError: console.error,
    forceIdV2: true,
	  uiConfig: UiConfig,
  });
}

function renderFace() {
  incode.renderCaptureFace(container, {
    session: session,
    onSuccess: doFaceMatch,
    onError: console.error,
  });
}

async function doFaceMatch() {
  await incode.processFace({ token: session.token });
  await incode.processId({ token: session.token });

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

