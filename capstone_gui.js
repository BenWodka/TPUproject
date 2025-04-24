let processes = [];
let selectedProcess = null; // Holds the currently selected process
let isLoggedIn = false;
let processCount = 0;
let bucketsPerProcess = 7; // Should be updated to 10 once DB is updated
process_to_run = 0;


class process {
  constructor(
    id,
    bucket1,
    bucket2,
    bucket3,
    bucket4,
    bucket5,
    bucket6,
    bucket7,
    bucket8
  ) {
    this.id = id;
    this.bucket1 = bucket1;
    this.bucket2 = bucket2;
    this.bucket3 = bucket3;
    this.bucket4 = bucket4;
    this.bucket5 = bucket5;
    this.bucket6 = bucket6;
    this.bucket7 = bucket7;
    this.bucket8 = bucket8;
  }
}

async function fetchProcesses() {
  try {
    const response = await fetch(`http://127.0.0.1:5000/processes/buckets/`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    processes = [];

    const grouped = {};

    data.forEach(bucket => {
      const pid = bucket.process_id;
      if (!grouped[pid]) {
        grouped[pid] = new Map();
        grouped[pid].set("process_id", pid);
        grouped[pid].bucketCount = 1;
      }
      const idx = grouped[pid].bucketCount;
      grouped[pid].set(`bucket${idx}`, bucket.duration);
      grouped[pid].set(`desc${idx}`, bucket.description);
      grouped[pid].bucketCount++;
    });

    for (const pid in grouped) {
      delete grouped[pid].bucketCount;
      processes.push(grouped[pid]);
    }

    return true;
  } catch (error) {
    console.error("Error fetching processes:", error);
    return false;
  }
}


//Helps load HTML files
function loadScreen(file, callback) {
  fetch(file)
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;
      if (callback) callback();
    })
    .catch((error) => console.error("Error loading " + file + ":", error));
}

function start_screen() {
  fetch("login.html")
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to load login.html:", response.status);
        return;
      }
      return response.text();
    })
    .then((html) => {
      if (!html) return;
      console.log("Loaded login.html");
      document.getElementById("content").innerHTML = html;

      const loginForm = document.getElementById("loginForm");
      if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
          e.preventDefault();

          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;

          fetch("http://127.0.0.1:5000/processes/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
          })
          .then(res => res.json())
          .then(data => {
            if (data.message === "Login successful") {
              isLoggedIn = true;
              if (data.role === "admin") {
                info_screen();
              } else {
                info_screen();
              }
            } else {
              alert(data.error || "Login failed");
            }
          })
          .catch(err => {
            console.error("Login error:", err);
            alert("Login error occurred.");
          });
        });
      } else {
        console.error("loginForm not found in loaded HTML");
      }
    })
    .catch((err) => {
      console.error("Error loading login.html:", err);
    });
}

function create_new_process() {
  loadScreen("create_new_process.html", () => {
    document.body.style.backgroundColor = "lightgrey";

    // Build the form HTML
    let html = `
      <div style="padding:20px; max-width:500px; margin:0 auto;">
        <h2>Create New Process</h2>
        <form id="newProcessForm">
          <label for="endTime">End Time:</label><br>
          <input type="time" id="endTime" name="endTime" required /><br/><br/>
    `;

    // Buckets 1–8, bucket 1 is required
    for (let i = 1; i <= 8; i++) {
      const req = i === 1 ? "required" : "";
      html += `
        <fieldset style="margin-bottom:20px;">
          <legend>Bucket ${i}${i===1?" (required)":""}</legend>
          <label>Duration (mins):</label><br>
          <input type="number" id="duration${i}" min="0" max="500" ${req} /><br><br>
          <label>Description:</label><br>
          <input type="text" id="desc${i}" maxlength="40" ${req} /><br>
        </fieldset>
      `;
    }

    html += `
          <button type="submit" class="menu-button">Save Draft</button>
          <button type="button" class="menu-button back_button" onclick="info_screen()">Cancel</button>
        </form>
      </div>
    `;

    document.getElementById("content").innerHTML = html;

    document
      .getElementById("newProcessForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();

        const endTimeStr = document.getElementById("endTime").value;
        if (!endTimeStr) {
          return alert("End time is required.");
        }

        // Collect only filled-out buckets
        const buckets = [];
        for (let i = 1; i <= 8; i++) {
          const d = document.getElementById(`duration${i}`).value.trim();
          const desc = document.getElementById(`desc${i}`).value.trim();
          if (d !== "" || desc !== "") {
            const mins = Number(d);
            if (!d || isNaN(mins) || mins < 0 || mins > 500) {
              return alert(`Invalid duration for Bucket ${i}.`);
            }
            if (!desc) {
              return alert(`Please provide a description for Bucket ${i}.`);
            }
            buckets.push({ bucket: i, duration: mins, description: desc });
          }
        }

        if (buckets.length < 1) {
          return alert("You must fill out at least Bucket 1.");
        }

        try {
          // Create the process draft (no status field => NULL in DB)
          const resp = await fetch("http://127.0.0.1:5000/processes/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_time: endTimeStr, buckets })
          });
          const result = await resp.json();
          if (!resp.ok) throw new Error(result.error || resp.statusText);

          // Stash the returned process_id so Info Screen picks it up
          selectedProcess = new Map([
            ["process_id", result.process_id]
            // start_time/end_time not set until schedule/run
          ]);

          alert("Process saved as draft! You can now Run or Schedule it.");
          info_screen();

        } catch (err) {
          console.error("Error creating process:", err);
          alert("Failed to save process: " + err.message);
        }
      });
  });
}


function collectBuckets() {
  const buckets = [];
  for (let i = 1; i <= 8; i++) {
    const d = parseInt(document.getElementById(`duration${i}`).value);
    if (isNaN(d) || d < 0 || d > 500) {
      alert(`Invalid duration for bucket ${i}`);
      return null;
    }
    buckets.push({
      // leave bucket_id off so POSTgREST will auto‐assign the next pk
      duration: d,
      description: document.getElementById(`desc${i}`).value || ""
    });
  }
  return buckets;
}

async function saveNewProcess() {
  const date = document.getElementById("endDate").value;
  const time = document.getElementById("endTime").value;
  if (!date || !time) return alert("Please select both date and time.");

  const buckets = collectBuckets();
  if (!buckets) return;

  const res = await fetch("http://127.0.0.1:5000/processes/create", {
    method: "POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      end_date: date,
      end_time: time,
      buckets
    })
  });
  const j = await res.json();
  if (!res.ok) return alert(j.error || "Save failed");
  alert("Process saved & scheduled!");
  selectedProcess = null;       // toss your draft
  info_screen();                // back to main menu
}

// “Continue with Process” drafts it in memory, goes to info screen
function draftNewProcess() {
  const date = document.getElementById("endDate").value;
  const time = document.getElementById("endTime").value;
  if (!date || !time) return alert("Please select both date and time.");

  const buckets = collectBuckets();
  if (!buckets) return;

  // compute start_time locally for display
  const endDt   = new Date(`${date}T${time}:00`);
  const totalM  = buckets.reduce((sum,b)=> sum + b.duration, 0);
  const startDt = new Date(endDt - totalM*60000);

  // stash into a Map so info_screen can pick it up
  selectedProcess = new Map([
    ["process_id",     null],        // not yet created
    ["start_time",     startDt.toLocaleString()],
    ["end_time",       endDt.toLocaleString()],
    ["status",         "DRAFT"]
  ]);
  info_screen();  // will now show your draft in red + a “Save” button
}

async function change_process() {
  await fetchProcesses();

  const html = `
    <div id="selectionContainer" style="
      width: 500px;
      margin: 50px auto;
      padding: 30px;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      text-align: center;
    ">
      <h2>Select a Process</h2>
      <ul style="list-style:none; padding:0;">
        ${processes.map((proc, idx) => {
          const pid = proc.get("process_id");
          const isSel = selectedProcess && selectedProcess.get("process_id") === pid;
          // build bucket lines
          const lines = [];
          for (let i = 1; i <= 8; i++) {
            const d = proc.get(`bucket${i}`);
            const desc = proc.get(`desc${i}`) || "";
            if (d != null) lines.push(`Bucket${i}: ${d} min “${desc}”`);
          }
          return `
            <li
              onclick="selectProcess(${idx})"
              style="
                cursor:pointer;
                text-align:left;
                padding:12px;
                margin:10px 0;
                border:1px solid #ccc;
                border-radius:4px;
                background: ${isSel ? "#d0eaff" : "#fafafa"};
              ">
              <strong>Process ${pid}</strong><br>
              ${lines.join("<br>")}
            </li>
          `;
        }).join("")}
      </ul>

      ${selectedProcess ? `
        <button class="menu-button" onclick="showScheduleUI()">
          Schedule Process
        </button>
        <button class="menu-button" onclick="runNow()">
          Run Now
        </button>
      ` : ``}

      <br>
      <button class="back_button" onclick="info_screen()" style="margin-top:20px;">
        Back
      </button>
    </div>
  `;
  document.getElementById("content").innerHTML = html;
}

async function runNow() {
  if (!selectedProcess) {
    return alert("Please select a process first.");
  }

  const pid = selectedProcess.process_id ?? selectedProcess.get("process_id");
  console.log("ƒ runNow(): starting process", pid);

  // make sure there's no other PENDING/IN_PROGRESS
  try {
    let cur = await fetch("http://127.0.0.1:5000/processes/current");
    if (cur.ok) {
      let j = await cur.json();
      if (j.running) {
        return alert("Another process is already PENDING or IN PROGRESS.");
      }
    }
  } catch (e) {
    console.warn("runNow: couldn't check current process", e);
  }

  // call run‑now endpoint
  let resp, payload;
  try {
    resp = await fetch(`http://127.0.0.1:5000/processes/${pid}/run-now`, {
      method: "POST"
    });
    payload = await resp.json();
    if (!resp.ok) throw new Error(payload.error || resp.statusText);
  } catch (err) {
    console.error("runNow: failed to start process", err);
    return alert("Failed to start process: " + err.message);
  }

  // give the user feedback
  alert(`Process ${pid} is now IN_PROGRESS.\nStarts at ${payload.start_time}, ends at ${payload.end_time}`);

  run_process();
}

// Accordion-toggle and selection logic
function toggleProcess(index) {
  // close all
  document.querySelectorAll(".accordion-body").forEach(body => {
    body.style.display = "none";
  });
  // open this one
  const det = document.getElementById(`details-${index}`);
  det.style.display = "block";

  // mark it selected
  selectedProcess = Object.fromEntries(processes[index].entries());
  console.log("Selected process:", selectedProcess);

  // highlight the header
  document.querySelectorAll(".accordion-header").forEach(h => {
    h.style.background = "";
  });
  document.getElementById(`header-${index}`).style.background = "#eef";
}

// when they hit “Continue…”
function confirmProcessSelection() {
  if (!selectedProcess) return;
  info_screen();
}


function selectProcess(index) {
  selectedProcess = processes[index];
  change_process();
}

function showScheduleUI() {
  const pid = selectedProcess.get("process_id");
  const today = new Date().toISOString().slice(0,10); // "YYYY‑MM‑DD"

  let html = `
    <div style="width:400px;margin:50px auto;padding:20px;
                background:#fff;border:1px solid #ccc;border-radius:8px;
                text-align:center;">
      <h2>Schedule Process ${pid}</h2>
      
      <label for="scheduleDate">End Date:</label><br>
      <input type="date" id="scheduleDate" min="${today}" required /><br/><br/>
      
      <label for="scheduleEnd">End Time:</label><br>
      <input type="time" id="scheduleEnd" required /><br/><br/>
      
      <button class="menu-button" onclick="submitSchedule()">Schedule</button>
      <button class="menu-button" onclick="change_process()">Back</button>
    </div>
  `;
  document.getElementById("content").innerHTML = html;
}


async function submitSchedule() {
  const pid     = selectedProcess.get("process_id");
  const dateStr = document.getElementById("scheduleDate").value;   // YYYY-MM-DD
  const timeStr = document.getElementById("scheduleEnd").value;    // HH:MM

  if (!dateStr || !timeStr) {
    alert("Please select both date and time.");
    return;
  }

  // Build the full Date object for the intended end time
  const endDt   = new Date(`${dateStr}T${timeStr}:00`);
  const now     = new Date();
  const minAhead = new Date(now.getTime() + 5 * 60000); // +5 minutes

  if (endDt < minAhead) {
    alert("Your end date/time must be at least 5 minutes in the future.");
    return;
  }

  // Fetch buckets so we can compute the backward start time (for warning)
  let bucketsRes = await fetch(`http://127.0.0.1:5000/processes/${pid}/buckets`);
  if (!bucketsRes.ok) {
    alert("Unable to fetch buckets for that process.");
    return;
  }
  let buckets = await bucketsRes.json();
  const totalMin = buckets.reduce((sum, b) => sum + Number(b.duration), 0);

  // Compute the calculated start time
  const startDt = new Date(endDt.getTime() - totalMin * 60000);

  // If the calculated start is already past, warn the user
  if (startDt < now) {
    const finishMins = Math.ceil((endDt - now) / 60000);
    let hh = endDt.getHours(), mm = endDt.getMinutes();
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    const mmPadded = mm.toString().padStart(2, "0");

    const ok = confirm(
      `The calculated start time has already passed.\n` +
      `This process will finish in ${finishMins} minutes at ${hh}:${mmPadded} ${ampm}.\n\n` +
      `Continue anyway?`
    );
    if (!ok) return;
  }

  selectedProcess.set("scheduled_date", dateStr);
  selectedProcess.set("scheduled_time", timeStr);

  alert("Schedule recorded. It will be sent when you click Run Process.");
  info_screen();
}

async function toggleProcessDetails(pid) {
  const detailsDiv = document.getElementById(`details-${pid}`);
  if (detailsDiv.style.display === 'block') {
    // hide if already showing
    detailsDiv.style.display = 'none';
    return;
  }
  // otherwise fetch & show
  try {
    const res = await fetch(`http://127.0.0.1:5000/processes/${pid}/buckets`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const buckets = await res.json();
    detailsDiv.innerHTML = buckets
      .map(b => `<div>Bucket ${b.bucket_id}: ${b.description || '(no desc)'}</div>`)
      .join('');
    detailsDiv.style.display = 'block';
  } catch (err) {
    detailsDiv.innerHTML = `<em>Error loading details</em>`;
    detailsDiv.style.display = 'block';
    console.error(err);
  }
}

let runningProcess = null;

async function run_process() {
  loadScreen("run_process.html", async () => {
    document.body.style.backgroundColor = "lightgrey";

    // 1) Check server for any existing PENDING/IN_PROGRESS
    let res, data;
    try {
      res  = await fetch("http://127.0.0.1:5000/processes/current");
      data = await res.json();
    } catch (err) {
      return alert("Failed to check current process");
    }
    if (res.ok && data.running) {
      if (data.status === "PENDING")    return showPendingUI(data.process);
      if (data.status === "IN_PROGRESS") return showRunningUI(data.process);
    }

    // 2) If the user has only drafted locally (status="DRAFT") OR has never scheduled it,
    //    send them to the schedule screen.
    const isDraft = selectedProcess && (
      (selectedProcess.get && selectedProcess.get("status")==="DRAFT") ||
      selectedProcess.status === "DRAFT"
    );
    const hasScheduled = selectedProcess && (
      (selectedProcess.get && selectedProcess.get("scheduled_date")) ||
      selectedProcess.scheduled_date
    );
    if (isDraft || !hasScheduled) {
      return showScheduleUI();
    }

    // 3) At this point we have a valid selectedProcess with scheduled_date/time
    const pid = selectedProcess.get 
                ? selectedProcess.get("process_id") 
                : selectedProcess.process_id;
    const date = selectedProcess.get 
                 ? selectedProcess.get("scheduled_date") 
                 : selectedProcess.scheduled_date;
    const time = selectedProcess.get 
                 ? selectedProcess.get("scheduled_time") 
                 : selectedProcess.scheduled_time;

    // sanity check
    if (!pid || !date || !time) {
      return alert("No process or schedule info available.");
    }

    // 4) POST to /schedule to set it PENDING
    try {
      const schedRes = await fetch(
        `http://127.0.0.1:5000/processes/${pid}/schedule`, {
          method:  "POST",
          headers: { "Content-Type":"application/json" },
          body:    JSON.stringify({ end_date: date, end_time: time })
        }
      );
      const schedJson = await schedRes.json();
      if (!schedRes.ok) throw new Error(schedJson.error || schedRes.statusText);

      // show the Pending UI immediately
      alert(`Process ${pid} scheduled:\n starts at ${schedJson.start_time}\n ends at ${schedJson.end_time}`);
      return showPendingUI({
        process_id: pid,
        start_time: schedJson.start_time,
        end_time:   schedJson.end_time
      });
    } catch (err) {
      console.error("schedule failed:", err);
      return alert("Failed to schedule process: " + err.message);
    }
  });
}



// after run_process() detects status:
function showPendingUI(proc) {
  const pid = proc.process_id;
  // fetch bucket details
  fetch(`http://127.0.0.1:5000/processes/${pid}/buckets`)
    .then(r => r.json())
    .then(buckets => {
      let html = `
        <div style="text-align:center; padding:20px;">
          <h2>Process ${pid} is Pending</h2>
          <div id="stagesList"></div>
          <button class="menu-button" onclick="cancelPending(${pid})">
            Cancel Pending Process
          </button>
          <button class="menu-button" onclick="info_screen()">Back</button>
        </div>
      `;
      document.getElementById("content").innerHTML = html;

      // build a temporary selectedProcess
      selectedProcess = { process_id: pid };
      buckets.forEach((b, i) => {
        selectedProcess[`bucket${b.bucket_id}`] = b.duration;
      });

      // draw them as “Pending”
      drawStages(buckets.map((b,idx)=>({
        name: `Stage ${b.bucket_id}`,
        duration: parseInt(b.duration)
      })), /*startAutomatically*/ false);
    });
}

function showRunningUI(proc) {
  const pid = proc.process_id;

  // 1) Load bucket list and draw stages
  fetch(`http://127.0.0.1:5000/processes/${pid}/buckets`)
    .then(r => r.json())
    .then(buckets => {
      document.getElementById("content").innerHTML = `
        <div style="text-align:center; padding:20px;">
          <h2>Process ${pid} is In Progress</h2>
          <div id="stagesList"></div>
          <button class="menu-button" onclick="info_screen()">Back</button>
        </div>
      `;

      drawStages(buckets.map(b => ({
        name:     `Stage ${b.bucket_id}`,
        duration: Number(b.duration)
      })), true);
    });

  // Poll this_ process every 10s
  const poller = setInterval(async () => {
    try {
      // fetch full process row
      const res2 = await fetch(`http://127.0.0.1:5000/processes/${pid}`);
      if (!res2.ok) throw new Error(res2.statusText);
      const full = await res2.json();

      if (full.status === "COMPLETED") {
        clearInterval(poller);
        showCompletedUI(full);
      }
    } catch (e) {
      console.error("poll error:", e);
    }
  }, 10_000);
}

function showCompletedUI(proc) {
  document.getElementById("content").innerHTML = `
    <div style="text-align:center; padding:20px;">
      <h2>Process ${proc.process_id} Complete</h2>
      <p>Started at: ${new Date(proc.start_time).toLocaleString()}</p>
      <p>Ended at:   ${new Date(proc.end_time).toLocaleString()}</p>
      <button class="menu-button" onclick="info_screen()">Back</button>
    </div>
  `;
}

function cancelPending(pid) {
  fetch(`http://127.0.0.1:5000/processes/${pid}/cancel`, { method: "POST" })
    .then(r => r.json().then(j => ({ ok: r.ok, j })))
    .then(({ ok, j }) => {
      if (!ok) throw new Error(j.error || "Cancel failed");
      alert("Process cancelled.");
      info_screen();
    })
    .catch(e => {
      console.error(e);
      alert("Cancel failed: " + e.message);
    });
}


/**
 * Draws the list of stages as boxed cards.
 * @param {Array<{name:string,duration:number}>} stages 
 * @param {boolean} startAutomatically 
 */
function drawStages(stages, startAutomatically) {
  const container = document.getElementById("stagesList");
  container.innerHTML = "";

  stages.forEach((stage, idx) => {
    const card = document.createElement("div");
    card.className = "stage-entry";
    // Add some quick inline styles (you can also move into CSS)
    card.style.border = "1px solid #ccc";
    card.style.borderRadius = "8px";
    card.style.padding = "10px";
    card.style.margin = "10px 0";
    card.style.background = "#fff";
    card.innerHTML = `
      <div class="stage-name" style="font-weight:bold;">${stage.name}</div>
      <div class="stage-status" id="stage-status-${idx}" style="color:gray;">Pending</div>
    `;
    container.appendChild(card);
  });

  if (startAutomatically) {
    runStage(0, stages);
  }
}

function startRunProcess() {
  let stages = [];
  for (let i = 1; i <= 8; i++) {
    const mins = selectedProcess[`bucket${i}`];
    if (mins) stages.push({ name: `Stage ${i}`, durationMins: Number(mins) });
  }

  // render boxes
  let stagesList = document.getElementById("stagesList");
  stagesList.innerHTML = "";
  stages.forEach((stage, idx) => {
    let entry = document.createElement("div");
    entry.className = "stage-entry";
    entry.id = `stage-entry-${idx}`;
    entry.innerHTML = `
      <div class="stage-name">${stage.name}</div>
      <div class="stage-status" id="stage-status-${idx}">Pending</div>
    `;
    stagesList.appendChild(entry);
  });

  document.getElementById("headerText").innerText = "Process Running";

  runStage(0, stages);
}

function runStage(index, stages) {
  if (index >= stages.length) {
    document.getElementById("headerText").innerText = "Process Complete!";
    return;
  }

  const { duration, name } = stages[index];
  const totalSecs = duration * 60;
  let elapsed = 0;

  const statusElem = document.getElementById(`stage-status-${index}`);
  statusElem.innerText = `Running: 0s / ${totalSecs}s`;

  const interval = setInterval(() => {
    elapsed++;
    statusElem.innerText = `Running: ${elapsed}s / ${totalSecs}s`;

    if (elapsed >= totalSecs) {
      clearInterval(interval);
      statusElem.innerText = "Completed";
      statusElem.style.color = "green";
      runStage(index + 1, stages);
    }
  }, 1000);
}

let infoPollHandle = null;

function info_screen() {
  loadScreen("info_screen.html", () => {
    const display   = document.getElementById("selectedProcessDisplay");
    const runBtn    = document.getElementById("runProcessButton");
    const changeBtn = document.getElementById("changeProcessButton");
    const btns      = document.getElementById("buttonsContainer");

    // --- update the “Selected Process” line ---
    if (selectedProcess && display) {
      const pid = selectedProcess.process_id ?? selectedProcess.get("process_id");
      display.innerText = `Selected Process: Process ${pid}`;
      display.style.display = "";
    } else {
      display.style.display = "none";
    }

    // --- insert or find the Deselect button ---
    let deselectBtn = document.getElementById("deselectProcessButton");
    if (!deselectBtn) {
      deselectBtn = document.createElement("button");
      deselectBtn.id        = "deselectProcessButton";
      deselectBtn.className = "menu-button";
      deselectBtn.innerText = "Deselect Process";
      deselectBtn.onclick   = () => {
        selectedProcess = null;
        info_screen();
      };
      // put it right after “Run Process”
      btns.insertBefore(deselectBtn, runBtn.nextSibling);
    }
    // only show if something’s actually selected
    deselectBtn.style.display = selectedProcess ? "inline-block" : "none";

    // --- your existing polling logic to update runBtn text ---
    async function pollCurrent() {
      try {
        changeBtn.style.display = "inline-block";
        changeBtn.onclick      = () => {
          selectedProcess = null;
          change_process();
        };
        const res = await fetch("http://127.0.0.1:5000/processes/current");
        const { running, status } = await res.json();
        if (running && (status === "PENDING" || status === "IN_PROGRESS")) {
          runBtn.innerText     = "View Current Process";
          runBtn.dataset.mode  = "view";
        } else {
          runBtn.innerText     = "Run Process";
          runBtn.dataset.mode  = "run";
        }
      } catch (err) {
        runBtn.innerText    = "Run Process";
        runBtn.dataset.mode = "run";
      }
    }

    // kick off immediately + every 5s
    pollCurrent();
    if (infoPollHandle) clearInterval(infoPollHandle);
    infoPollHandle = setInterval(pollCurrent, 5000);
  });
}

function logout() {
  isLoggedIn = false;
  window.location.href = "capstone.html";
}

start_screen();
