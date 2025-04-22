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
  loadScreen("create_new_process.html", function () {
    document.body.style.backgroundColor = "lightgrey";

    let html = `<div style="padding:150px; text-align: center;">
                  <h2>Create New Process</h2>
                  <form id="newProcessForm">
                    <label for="endTime">End Time:</label>
                    <input type="time" id="endTime" name="endTime" required /><br/><br/>`;

    for (let i = 1; i <= 8; i++) {
      // only bucket1 inputs are required
      const required = (i === 1) ? 'required' : '';
      html += `
        <fieldset style="margin-bottom: 20px; text-align: left;">
          <legend>Bucket ${i} ${i===1?"(required minimum)":""}</legend>
          <label for="duration${i}">Duration (mins):</label>
          <input type="number" id="duration${i}" name="duration${i}"
                 min="0" max="500" ${required} /><br/><br/>
          <label for="desc${i}">Description:</label>
          <input type="text" id="desc${i}" name="desc${i}"
                 maxlength="40" ${required} /><br/>
        </fieldset>
      `;
    }

    html += `<input type="submit" value="Save Process" />
             <button type="button" class="back_button" onclick="info_screen()">Back</button>
             </form></div>`;

    document.getElementById("content").innerHTML = html;

    document
      .getElementById("newProcessForm")
      .addEventListener("submit", async function (e) {
        e.preventDefault();

        const endTimeStr = document.getElementById("endTime").value;
        if (!endTimeStr) {
          return alert("End time is required.");
        }

        // Gather only the buckets the user actually filled out
        const buckets = [];
        for (let i = 1; i <= 8; i++) {
          const durEl   = document.getElementById(`duration${i}`);
          const descEl  = document.getElementById(`desc${i}`);
          const duration = durEl.value.trim();
          const desc     = descEl.value.trim();

          // If either field is non-empty, require both
          if (duration !== "" || desc !== "") {
            if (duration === "" || isNaN(+duration) || +duration < 0 || +duration > 500) {
              return alert(`Please enter a valid duration for Bucket ${i}.`);
            }
            if (!desc) {
              return alert(`Please enter a description for Bucket ${i}.`);
            }
            buckets.push({
              bucket: i,
              duration: +duration,
              description: desc
            });
          }
        }

        if (buckets.length < 1) {
          return alert("You must fill out at least Bucket 1 (duration + description).");
        }

        // Send process to backend
        try {
          const resp = await fetch("http://127.0.0.1:5000/processes/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_time: endTimeStr, buckets })
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || resp.statusText);

          alert("Process saved successfully.");
          selectedProcess = buckets;  
          info_screen();
        } catch (err) {
          console.error("Error saving process:", err);
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

    // see if there's already a pending/running process
    let current;
    try {
      const res = await fetch("http://127.0.0.1:5000/processes/current");
      current = await res.json();
      if (res.ok && current.running) {
        // if it’s PENDING or IN_PROGRESS, hand off to UI:
        if (current.status === "PENDING")    return showPendingUI(current.process);
        if (current.status === "IN_PROGRESS") return showRunningUI(current.process);
      }
    } catch (err) {
      console.warn("Could not fetch current process:", err);
    }

    // If we got here, there's no live process → either schedule or run‐now
    const pid = selectedProcess?.process_id
              ?? selectedProcess?.get("process_id");
    if (!pid) {
      return alert("Nothing selected to run.");
    }

    // if they already filled in a schedule in the UI, POST to /schedule
    if (selectedProcess.get?.("scheduled_date")) {
      const date = selectedProcess.get("scheduled_date");
      const time = selectedProcess.get("scheduled_time");
      try {
        const schedRes = await fetch(
          `http://127.0.0.1:5000/processes/${pid}/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ end_date: date, end_time: time })
          }
        );
        if (!schedRes.ok) {
          const err = await schedRes.json();
          throw new Error(err.error || schedRes.statusText);
        }
        alert("Process scheduled successfully!");
        // after scheduling go back to info screen
        return info_screen();
      } catch (e) {
        console.error("Scheduling failed:", e);
        return alert("Failed to schedule: " + e.message);
      }
    }

    //Otherwise, do a Run Now
    try {
      // check again that no other is pending/running
      const res2 = await fetch("http://127.0.0.1:5000/processes/current");
      if (res2.ok) {
        const j2 = await res2.json();
        if (j2.running) {
          return alert("Another process is already PENDING or IN PROGRESS.");
        }
      }
    } catch (_) {}

    // call run-now endpoint
    let runRes = await fetch(
      `http://127.0.0.1:5000/processes/${pid}/run-now`,
      { method: "POST" }
    );
    let body = await runRes.json();
    if (!runRes.ok) {
      console.error("run-now failed:", body);
      return alert("Failed to start process: " + (body.error||runRes.statusText));
    }

    alert(`Process ${pid} started!\nStarts at ${body.start_time}, ends at ${body.end_time}`);
    // show the in‑progress UI
    return showRunningUI({ process_id: pid });
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
  fetch(`http://127.0.0.1:5000/processes/${pid}/buckets`)
    .then(r => r.json())
    .then(buckets => {
      let html = `
        <div style="text-align:center; padding:20px;">
          <h2>Process ${pid} is In Progress</h2>
          <div id="stagesList"></div>
          <button class="menu-button" onclick="info_screen()">Back</button>
        </div>
      `;
      document.getElementById("content").innerHTML = html;

      // stash for runStage()
      selectedProcess = { process_id: pid };
      buckets.forEach(b => selectedProcess[`bucket${b.bucket_id}`] = b.duration);

      // draw them as stages
      drawStages(
        buckets.map(b => ({
          name: `Stage ${b.bucket_id}`,
          duration: Number(b.duration)
        })),
        true  // auto‐start
      );
    });
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

  const { durationMins, name } = stages[index];
  const totalSecs = durationMins * 60;
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
    const display = document.getElementById("selectedProcessDisplay");
    const runBtn  = document.getElementById("runProcessButton");

    // Show/hide the “Selected Process” line:
    if (selectedProcess && display) {
      const pid = selectedProcess.process_id ?? selectedProcess.get("process_id");
      display.innerText = `Selected Process: Process ${pid}`;
      display.style.display = "";
    } else {
      display.style.display = "none";
    }

    // A helper to poll /processes/current and update the button:
    async function pollCurrent() {
      try {
        const res = await fetch("http://127.0.0.1:5000/processes/current");
        const { running, status } = await res.json();
        if (running && (status === "PENDING" || status === "IN_PROGRESS")) {
          runBtn.innerText = "View Current Process";
          runBtn.dataset.mode = "view";
        } else {
          runBtn.innerText = "Run Process";
          runBtn.dataset.mode = "run";
        }
      } catch (err) {
        // any error → default to Run
        runBtn.innerText = "Run Process";
        runBtn.dataset.mode = "run";
      }
    }

    // Kick off an immediate poll + every 5s thereafter:
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
