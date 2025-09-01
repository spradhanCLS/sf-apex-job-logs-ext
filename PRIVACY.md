
---

# Privacy Policy — Salesforce Apex Job Logs Helper

**Effective date:** 2nd September 2025
**Owner/Publisher:** Shouvik Pradhan
**Contact:** skilldives@gmail.com

## 1) Overview

Salesforce Apex Job Logs Helper (“the **Extension**”) augments the Salesforce **Apex Jobs** page by adding a Logs column and retrieving the related **ApexLog** body via Salesforce’s Tooling API. We designed it to operate **locally in your browser**, process the minimum data needed, and avoid sending data anywhere outside of Salesforce.

This policy explains what the Extension processes, why, and how you can control it. We comply with the **Chrome Web Store User Data Policy** and principles of data minimization and purpose limitation.

---

## 2) Scope

This policy applies only to the Extension. It does not apply to Salesforce’s own products/services or to any websites you visit.

---

## 3) What the Extension Processes

### A. Salesforce session cookie (`sid`)

* **What:** The `sid` cookie set by Salesforce on Salesforce domains.
* **Why:** Used **in memory only** to authorize same-origin Tooling API calls (e.g., query ApexLog records and retrieve log bodies).
* **Where:** Processed **entirely in your browser**; **not** persisted to disk by the Extension and **not** sent to third parties.
* **Retention:** Ephemeral (lives only for the duration of the page/operation).
* **Control:** Revoke by logging out of Salesforce or clearing cookies; disable the Extension on Salesforce domains if desired.

### B. Optional local preferences (Chrome storage)

* **What:** Non-sensitive UI settings such as:

  * Default API version (e.g., `v62.0`)
  * Toggle to auto-insert the “Logs” column
  * Minor UI behavior flags
* **Why:** To remember your preferences between sessions.
* **Where:** Stored locally using Chrome’s `storage` API.
* **Retention:** Until you clear extension data or uninstall the Extension.
* **Control:** Chrome → Extensions → Details → **Clear data**; or uninstall the Extension.

### C. Page content access on Salesforce domains

* **What:** Read parts of the Apex Jobs page (DOM) to identify Job IDs and inject the Logs UI.
* **Why:** To show the Logs column and handle clicks.
* **Where:** Only on Salesforce domains listed in **Host Permissions**. No content from non-Salesforce sites is accessed.

### D. What we **do not** collect

* No personal information is transmitted to us or any third party.
* No analytics, advertising, or tracking SDKs.
* No Salesforce job data or log bodies are persisted by the Extension.

---

## 4) Data Sharing

* **We do not sell, rent, or share** any user data.
* **No third-party processors** are used.
* All Tooling API calls are **same-origin** to your Salesforce domain.

---

## 5) Permissions (and why they’re needed)

* **`cookies`**: Read the Salesforce `sid` cookie in memory to authenticate Tooling API calls.
* **`scripting` / content scripts**: Add the Logs column and handle interactions on Apex Jobs pages.
* **`activeTab`**: Act only on the tab you interact with (scopes runtime access).
* **Host permissions**:

  * `https://*.salesforce.com/*`
  * `https://*.my.salesforce.com/*`
  * `https://*.lightning.force.com/*`
    Required to read the Apex Jobs DOM and call Salesforce Tooling API endpoints like `/services/data/<version>/tooling/query`.

---

## 6) Security

* The Extension does **not** introduce remote network endpoints beyond your Salesforce domain.
* The `sid` is handled **in memory** and not written to local storage by the Extension.
* We adhere to least-privilege design and limit execution to Salesforce domains.

---

## 7) Data Retention & Deletion

* **Session cookie (`sid`)**: Not stored by the Extension; managed by your browser/Salesforce.
* **Preferences**: Remain locally until you clear extension data or uninstall.
* **How to delete**:

  * Uninstall the Extension (removes its stored data).
  * Chrome → Settings → Privacy → Clear browsing data (for cookies).
  * Chrome → Extensions → Details → **Clear data** (for extension storage).

---

## 8) Your Choices & Controls

* Disable the Extension on specific sites or entirely via Chrome’s Extensions page.
* Clear cookies or log out of Salesforce to invalidate sessions.
* Clear extension storage or uninstall to remove local preferences.

---

## 9) Children’s Privacy

The Extension is intended for enterprise/administrator use and is **not** directed to children. We do not knowingly collect personal information from children.

---

## 10) International Use & Transfers

The Extension does not transfer data to our servers. Any processing happens locally in your browser and via same-origin requests to Salesforce. Cross-border data flows, if any, are governed by your Salesforce account and configuration—not the Extension.

---

## 11) Changes to This Policy

We may update this policy as the Extension evolves. Material changes will be reflected by updating the **Effective date** above. Continued use after changes indicates acceptance.

---

## 12) Contact

Questions or requests (including privacy rights requests under GDPR/CPRA)?
Email: **skilldives@gmail.com**

---

## Quick Summary Table

| Data element               | Purpose                                    | Stored by Extension?              | Shared with third parties? | Retention                 |
| -------------------------- | ------------------------------------------ | --------------------------------- | -------------------------- | ------------------------- |
| Salesforce `sid` cookie    | Authenticate same-origin Tooling API calls | **No** (in-memory only)           | **No**                     | Ephemeral                 |
| UI/behavior preferences    | Remember your settings                     | **Yes, locally** (Chrome storage) | **No**                     | Until cleared/uninstalled |
| Page DOM (Salesforce only) | Insert Logs column; identify Job IDs       | **No** (processed in memory)      | **No**                     | Ephemeral                 |

---

**Note:** Salesforce, Apex, and Lightning are trademarks of Salesforce, Inc. This Extension is an independent tool and is not affiliated with or endorsed by Salesforce.
