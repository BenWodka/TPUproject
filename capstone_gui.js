let processes = [];
let selectedProcess = null; // Holds the currently selected process
let isLoggedIn = false;
let processCount = 0;
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
// Generate a random duration string (e.g., "1h 15m") between 30 and 180 minutes.
function generateRandomDuration() {
  let minutes = Math.floor(Math.random() * (180 - 30 + 1)) + 30; // random minutes between 30 and 180
  let hours = Math.floor(minutes / 60);
  let mins = minutes % 60;
  let result = "";
  if (hours > 0) result += hours + "h ";
  result += mins + "m";
  return result;
}

// Generate six default processes with random bucket durations.
function generateDefaultProcesses() {
  let defaults = [];
  for (let i = 0; i < 6; i++) {
    let proc = new process(
      i + 1,
      generateRandomDuration(),
      generateRandomDuration(),
      generateRandomDuration(),
      generateRandomDuration(),
      generateRandomDuration(),
      generateRandomDuration(),
      generateRandomDuration(),
      generateRandomDuration()
    );
    defaults.push(proc);
  }
  return defaults;
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
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;

      // Attach the event listener to the form inside login.html
      const loginForm = document.getElementById("loginForm");
      if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
          e.preventDefault(); // Prevent form from submitting normally

          const username = document.getElementById("username").value;
          const password = document.getElementById("password").value;

          if (username === "admin" && password === "password") {
            isLoggedIn = true;
            info_screen();
          } else {
            alert("Invalid credentials. Please try again.");
          }
        });
      }
    });
}

function info_screen() {
  loadScreen("info_screen.html", function () {
    // If a process is selected, show its ID in the header.
    if (selectedProcess) {
      document.getElementById("selectedProcessDisplay").innerText =
        "Selected Process: Process " + selectedProcess.id;
    } else {
      document.getElementById("selectedProcessDisplay").innerText =
        "No process selected.";
    }
  });
}

function create_new_process() {
  loadScreen("create_new_process.html", function () {
    document.body.style.backgroundColor = "lightgrey";
    // Build a dynamic process
    let html = `<div style="padding:20px;">
                  <h2>Create New Process</h2>
                  <form id="newProcessForm">`;
    for (let i = 1; i <= 8; i++) {
      let value = selectedProcess ? selectedProcess["bucket" + i] : "";
      html += `<label for="bucket${i}">Bucket ${i} Duration:</label>
               <input type="text" id="bucket${i}" name="bucket${i}" value="${value}" required /><br/><br/>`;
    }
    html += `<input type="submit" value="Save Process" />
             </form>
             <button class="back_button" onclick="info_screen()">Back</button>
             </div>`;
    document.getElementById("content").innerHTML = html;

    document.getElementById("newProcessForm").addEventListener("submit", function(e) {
      e.preventDefault();
      let newProc = new process(
        document.getElementById("bucket1").value,
        document.getElementById("bucket2").value,
        document.getElementById("bucket3").value,
        document.getElementById("bucket4").value,
        document.getElementById("bucket5").value,
        document.getElementById("bucket6").value,
        document.getElementById("bucket7").value,
        document.getElementById("bucket8").value
      );

      // TODO: Send to backend to send to database
      alert("Process saved:\n" + JSON.stringify(newProc));

      selectedProcess = newProc;
      info_screen();
    });
  });
}

function change_process() {
  // Generate randoim processes
  processes = generateDefaultProcesses();

  // styling similar to the login screen.
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

  // Display currently selected process (if any)
  if (selectedProcess) {
    html += `<p style="font-size:16px; margin-bottom:20px;">
               Currently selected process:<br>
               <strong>Process ${selectedProcess.id}: [${selectedProcess.bucket1}, ${selectedProcess.bucket2}, ${selectedProcess.bucket3}, ${selectedProcess.bucket4}, ${selectedProcess.bucket5}, ${selectedProcess.bucket6}, ${selectedProcess.bucket7}, ${selectedProcess.bucket8}]</strong>
             </p>`;
  } else {
    html += `<p style="font-size:16px; margin-bottom:20px;">No process selected yet.</p>`;
  }

  // Create a list of default processes to choose from.
  html += `<ul style="list-style:none; padding:0;">`;
  processes.forEach((proc, index) => {
    html += `<li onclick="selectProcess(${index})" style="
                cursor:pointer;
                margin:10px 0;
                padding:10px;
                border:1px solid #ccc;
                border-radius:4px;
              ">
               <strong>Process ${proc.id}:</strong> 
               [${proc.bucket1}, ${proc.bucket2}, ${proc.bucket3}, ${proc.bucket4}, ${proc.bucket5}, ${proc.bucket6}, ${proc.bucket7}, ${proc.bucket8}]
             </li>`;
  });
  html += `</ul>`;

  if (selectedProcess) {
    html += `<button style="margin-top:20px; padding:10px 20px; font-size:16px; border:none; border-radius:4px; background-color:#4285f4; color:#fff;" onclick="info_screen()">Continue with Selected Process</button>`;
  }

  html += `<br><button class="back_button" onclick="info_screen()" style="margin-top:20px;">Back</button>`;
  html += `</div>`;
  
  document.getElementById("content").innerHTML = html;
}

function selectProcess(index) {
  selectedProcess = processes[index];
  alert("Selected Process " + selectedProcess.id + ":\n" + JSON.stringify(selectedProcess));
  // Re-render the change process screen to update the selected process display.
  change_process();
}


function run_process() {
  loadScreen("run_process.html", function () {
    document.body.style.backgroundColor = "lightgrey";
    
    if (!selectedProcess) {
      alert("No process selected. Please create or select a process first.");
      return;
    }

    // Package selectedProcess into JSON
    console.log("selectedProcess:", selectedProcess);
    let processDataJSON = JSON.stringify(selectedProcess);
    console.log("processDataJSON:", processDataJSON);

    // Send the JSON data to backend endpoint
    fetch("http://127.0.0.1:5000/api/process/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: processDataJSON
    })
    .then(response => response.json())
    .then(data => {
      console.log("Response from endpoint:", data);
      startRunProcess();
    })
    .catch(error => {
      console.error("Error sending process data:", error);
      alert("Error starting process");
    });
  });
}

function startRunProcess() {
  //Hardcoded for now, will be brought in by backend and server verified.
  let stages = [
    { name: "Stage 1", duration: 2 },
    { name: "Stage 2", duration: 3 },
    { name: "Stage 3", duration: 2 },
    { name: "Stage 4", duration: 2 },
    { name: "Stage 5", duration: 3 },
    { name: "Stage 6", duration: 2 },
    { name: "Stage 7", duration: 2 },
    { name: "Stage 8", duration: 3 }
  ];
  
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
