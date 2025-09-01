// Returns the current org's session id (sid) cookie for the page's origin.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "GET_SID") {
    const url = msg.url;
    // Try to get the cookie for this exact origin first.
    chrome.cookies.get({ url, name: "sid" }, (cookie) => {
      if (cookie && cookie.value) {
        sendResponse({ sid: cookie.value });
      } else {
        // Try common Salesforce host variations just in case.
        const u = new URL(url);
        const candidates = [
          `https://${u.hostname}/`,
          `https://${u.hostname.replace(".lightning.force.com", ".my.salesforce.com")}/`,
          `https://${u.hostname.replace(".my.salesforce.com", ".lightning.force.com")}/`
        ];
        let resolved = false;
        let remaining = candidates.length;
        for (const c of candidates) {
          chrome.cookies.get({ url: c, name: "sid" }, (ck) => {
            if (!resolved && ck && ck.value) {
              resolved = true;
              sendResponse({ sid: ck.value });
            }
            if (--remaining === 0 && !resolved) {
              sendResponse({ sid: null });
            }
          });
        }
      }
    });
    return true; // async response
  }
});
