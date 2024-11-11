//Step One: What's the thing that's not working that you need to get working?
    //Ex: My color isn't shifting.
    //I need to see more red
//Step Two: What's controlling the thing that's not working?
    //Ex: My color is mapped to the spectrum (fft) values.
//Step Three: Create an element that controls the value of the color
    //Ex: hueRange  

//Step Four: Make sure you are setting the sensitivity values to the slider value in draw! 

// ---------------------------------------------------------------------------

// This program creates a few spheres that react to audio input from the microphone.
// The spheres change size, position, and color based on the frequency spectrum of the audio.

// Variables for audio input and analysis
let mic; // Microphone input
let fft; // Frequency analysis
let sensitivity = 0.5; // Sensitivity to volume changes
let sensitivitySlider; // Slider to adjust sensitivity
let alphaButton; // Button to toggle alpha
let hueRange = 180; // middle, so the slider can go both ways 0 - 360

let globeScale; // Scale factor for the globe

let sound; // Sound file
let showCube = false; // Flag to show cube
let alphaOn = true; // Flag to show alpha

// Arrays to store previous states for easing animations
let prevSizes = []; // Store previous sizes for easing
let prevZPositions = []; // Store previous z positions for easing
let noiseOffsets = []; // Different noise offsets for each sphere
let prevColors = []; // Store previous colors for easing
let positions = []; // Store positions for collision detection
let velocities = []; // Store velocities for smooth movement

// Preload the sound file
function preload() {
    sound = loadSound('olivaresdavid.wav');
}

// Setup function to initialize the canvas and audio input
function setup() {
    createCanvas(window.innerWidth, window.innerHeight, WEBGL); // Create a 3D canvas
    globeScale = min(width, height); // Set the scale based on the smaller dimension
    getAudioContext().suspend(); // Suspend the audio context until user interaction

    colorMode(HSB, 360, 100, 100, 1); // Use HSB color mode for easier color manipulation

    fft = new p5.FFT(); // Create a new FFT object for frequency analysis
    mic = new p5.AudioIn(); // Create a new AudioIn object for microphone input
    mic.start(); // Start the microphone
    fft.setInput(mic); // Set the microphone as the input for the FFT

    //sound.play(); // Play the sound file

    // Initialize arrays for easing and noise offsets
    for (let i = 0; i < 5; i++) { // Only 5 spheres for simplicity
        prevSizes.push(0); // Initialize previous sizes to 0
        prevZPositions.push(0); // Initialize previous z positions to 0
        noiseOffsets.push(random(1000)); // Initialize noise offsets with random values
        prevColors.push(color(0, 100, 100)); // Initialize with a default color
        positions.push(createVector(0, 0, 0)); // Initialize positions
        velocities.push(createVector(0, 0, 0)); // Initialize velocities
    }

    // Create a slider to adjust sensitivity
    sensitivitySlider = createSlider(0, 1, sensitivity, 0.01);
    sensitivitySlider.id('sensitivitySlider'); // Assign an ID to the slider

    hueSlider = createSlider(0, 360, hueRange, 1);
    hueSlider.id('hueSlider'); // Assign an ID to the slider

    alphaButton = createButton('Toggle Alpha');
    alphaButton.id('alphaButton');
    alphaButton.mousePressed(() => {
        alphaOn = !alphaOn;
    });
}

// Draw function to render the spheres on the canvas
function draw() {
    background(0); // Black background

    sensitivity = sensitivitySlider.value(); // Get the sensitivity value from the slider
    hueRange = hueSlider.value(); // Get the hue range value from the slider

    let spectrum = fft.analyze(); // Analyze the frequency spectrum

    for (let i = 0; i < 5; i++) { // Only 5 spheres for simplicity
        // Map the frequency spectrum to sphere size
        let targetSize = map(spectrum[i % spectrum.length], 0, 255, 10, 100 * sensitivity); // Adjusted max size to fit within canvas
        let sphereSize = lerp(prevSizes[i], targetSize, 0.1); // Easing with lerp
        prevSizes[i] = sphereSize; // Update previous size

        let scaleNum = globeScale * 0.005; // Scale factor for the sphere size

        // Map the grid position to canvas coordinates
        let posX = map(i, 0, 4, -width / 2 + sphereSize * scaleNum, width / 2 - sphereSize * scaleNum);
        let posY = 0; // Keep y position constant for simplicity

        // Get noise value for z position
        let noiseVal = noise(noiseOffsets[i] + frameCount * 0.01); // Get noise value
        let targetZ = map(noiseVal, 0, 1, -200, 200); // Constrained z position range
        let zPos = lerp(prevZPositions[i], targetZ, 0.1); // Easing with lerp
        prevZPositions[i] = zPos; // Update previous z position

        // Update position vector
        positions[i].set(posX, posY, zPos);

        noStroke(); // No outline for the spheres
        let targetHue = map(spectrum[i % spectrum.length], 0, 255, 0, hueRange); // Map spectrum to hue

        // LOGIC TO TOGGLE ALPHA
        let targetAlpha = alphaOn ? 0.4 : 1.0; // Set alpha based on alphaOn

        let targetColor = color(targetHue, 100, 80, targetAlpha); // Target color with appropriate alpha
        let sphereColor = lerpColor(prevColors[i], targetColor, 0.1); // Easing with lerpColor
        prevColors[i] = sphereColor; // Update previous color

        fill(sphereColor); // Transparent material with eased color
        directionalLight(targetHue, 100, 70, 0, 0, -1); // Add directional light

        push(); // Save the current transformation matrix
        translate(positions[i].x, positions[i].y, positions[i].z); // Move on x, y, and z axis
        rotateY(frameCount * 0.01); // Add rotation
        if (!showCube) {
            sphere(sphereSize * scaleNum); // Draw the sphere
        } else {
            box(sphereSize * scaleNum); // Draw the cube
        }
        setTimeout(() => {
            showCube = true;
        }, 60000); // Delay to prevent flickering

        pop(); // Restore the previous transformation matrix

        noiseOffsets[i] += 0.01; // Update noise offset
    }
}

// Function to resume audio context on mouse press
function mousePressed() {
    getAudioContext().resume();
}