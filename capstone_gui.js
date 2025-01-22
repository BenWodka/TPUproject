const processes = [];
process_to_run = 0;

class process
{
    constructor(bucket1, bucket2, bucket3, bucket4, bucket5, bucket6, bucket7, bucket8)
    {
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

function start_screen()
{
    let s = [];
    s.push(`<center><canvas id="canvas" width=100% height=100% style="border:0px solid #FFFFFF;"></canvas></center>`);
    s.push(`<div>
            <button class="button_login" onclick="info_screen()">Login</button></div>`);

    var content = document.getElementById("content");
    if(content)
    {
        content.innerHTML = s.join('');
    }

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    //grey gradient specifics 
    const login_gradient = ctx.createRadialGradient(850, 500, 400, 850, 500, 40);
    login_gradient.addColorStop(1, "lightgrey");
    login_gradient.addColorStop(0, "grey");

    document.body.style.backgroundColor = "lightgrey";

    ctx.fillStyle = "grey";
    ctx.fillRect(450, 200, 800, 500);
    ctx.fillStyle = "black";
    ctx.font = "20px Georgia";
    ctx.fillText("Username:", 550, 400);

}

function info_screen()
{
    let s = [];
    //s.push(``);
    s.push(`<center><canvas id="canvas" width=100% height=100% style="border:0px solid #FFFFFF;"></canvas></center>`);
    //add button commands
    s.push(`<div>
            <button class="button_change" onclick="change_process()">Change Process</button>
            <button class="button_create" onclick="create_new_process()">Create New Process</button>
            <button class="button_run" onclick="run_process()">Run</button></div>`);

    var content = document.getElementById("content");
    if(content)
    {
        content.innerHTML = s.join('');
    }
    
    document.body.style.backgroundColor = "lightgrey";

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    //grey gradient specifics 
    const color_gradient = ctx.createRadialGradient(325, 400, 450, 325, 400, 15);
    color_gradient.addColorStop(1, "lightgrey");
    color_gradient.addColorStop(0, "grey");

    ctx.fillStyle = color_gradient;
    ctx.fillRect(0, 0, 650, 800);// 850 is half the screen for x
    ctx.fillStyle = "black";
    x = 40; // 1st row left shift
    x2 = x + 190; // 2nd row left shift
    x3 = x2 + 220; // 3rd row left shift
    y = 40; // 1st column down shift
    y2 = 70; // 2nd column down shift
    y3 = 100; // 3rd column down shift
    
    //print the process names alter font size later as needed...
    ctx.font = "40px Georgia";
    ctx.fillText("Process 1:", x, 50);
    ctx.fillText("Process 2:", x, 200);
    ctx.fillText("Process 3:", x, 350);
    ctx.fillText("Process 4:", x, 500);
    ctx.fillText("Process 5:", x, 650);

    //print the process' information
    ctx.font = "20px Georgia";
    //print process 1 information
    ctx.fillText("Bucket 1: 2 hours", x, 50 + y);
    ctx.fillText("Bucket 4: 4 hours", x, 50 + y2);
    ctx.fillText("Bucket 7: 5 hours", x, 50 + y3);
    ctx.fillText("Bucket 2: Not used", x2, 50 + y);
    ctx.fillText("Bucket 5: 1.5 hours", x2, 50 + y2);
    ctx.fillText("Bucket 8: 30 minutes", x2, 50 + y3);
    ctx.fillText("Bucket 3: 1 hour", x3, 50 + y);
    ctx.fillText("Bucket 6: 1 hour", x3, 50 + y2);
    //print process 2 information
    ctx.fillText("Bucket 1: 2 hours", x, 200 + y);
    ctx.fillText("Bucket 2: 4 hours", x, 200 + y2);
    ctx.fillText("Bucket 3: 5 hours", x, 200 + y3);
    ctx.fillText("Bucket 4: Not used", x2, 200 + y);
    ctx.fillText("Bucket 5: 1.5 hours", x2, 200 + y2);
    ctx.fillText("Bucket 6: 30 minutes", x2, 200 + y3);
    ctx.fillText("Bucket 7: 1 hour", x3, 200 + y);
    ctx.fillText("Bucket 8: 1 hour", x3, 200 + y2);
    //print process 3 information
    ctx.fillText("Bucket 1: 2 hours", x, 350 + y);
    ctx.fillText("Bucket 2: 4 hours", x, 350 + y2);
    ctx.fillText("Bucket 3: 5 hours", x, 350 + y3);
    ctx.fillText("Bucket 4: Not used", x2, 350 + y);
    ctx.fillText("Bucket 5: 1.5 hours", x2, 350 + y2);
    ctx.fillText("Bucket 6: 30 minutes", x2, 350 + y3);
    ctx.fillText("Bucket 7: 1 hour", x3, 350 + y);
    ctx.fillText("Bucket 8: 1 hour", x3, 350 + y2);
    //print process 4 information
    ctx.fillText("Bucket 1: 2 hours", x, 500 + y);
    ctx.fillText("Bucket 2: 4 hours", x, 500 + y2);
    ctx.fillText("Bucket 3: 5 hours", x, 500 + y3);
    ctx.fillText("Bucket 4: Not used", x2, 500 + y);
    ctx.fillText("Bucket 5: 1.5 hours", x2, 500 + y2);
    ctx.fillText("Bucket 6: 30 minutes", x2, 500 + y3);
    ctx.fillText("Bucket 7: 1 hour", x3, 500 + y);
    ctx.fillText("Bucket 8: 1 hour", x3, 500 + y2);
    //print process 5 information
    ctx.fillText("Bucket 1: 2 hours", x, 650 + y);
    ctx.fillText("Bucket 2: 4 hours", x, 650 + y2);
    ctx.fillText("Bucket 3: 5 hours", x, 650 + y3);
    ctx.fillText("Bucket 4: Not used", x2, 650 + y);
    ctx.fillText("Bucket 5: 1.5 hours", x2, 650 + y2);
    ctx.fillText("Bucket 6: 30 minutes", x2, 650 + y3);
    ctx.fillText("Bucket 7: 1 hour", x3, 650 + y);
    ctx.fillText("Bucket 8: 1 hour", x3, 650 + y2);

    //right portion of the screen
    ctx.font = "40px Georgia";
    ctx.fillText("Change process", 1000, 50 + y3);
    ctx.fillText("Create new process", 975, 325);
    ctx.fillText("Select process", 1020, 500);
}

function create_new_process()
{
    let s = [];
    s.push(`<center><canvas id="canvas" width=100% height=100% style="border:0px solid #FFFFFF;"></canvas></center>`);
    s.push(`<div>
            <button class="button_create_process" onclick="run_process()">Run Process</button></div>`);

    var content = document.getElementById("content");
    if(content)
    {
        content.innerHTML = s.join('');
    }

    document.body.style.backgroundColor = "lightgrey";

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, ctx.canvas.width, 90);
    ctx.font = "40px Georgia";
    ctx.fillStyle = "black";
    ctx.fillText("Create New Process", 700, 60);

    row_x1_start = 50;
    row_y1_start = 175;
    row_x2_start = 350;
    row_x3_start = 650;
    row_x4_start = 950;
    row_y2_start = 525;
    x_whitespace = 100;
    x_width = 200; // box width
    y_width = 125; // box height
    title_indent = 10;
    title_downshift = 40;

    //Bucket 1 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x1_start, row_y1_start, x_width + row_x1_start, y_width + row_y1_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 1:", row_x1_start + title_indent, row_y1_start + title_downshift);
    //Bucket 2 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x2_start, row_y1_start, x_width + row_x1_start, y_width + row_y1_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 2:", row_x2_start + title_indent, row_y1_start + title_downshift);
    //Bucket 3 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x3_start, row_y1_start, x_width + row_x1_start, y_width + row_y1_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 3:", row_x3_start + title_indent, row_y1_start + title_downshift);
    //Bucket 4 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x4_start, row_y1_start, x_width + row_x1_start, y_width + row_y1_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 4:", row_x4_start + title_indent, row_y1_start + title_downshift)
    //Bucket 5 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x1_start, row_y2_start, x_width + row_x1_start, y_width + row_y2_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 5:", row_x1_start + title_indent, row_y2_start + title_downshift);
    //Bucket 6 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x2_start, row_y2_start, x_width + row_x1_start, y_width + row_y2_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 6:", row_x2_start + title_indent, row_y2_start + title_downshift);
    //Bucket 7 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x3_start, row_y2_start, x_width + row_x1_start, y_width + row_y2_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 7:", row_x3_start + title_indent, row_y2_start + title_downshift);
    //Bucket 8 box info
    ctx.fillStyle = "grey";
    ctx.fillRect(row_x4_start, row_y2_start, x_width + row_x1_start, y_width + row_y2_start);
    ctx.fillStyle = "black";
    ctx.fillText("Bucket 8:", row_x4_start + title_indent, row_y2_start + title_downshift);
}

function change_process()
{
    let s = [];
    s.push(`<center><canvas id="canvas" width=100% height=100% style="border:0px solid #FFFFFF;"></canvas></center>`);

    var content = document.getElementById("content");
    if(content)
    {
        content.innerHTML = s.join('');
    }

    document.body.style.backgroundColor = "lightgrey";

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, ctx.canvas.width, 90);
    ctx.fillStyle = "black";
    ctx.font = "40px Georgia";
    ctx.fillText("Change Process", 700, 60);
}

function run_process()
{
    let s = [];
    s.push(`<center><canvas id="canvas" width=100% height=100% style="border:0px solid #FFFFFF;"></canvas></center>`);

    var content = document.getElementById("content");
    if(content)
    {
        content.innerHTML = s.join('');
    }

    document.body.style.backgroundColor = "lightgrey";

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.font = "50px Georgia";

    process_to_run = 1; // get rid of later...

    if(process_to_run == 1)
    {
        ctx.fillText("Process 1 is set to run.", 580, 425);
    }
    if(process_to_run == 2)
    {
        ctx.fillText("Process 2 is set to run.", 580, 425);
    }
    if(process_to_run == 3)
    {
        ctx.fillText("Process 3 is set to run.", 580, 425);
    }
    if(process_to_run == 4)
    {
        ctx.fillText("Process 4 is set to run.", 580, 425);
    }
    if(process_to_run == 5)
    {
        ctx.fillText("Process 5 is set to run.", 580, 425);
    }
}

start_screen();
