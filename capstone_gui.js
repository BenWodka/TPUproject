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
    if (!response.ok)
      throw new Error(`HTTP error! Status: ${response.status}`);

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

      // Map sequentially: bucket1, bucket2, ...
      const bucketKey = "bucket" + grouped[pid].bucketCount;
      grouped[pid].set(bucketKey, bucket.duration);
      grouped[pid].bucketCount++;
    });

    for (const pid in grouped) {
      grouped[pid].delete("bucketCount"); // remove helper key
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

function info_screen() {
  loadScreen("info_screen.html", function () {
    const display = document.getElementById("selectedProcessDisplay");
    const runBtn = document.getElementById("runProcessButton");

    if (selectedProcess && display) {
      display.innerText = "Selected Process: Process " + (selectedProcess.id || selectedProcess.process_id);
    } else {
      display.innerText = "No process selected.";
    }

    fetch("http://127.0.0.1:5000/processes/current")
      .then(res => {
        if (res.status === 404) {
          if (runBtn) runBtn.innerText = "Run Process";
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.running && runBtn) {
          runBtn.innerText = "View Current Process";
        }
      })
      .catch(err => {
        console.error("Error checking current process:", err);
      });
  });
}

function create_new_process() {
  loadScreen("create_new_process.html", function () {
    document.body.style.backgroundColor = "lightgrey";

    let html = `<div style="padding:20px;">
                  <h2>Create New Process</h2>
                  <form id="newProcessForm">

                  <label for="endTime">End Time:</label>
                  <input type="time" id="endTime" name="endTime" required /><br/><br/>
    `;

    for (let i = 1; i <= 8; i++) {
      html += `
        <fieldset style="margin-bottom: 20px;">
          <legend>Bucket ${i}</legend>

          <label for="duration${i}">Duration (mins):</label>
          <input type="number" id="duration${i}" name="duration${i}" min="0" max="180" required /><br/><br/>

          <label for="desc${i}">Description:</label>
          <input type="text" id="desc${i}" name="desc${i}" maxlength="40" required /><br/>
        </fieldset>
      `;
    }

    html += `<input type="submit" value="Save Process" />
             </form>
             <button class="back_button" onclick="info_screen()">Back</button>
             </div>`;

    document.getElementById("content").innerHTML = html;

    document.getElementById("newProcessForm").addEventListener("submit", function (e) {
      e.preventDefault();

      const endTimeStr = document.getElementById("endTime").value;
      if (!endTimeStr) {
        alert("End time is required.");
        return;
      }

      const buckets = [];

      for (let i = 1; i <= 8; i++) {
        const durationMin = parseInt(document.getElementById(`duration${i}`).value);
        const desc = document.getElementById(`desc${i}`).value;

        if (isNaN(durationMin) || durationMin < 0 || durationMin > 180 || !desc) {
          alert(`Invalid input for Bucket ${i}`);
          return;
        }

        buckets.push({
          bucket: i,
          duration: durationMin,
          description: desc
        });
      }

      // Send process to backend
      fetch("http://127.0.0.1:5000/processes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ end_time: endTimeStr, buckets: buckets })
      })
      .then(response => response.json())
      .then(data => {
        alert("Process saved successfully.");
        selectedProcess = buckets;
        info_screen();
      })
      .catch(error => {
        console.error("Error saving process:", error);
        alert("Failed to save process.");
      });
    });
  });
}




async function change_process() {
  const success = await fetchProcesses();
  if (!success) {
    alert("Failed to load processes.");
    return;
  }

  let html = `<div id="selectionContainer" style="
                 width: 500px;
                 margin: 50px auto;
                 padding: 30px;
                 background: #fff;
                 border: 1px solid #ccc;
                 border-radius: 8px;
                 text-align: center;
               ">`;
  html += `<h2>Select a Process</h2>`;

  if (selectedProcess) {
    html += `<p style="font-size:16px; margin-bottom:20px;">
                Selected process:<br>
                <strong>Process ${selectedProcess["process_id"]}
                [Bucket Durations: ${selectedProcess["bucket1"]}, ${selectedProcess["bucket2"]}, ${selectedProcess["bucket3"]}, ${selectedProcess["bucket4"]}, ${selectedProcess["bucket5"]}, ${selectedProcess["bucket6"]}, ${selectedProcess["bucket7"]}]</strong>
             </p>`;
  } else {
    html += `<p style="font-size:16px; margin-bottom:20px;">No process selected yet.</p>`;
  }

 html += `<menu style="list-style:none; padding:0px;">`;
 processes.forEach((proc, index) => {
  let durations = [];
  for (let i = 1; i <= 8; i++) {
    durations.push(proc.get("bucket" + i) ?? "N/A");
  }

  html += `<li onclick="selectProcess(${index})" style="
              cursor:pointer; 
              padding:10px;
              margin:10px 0;
              border:1px solid #ccc; 
              border-radius:4px;
            ">
              <strong>Process ${proc.get("process_id")}</strong> 
              [Bucket Durations: ${durations.join(", ")}]
            </li>`;
});
  html += `</menu>`;
  console.log("Rendering with selected process:", selectedProcess);

  if (selectedProcess) {
    html += `<button type="button"
              style="margin-top:20px; padding:10px 20px; font-size:16px; border:none; border-radius:4px; background-color:#4285f4; color:#fff;"
              onclick="info_screen()">
              Continue with Selected Process
              </button>`;
  }

  html += `<br><button class="back_button" onclick="info_screen()" style="margin-top:20px;">Back</button>`;
  html += `</div>`;

  document.getElementById("content").innerHTML = html;
}

function selectProcess(index) {
  const selectedMap = processes[index];
  selectedProcess = Object.fromEntries(selectedMap.entries());
  console.log("Selected Process as object:", selectedProcess);
  change_process();
}

let runningProcess = null;

async function run_process() {
  loadScreen("run_process.html", async function () {
    document.body.style.backgroundColor = "lightgrey";

    try {
      const current = await fetch("http://127.0.0.1:5000/processes/current");
      if (current.status === 200) {
        const data = await current.json();
        runningProcess = data.process[0];
        selectedProcess = runningProcess;

        const process_id = runningProcess.process_id;

        // Fetch the actual buckets for the current process
        const bucketsRes = await fetch(`http://127.0.0.1:5000/processes/${process_id}/buckets`);
        const buckets = await bucketsRes.json();

        // Build bucket-style selectedProcess object
        selectedProcess = { process_id };
        for (const bucket of buckets) {
          selectedProcess[`bucket${bucket.bucket_id}`] = bucket.duration;
        }

        console.log("Using running process w/ buckets:", selectedProcess);
      } else if (selectedProcess) {
        const startResponse = await fetch("http://127.0.0.1:5000/processes/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ process_id: selectedProcess.process_id })
        });

        if (!startResponse.ok) {
          const result = await startResponse.json();
          alert(result.error || "Failed to start process");
          return;
        }

        runningProcess = selectedProcess;
        console.log("Started new process:", runningProcess);
      } else {
        alert("No process selected.");
        return;
      }

      startRunProcess();
    } catch (err) {
      console.error("Error in run_process:", err);
      alert("Error running process.");
    }
  });
}

function startRunProcess() {
  //Hardcoded for now, will be brought in by backend and server verified.
  let stages = [];
  for (let i = 1; i <= 8; i++) {
    const duration = selectedProcess[`bucket${i}`];
    if (duration) {
      stages.push({
        name: `Stage ${i}`,
        duration: parseInt(duration)
      });
    }
  }
  
  
  // Inject stage entries into the container
  let stagesList = document.getElementById("stagesList");
  if (stagesList) {

    stagesList.innerHTML = "";
    stages.forEach((stage, index) => {
      let entry = document.createElement("div");
      entry.className = "stage-entry";
      entry.id = "stage-entry-" + index;
      entry.innerHTML = `
        <div class="stage-name">${stage.name}</div>
        <div class="stage-status" id="stage-status-${index}">Pending</div>
      `;
      stagesList.appendChild(entry);
    });
  }
  
  let header = document.getElementById("headerText");
  if (header) {
    header.innerText = "Process Running";
  }
  
  // Start running the stages sequentially starting at index 0.
  runStage(0, stages);
}

function runStage(index, stages) {
  // If all stages completed, update header
  if (index >= stages.length) {
    let header = document.getElementById("headerText");
    if (header) {
      header.innerText = "Process Complete!";
    } else {
      document.querySelector("h2").innerText = "Process Complete!";
    }
    alert("Process complete!");
    return;
  }
  
  let stage = stages[index];
  let elapsed = 0;
  
  // Get the DOM element for the current stage's status.
  let statusElem = document.getElementById("stage-status-" + index);
  if (statusElem) {
    statusElem.innerText = `Running: 0s / ${stage.duration}s`;
    statusElem.style.color = "black";
  }
  
  // Run the stages sequentially.
  let interval = setInterval(() => {
    elapsed++;
    if (statusElem) {
      statusElem.innerText = `Running: ${elapsed}s / ${stage.duration}s`;
    }
    // Stage complete
    if (elapsed >= stage.duration) {
      clearInterval(interval);
      if (statusElem) {
        statusElem.innerText = "Complete";
        statusElem.style.color = "green";
      }
      // Start next stage.
      runStage(index + 1, stages);
    }
  }, 1000);
}

function logout() {
  isLoggedIn = false;
  window.location.href = "capstone.html";
}

start_screen();
