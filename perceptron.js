random = (min, max) => Math.random() * (max - min) + min;
range = (x, y) => [...Array(y-x).keys()].map(i => i + x);
clear_ctx = ctx => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
}

// The line the perceptron is learning to recognize
line = x => 0.6 * x - 50;

class Perceptron {
    constructor(num_weights) {
        this.c = 0.0001;
        this.weights = [...Array(num_weights)].map(Math.random);
        this.weights[this.weights.length-1] = 1; // Set the bias weight to 1
    }
    run(inputs) {
        let weighted_inputs = inputs.map((x, i) => x * this.weights[i]);
        let total = weighted_inputs.reduce((x, t) => x + t);
        return this.activate(total)
    }
    train(inputs, desired) {
        let guess = this.run(inputs);
        let error = desired - guess;
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] += this.c * error * inputs[i];
        }
    }
    activate(val) {
        return (val > 0) ? 1 : -1
    }
}

class TrainingPoint {
    constructor(inputs, answer) {
        this.inputs = inputs;
        this.answer = answer;
    }
}

function run_sim() {
    let training_canvas = document.getElementById("training_vis_canvas");
    let t_ctx = training_canvas.getContext("2d");
    let perceptron_canvas = document.getElementById("perceptron_vis_canvas");
    let p_ctx = perceptron_canvas.getContext("2d");

    const WIDTH = training_canvas.clientWidth;
    const HEIGHT = training_canvas.clientHeight;
    const MIN_X = -(WIDTH  / 2);
    const MIN_Y = -(HEIGHT / 2);
    const MAX_X =  (WIDTH  / 2);
    const MAX_Y =  (HEIGHT / 2);

    t_ctx.setTransform(1, 0, 0, 1, 0, 0);
    p_ctx.setTransform(1, 0, 0, 1, 0, 0);
    t_ctx.translate(WIDTH/2, HEIGHT/2);
    p_ctx.translate(WIDTH/2, HEIGHT/2);
    t_ctx.scale(1, -1);
    p_ctx.scale(1, -1);
    t_ctx.fillStyle = 'rgb(0, 0, 0)';
    p_ctx.fillStyle = 'rgb(0, 0, 0)';

    let perceptron = new Perceptron(3);
    let NUMBER_OF_POINTS = document.getElementById("num_points").value;
    let training_points = range(0, NUMBER_OF_POINTS).map(_ => {
        let x = random(MIN_X, MAX_X);
        let y = random(MIN_Y, MAX_Y);
        let answer = y < line(x) ? -1 : 1;
        return new TrainingPoint([x, y, 1], answer)
    })

    let count = 0;

    function frame() {
        // Get training mode
        let MODE = document.getElementById("training_mode").checked ? 'fast' : 'slow';
        // Set up the canvases
        clear_ctx(t_ctx);
        clear_ctx(p_ctx);
        t_ctx.lineWidth = 4;
        t_ctx.fillStyle = 'rgb(0, 0, 0)';
        let left_y = line(MIN_X);
        let right_y = line(MAX_X);

        // Draw the real line
        t_ctx.beginPath()
        t_ctx.moveTo(MIN_X, left_y);
        t_ctx.lineTo(MAX_X, right_y);
        t_ctx.stroke();

        // Train the perceptron
        if (MODE === 'fast') {
            for (p of training_points) {
                perceptron.train(p.inputs, p.answer);
            }
        } else {
            let point = training_points[count];
            perceptron.train(point.inputs, point.answer);
            count = (count + 1) % training_points.length;
        }
        
        // Draw the training points
        t_ctx.lineWidth = 1;
        for (let p of training_points) {
            t_ctx.beginPath()
            t_ctx.arc(p.inputs[0], p.inputs[1], 5, 0, 2*Math.PI);
            if (perceptron.run(p.inputs) === 1) {
                t_ctx.stroke();
            } else {
                t_ctx.fill();
            }
        }

        // Draw what the perceptron thinks the line is.
        t_ctx.fillStyle = 'rgb(127, 127, 127)';
        let weights = perceptron.weights;
        let x1 = MIN_X;
        let y1 = (-weights[2] - weights[0]*x1)/weights[1];
        let x2 = MAX_X;
        let y2 = (-weights[2] - weights[0]*x2)/weights[1];
        t_ctx.beginPath()
        t_ctx.moveTo(x1, y1);
        t_ctx.lineTo(x2, y2);
        t_ctx.stroke();

        // Draw the Perceptron
        p_ctx.beginPath()
        p_ctx.lineWidth = 2;
        p_ctx.moveTo(0,0);
        p_ctx.lineTo(MIN_X+75, MAX_Y-50);
        p_ctx.moveTo(0,0);
        p_ctx.lineTo(MIN_X+75, 0);
        p_ctx.moveTo(0,0);
        p_ctx.lineTo(MIN_X+75, MIN_Y+50);
        p_ctx.stroke();
        p_ctx.beginPath();
        p_ctx.fillStyle = "rgb(255, 255, 255)";
        p_ctx.moveTo(0,0);
        p_ctx.arc(0, 0, 30, 0, 2*Math.PI);
        p_ctx.fill();
        p_ctx.beginPath();
        p_ctx.arc(0, 0, 30, 0, 2*Math.PI);
        p_ctx.stroke();

        // Draw the weights
        p_ctx.save();
        p_ctx.scale(1, -1);
        p_ctx.font = '18px serif';
        p_ctx.fillStyle = 'rgb(0, 0, 0)';
        p_ctx.fillText(`X: ${perceptron.weights[0].toFixed(3)}`, MIN_X+75, MIN_Y+30);
        p_ctx.fillText(`Y: ${perceptron.weights[1].toFixed(3)}`, MIN_X+75, 30);
        p_ctx.fillText(`Bias: ${perceptron.weights[2].toFixed(3)}`, MIN_X+75, MAX_Y-20);
        p_ctx.restore();

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}