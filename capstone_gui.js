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
      let response = await fetch(`http://127.0.0.1:5000/processes/buckets/`);
      if (!response.ok)
         throw new Error(`HTTP error! Status: ${response.status}`);
      
      let data = await response.json();
      processes = [];
      
      // processes = data;
      // for(let i = 0; i < processes.length; i++)
      //     console.log(data[i]["process_id"])
      
      for (let i = 0; i < bucketsPerProcess; i++) {
        let process = new Map();
        process.set("process_id", i);
        process.set("bucket1", data[i]["duration"]);
        process.set("bucket2", data[i+1]["duration"]);
        process.set("bucket3", data[i+2]["duration"]);
        process.set("bucket4", data[i+3]["duration"]);
        process.set("bucket5", data[i+4]["duration"]);
        process.set("bucket6", data[i+5]["duration"]);
        process.set("bucket7", data[i+6]["duration"]);
        processes.push(process);
      }

      // console.log(processes);

      change_process();
  } catch (error) {
      console.error("Error fetching processes:", error);
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
  fetchProcesses();

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
                <strong>Process ${selectedProcess.get("process_id")}
                [Bucket Durations: ${selectedProcess.get("bucket1")}, ${selectedProcess.get("bucket2")}, ${selectedProcess.get("bucket4")}, ${selectedProcess.get("bucket5")}, ${selectedProcess.get("bucket5")}, ${selectedProcess.get("bucket6")}, ${selectedProcess.get("bucket7")}]</strong>
             </p>`;
  } else {
    html += `<p style="font-size:16px; margin-bottom:20px;">No process selected yet.</p>`;
  }

 html += `<menu style="list-style:none; padding:0px;">`;
  processes.forEach((proc, index) => {
    html += `<li onclick="selectProcess(${index})" style="
                cursor:pointer; 
                padding:10px;
                margin:10px 0;
                border:1px solid #ccc; 
                border-radius:4px;
              ">
                <strong>Process ${proc.get("process_id")}</strong> 
                [Bucket Durations: ${proc.get("bucket1")}, ${proc.get("bucket2")}, ${proc.get("bucket4")}, ${proc.get("bucket5")}, ${proc.get("bucket5")}, ${proc.get("bucket6")}, ${proc.get("bucket7")}]
              </li>`;
  });
  html += `</menu>`;

  if (selectedProcess) {
    html += `<button style="margin-top:20px; padding:10px 20px; font-size:16px; border:none; border-radius:4px; background-color:#4285f4; color:#fff;" onclick="info_screen()">Continue with Selected Process</button>`;
  }

  html += `<br><button class="back_button" onclick="info_screen()" style="margin-top:20px;">Back</button>`;
  html += `</div>`;

  document.getElementById("content").innerHTML = html;
}

function selectProcess(index) {
  selectedProcess = processes[index];
  console.log("Selected Process:", selectedProcess);
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
