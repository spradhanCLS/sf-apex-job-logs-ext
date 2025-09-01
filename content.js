(() => {
  const API_VERSION = "62.0";

  // ---------------- helpers ----------------

  function getOrigin() {
    return window.location.origin;
  }

  function isoToLocal(iso) {
    if (!iso) return "";
    const dt = new Date(iso);
    if (Number.isNaN(+dt)) return iso;
    return dt.toLocaleString();
  }

  function formatBytes(n) {
    if (n == null) return "";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Find the jobs table by looking for a header cell that says "Apex Job ID"
  function findJobsTable() {
    const candidates = Array.from(
      document.querySelectorAll("table.list, table")
    );
    for (const table of candidates) {
      const headerRow = table.querySelector("tr.headerRow");
      if (!headerRow) continue;
      const headers = Array.from(headerRow.querySelectorAll("th"));
      if (!headers.length) continue;
      const headerTexts = headers.map((h) =>
        (h.textContent || "").replace(/\s+/g, " ").trim()
      );
      const jobIdIdx = headerTexts.findIndex((t) => /Apex\s*Job\s*ID/i.test(t));
      if (jobIdIdx !== -1) {
        return { table, headerRow, headers, jobIdIdx };
      }
    }
    return null;
  }

  // Ensure a "Logs" column exists at the end of the header row.
  function ensureLogsHeader(headerRow) {
    const existing = Array.from(headerRow.querySelectorAll("th")).some(
      (h) => (h.textContent || "").trim().toLowerCase() === "logs"
    );
    if (existing) return;
    const th = document.createElement("th");
    th.textContent = "Logs";
    th.className = "dataCell";
    th.style.whiteSpace = "nowrap";
    headerRow.appendChild(th); // append instead of insertBefore to avoid DOMException
  }

  // Only return real data rows
  function getDataRows(table) {
    const tbodies = table.tBodies ? Array.from(table.tBodies) : [];
    let rows = [];
    if (tbodies.length) {
      for (const tb of tbodies)
        rows.push(...Array.from(tb.querySelectorAll("tr.dataRow")));
    } else {
      rows = Array.from(table.querySelectorAll("tr.dataRow")).slice(1);
    }
    // Keep rows that have at least one <td> – ignore header/footer rows.
    return rows.filter((r) => r.querySelector("td"));
  }

  // ----------------- Tooling API -----------------

  // Fallback session fetcher (used only when cookie-based call fails)
  function getSid() {
    return new Promise((resolve) => {
      if (!chrome?.runtime?.sendMessage) return resolve(null);
      chrome.runtime.sendMessage(
        { type: "GET_SID", url: getOrigin() },
        (resp) => {
          resolve(resp?.sid || null);
        }
      );
    });
  }

  async function toolingQuery(soql) {
    const url = `${getOrigin()}/services/data/v${API_VERSION}/tooling/query?q=${encodeURIComponent(
      soql
    )}`;

    // Try with cookies first (same-origin).
    let res = await fetch(url, { method: "GET", credentials: "same-origin" });
    if (res.status === 401 || res.status === 403) {
      // Some orgs require Bearer token; try again using the session id from cookies.
      const sid = await getSid();
      if (sid) {
        res = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${sid}` },
        });
      }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Query failed (${res.status}): ${text || res.statusText}`
      );
    }
    const data = await res.json();
    return data?.records || [];
  }

  async function fetchApexLogs(jobId) {
    const jobSoql =
      `SELECT Id, ApexClass.Name, CreatedDate, CompletedDate, Status, JobType, CreatedById 
        FROM AsyncApexJob 
        WHERE Id = '${jobId}'`
        .replace(/\s+/g, " ")
        .trim();

    const jobData = await toolingQuery(jobSoql);
    const soql = `
        SELECT Id, StartTime, LogUserId, Operation, Status, LogLength, Request 
        FROM ApexLog 
        WHERE LogUserId = '${jobData[0].CreatedById}' AND StartTime >= ${jobData[0].CreatedDate} AND StartTime <= ${jobData[0].CompletedDate} ORDER BY StartTime`
      .replace(/\s+/g, " ")
      .trim();

    return toolingQuery(soql);
  }

  function toMyDomain(origin) {
    try {
      const u = new URL(origin);
      // If we’re on lightning.force.com, point to my.salesforce.com
      u.hostname = u.hostname.replace(
        "lightning.force.com",
        "my.salesforce.com"
      );
      return u.origin;
    } catch {
      return origin;
    }
  }

  async function buildDownloadHref(rec) {
    // Prefer the official REST endpoint (needs Authorization header)
    const sid = await getSid();
    if (sid) {
      const restUrl = `${getOrigin()}/services/data/v${API_VERSION}/tooling/sobjects/ApexLog/${
        rec.Id
      }/Body`;
      const res = await fetch(restUrl, {
        headers: { Authorization: `Bearer ${sid}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        return URL.createObjectURL(blob); // blob://… works on any host
      }
    }
    // Fallback to the console route on *.my.salesforce.com
    const myBase = toMyDomain(getOrigin());
    return `${myBase}/_ui/system/api/console/apexLogDownload.apexp?id=${rec.Id}`;
  }

  function renderLinks(container, logs) {
    container.innerHTML = "";
    if (!logs.length) {
      container.textContent = "No logs found";
      return;
    }
    const list = document.createElement("div");
    list.style.display = "flex";
    list.style.flexDirection = "column";
    list.style.gap = "4px";

    logs.forEach(async (rec, i) => {
      if (!rec.LogLength) return; // skip empty logs to avoid dead links

      const a = document.createElement("a");
      //   a.textContent =
      //     i === 0
      //       ? `Latest – ${isoToLocal(rec.StartTime)} (${formatBytes(
      //           rec.LogLength
      //         )})`
      //       : `${isoToLocal(rec.StartTime)} • ${
      //           rec.Operation || "Apex"
      //         } (${formatBytes(rec.LogLength)})`;

      a.textContent = `${rec.Operation || "Apex"} (${formatBytes(
        rec.LogLength
      )})`;

      try {
        a.href = await buildDownloadHref(rec);
      } catch {
        // As a last resort, still try the console route
        const myBase = toMyDomain(getOrigin());
        a.href = `${myBase}/_ui/system/api/console/apexLogDownload.apexp?id=${rec.Id}`;
      }

      a.target = "_blank";
      a.rel = "noopener";
      list.appendChild(a);
    });

    container.appendChild(list);
  }

  function makeFetchButton(jobId, container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sflogs-btn";
    btn.textContent = "Fetch logs";
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Loading…";
      try {
        const logs = await fetchApexLogs(jobId);
        renderLinks(container, logs);
      } catch (e) {
        container.textContent = e?.message || "Error fetching logs";
        console.error(e);
      } finally {
        btn.remove();
      }
    });
    return btn;
  }

  function ensureRowEnhanced(row, jobIdIdx) {
    if (row.dataset.sfLogsBound === "1") return;

    // Determine which cell contains the job id
    const cells = Array.from(row.querySelectorAll("td"));
    if (!cells.length) return;

    let jobIdCell = null;
    if (jobIdIdx != null && jobIdIdx < row.children.length) {
      jobIdCell = row.children[jobIdIdx];
    }

    let jobId = (jobIdCell?.textContent || "").trim();
    if (!/^707[a-zA-Z0-9]{12,}/.test(jobId)) {
      // Fallback: try to find a 707… id anywhere in the row (sometimes the job id is inside <a>)
      const m = (row.textContent || "").match(/707[a-zA-Z0-9]{12,18}/);
      jobId = m ? m[0] : "";
    }

    // Create/locate the "Logs" cell at the end of the row.
    let logsCell = document.createElement("td");
    row.appendChild(logsCell);

    if (!/^707[a-zA-Z0-9]{12,}/.test(jobId)) {
      logsCell.textContent = "—";
      row.dataset.sfLogsBound = "1";
      return;
    }

    const container = document.createElement("div");
    container.className = "sflogs-container";
    const btn = makeFetchButton(jobId, container);
    container.appendChild(btn);
    logsCell.appendChild(container);

    row.dataset.sfLogsBound = "1";
  }

  function enhance() {
    const info = findJobsTable();
    if (!info) return;
    const { table, headerRow, jobIdIdx } = info;

    try {
      ensureLogsHeader(headerRow);
    } catch (e) {
      console.error("Header enhance error:", e);
    }

    const rows = getDataRows(table);
    for (const row of rows) {
      try {
        ensureRowEnhanced(row, jobIdIdx);
      } catch (e) {
        console.error("Row enhance error:", e);
      }
    }
  }

  // run immediately, and re-run on DOM changes (pagination, filters, etc.)
  const run = () => {
    try {
      enhance();
    } catch (e) {
      console.error(e);
    }
  };
  run();

  const obs = new MutationObserver(() => run());
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
