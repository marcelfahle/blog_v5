/**
 * Copyright (c) 2020 Google Inc
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const exposed = {};
if (location.search) {
  var a = document.createElement("a");
  a.href = location.href;
  a.search = "";
  history.replaceState(null, null, a.href);
}

function tweet_(url) {
  open(
    "https://twitter.com/intent/tweet?url=" + encodeURIComponent(url),
    "_blank"
  );
}
function tweet(anchor) {
  tweet_(anchor.getAttribute("href"));
}
expose("tweet", tweet);

function share(anchor) {
  var url = anchor.getAttribute("href");
  event.preventDefault();
  if (navigator.share) {
    navigator.share({
      url: url,
    });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    message("Article URL copied to clipboard.");
  } else {
    tweet_(url);
  }
}
expose("share", share);

function message(msg) {
  var dialog = document.getElementById("message");
  dialog.textContent = msg;
  dialog.setAttribute("open", "");
  setTimeout(function() {
    dialog.removeAttribute("open");
  }, 3000);
}

function prefetch(e) {
  if (e.target.tagName != "A") {
    return;
  }
  if (e.target.origin != location.origin) {
    return;
  }
  /**
   * Return the given url with no fragment
   * @param {string} url potentially containing a fragment
   * @return {string} url without fragment
   */
  const removeUrlFragment = (url) => url.split("#")[0];
  if (
    removeUrlFragment(window.location.href) === removeUrlFragment(e.target.href)
  ) {
    return;
  }
  var l = document.createElement("link");
  l.rel = "prefetch";
  l.href = e.target.href;
  document.head.appendChild(l);
}
document.documentElement.addEventListener("mouseover", prefetch, {
  capture: true,
  passive: true,
});
document.documentElement.addEventListener("touchstart", prefetch, {
  capture: true,
  passive: true,
});

const GA_ID = document.documentElement.getAttribute("ga-id");
window.ga =
  window.ga ||
  function() {
    if (!GA_ID) {
      return;
    }
    (ga.q = ga.q || []).push(arguments);
  };
ga.l = +new Date();
ga("create", GA_ID, "auto");
ga("set", "transport", "beacon");
var timeout = setTimeout(
  (onload = function() {
    clearTimeout(timeout);
    ga("send", "pageview");
  }),
  1000
);

var ref = +new Date();
function ping(event) {
  var now = +new Date();
  if (now - ref < 1000) {
    return;
  }
  ga("send", {
    hitType: "event",
    eventCategory: "page",
    eventAction: event.type,
    eventLabel: Math.round((now - ref) / 1000),
  });
  ref = now;
}
addEventListener("pagehide", ping);
addEventListener("visibilitychange", ping);

/**
 * Injects a script into document.head
 * @param {string} src path of script to be injected in <head>
 * @return {Promise} Promise object that resolves on script load event
 */
const dynamicScriptInject = (src) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    document.head.appendChild(script);
    script.addEventListener("load", () => {
      resolve(script);
    });
  });
};

// Script web-vitals.js will be injected dynamically if user opts-in to sending CWV data.
const sendWebVitals = document.currentScript.getAttribute("data-cwv-src");

if (/web-vitals.js/.test(sendWebVitals)) {
  dynamicScriptInject(`${window.location.origin}/js/web-vitals.js`)
    .then(() => {
      webVitals.getCLS(sendToGoogleAnalytics);
      webVitals.getFID(sendToGoogleAnalytics);
      webVitals.getLCP(sendToGoogleAnalytics);
    })
    .catch((error) => {
      console.error(error);
    });
}

addEventListener(
  "click",
  function(e) {
    var button = e.target.closest("button");
    if (!button) {
      return;
    }
    ga("send", {
      hitType: "event",
      eventCategory: "button",
      eventAction: button.getAttribute("aria-label") || button.textContent,
    });
  },
  true
);
var selectionTimeout;
addEventListener(
  "selectionchange",
  function() {
    clearTimeout(selectionTimeout);
    var text = String(document.getSelection()).trim();
    if (text.split(/[\s\n\r]+/).length < 3) {
      return;
    }
    selectionTimeout = setTimeout(function() {
      ga("send", {
        hitType: "event",
        eventCategory: "selection",
        eventAction: text,
      });
    }, 2000);
  },
  true
);

// if (window.ResizeObserver && document.querySelector("header nav #nav")) {
//   var progress = document.getElementById("reading-progress");

//   var timeOfLastScroll = 0;
//   var requestedAniFrame = false;
//   function scroll() {
//     if (!requestedAniFrame) {
//       requestAnimationFrame(updateProgress);
//       requestedAniFrame = true;
//     }
//     timeOfLastScroll = Date.now();
//   }
//   addEventListener("scroll", scroll);

//   var winHeight = 1000;
//   var bottom = 10000;
//   function updateProgress() {
//     requestedAniFrame = false;
//     var percent = Math.min(
//       (document.scrollingElement.scrollTop / (bottom - winHeight)) * 100,
//       100
//     );
//     progress.style.transform = `translate(-${100 - percent}vw, 0)`;
//     if (Date.now() - timeOfLastScroll < 3000) {
//       requestAnimationFrame(updateProgress);
//       requestedAniFrame = true;
//     }
//   }

//   new ResizeObserver(() => {
//     bottom =
//       document.scrollingElement.scrollTop +
//       document.querySelector("#comments,footer").getBoundingClientRect().top;
//     winHeight = window.innerHeight;
//     scroll();
//   }).observe(document.body);
// }

function expose(name, fn) {
  exposed[name] = fn;
}

addEventListener("click", (e) => {
  const handler = e.target.closest("[on-click]");
  if (!handler) {
    return;
  }
  e.preventDefault();
  const name = handler.getAttribute("on-click");
  const fn = exposed[name];
  if (!fn) {
    throw new Error("Unknown handler" + name);
  }
  fn(handler);
});

function removeBlurredImage(img) {
  // Ensure the browser doesn't try to draw the placeholder when the real image is present.
  img.style.backgroundImage = "none";
}
document.body.addEventListener(
  "load",
  (e) => {
    if (e.target.tagName != "IMG") {
      return;
    }
    removeBlurredImage(e.target);
  },
  /* capture */ "true"
);
for (let img of document.querySelectorAll("img")) {
  if (img.complete) {
    removeBlurredImage(img);
  }
}

const mobileMenu = document.getElementById("mobile-nav");
const menuToggle = document.getElementsByClassName("mobile-nav-toggle")[0];
menuToggle.addEventListener("click", () => {
  mobileMenu.classList.toggle("hidden");
});

// Subscribe form handling - supports multiple forms on page
document.querySelectorAll(".subscribe-form").forEach((form) => {
  const container = form.closest(".subscribe-container, .subscribe-section, [class*='mt-8']") || form.parentElement;
  const emailInput = form.querySelector('input[name="email"]');
  const button = form.querySelector("button[type='submit']");
  const buttonText = button.querySelector(".button-text");
  const buttonLoading = button.querySelector(".button-loading");
  
  // Find siblings - error and success elements are siblings of the form
  const findSibling = (selector) => {
    let el = form.nextElementSibling;
    while (el) {
      if (el.matches(selector)) return el;
      el = el.nextElementSibling;
    }
    return container.querySelector(selector);
  };
  
  const errorEl = findSibling(".subscribe-error");
  const successEl = findSibling(".subscribe-success");

  async function handleSubmit(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = "Please enter a valid email address";
      errorEl.classList.remove("hidden");
      emailInput.focus();
      return;
    }

    errorEl.classList.add("hidden");
    buttonText.classList.add("hidden");
    buttonLoading.classList.remove("hidden");
    button.disabled = true;
    emailInput.disabled = true;

    try {
      const response = await fetch("/.netlify/functions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        form.classList.add("hidden");
        successEl.classList.remove("hidden");
      } else {
        errorEl.textContent = data.error || "Something went wrong. Please try again.";
        errorEl.classList.remove("hidden");
        emailInput.focus();
      }
    } catch {
      errorEl.textContent = "Network error. Please try again.";
      errorEl.classList.remove("hidden");
      emailInput.focus();
    } finally {
      buttonText.classList.remove("hidden");
      buttonLoading.classList.add("hidden");
      button.disabled = false;
      emailInput.disabled = false;
    }
  }

  form.addEventListener("submit", handleSubmit);

  // Submit on Enter key (already works with form submit, but ensure consistent behavior)
  emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.requestSubmit();
    }
  });
});
