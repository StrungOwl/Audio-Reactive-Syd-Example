// This program creates a grid of spheres that react to audio input from the microphone.
// The spheres change size, position, and color based on the frequency spectrum of the audio.

// Variables for audio input and analysis
let mic; // Microphone input
let vol; // Volume or amplitude
let fft; // Frequency analysis
let sensitivity = 0.5; // Sensitivity to volume changes
let sensitivitySlider; // Slider to adjust sensitivity
let alphaButton;
let hueRange = 180; // middle, so the slider can go both ways 0 - 360

let globeScale; // Scale factor for the globe

let sound; // Sound file
let soundOn = false; // Flag to check if sound is playing

let h = 0; //background hue
let showCube = false; // Flag to show cube
let alphaOn = true; // Flag to show alpha

// Grid settings
let gridCols = 10; // Number of columns in the grid
let gridRows = 10; // Number of rows in the grid

// Arrays to store previous states for easing animations
let prevSizes = []; // Store previous sizes for easing
let prevZPositions = []; // Store previous z positions for easing
let noiseOffsets = []; // Different noise offsets for each sphere
let prevColors = []; // Store previous colors for easing
let positions = []; // Store positions for collision detection
let velocities = []; // Store velocities for smooth movement

//Textures
let imgArray = [];
let ranTextIndex = 0;

// Preload the sound file
function preload() {
    sound = loadSound('olivaresdavid.wav');
    for (let i = 0; i < 6; i++) {
        imgArray[i] = loadImage(`Sphere Texture/${i}.png`);
    }
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
    for (let i = 0; i < gridCols * gridRows; i++) {
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

    gridColSlider = createSlider(1, 10, 5, 1);
    gridColSlider.id('gridColSlider'); // Assign an ID to the slider
    gridRowsSlider = createSlider(1, 10, 5, 1);
    gridRowsSlider.id('gridRowsSlider'); // Assign an ID to the slider

    alphaButton = createButton('Toggle Alpha');
    alphaButton.id('alphaButton');
    alphaButton.mousePressed(() => {
        alphaOn = !alphaOn;
    });

    texButton = createButton('Random\nTexture');
    texButton.id('texButton');
    texButton.mousePressed(() => {
        ranTextIndex = Math.floor(random(0, 6));
    });
}

// Draw function to render the spheres on the canvas
function draw() {

    background(h, 67, 50, 10); // Semi-transparent background for tracers
    h = (h + 0.1) % 360; // Update background hue

    //SET SLIDER VALUES
    sensitivity = sensitivitySlider.value(); // Get the sensitivity value from the slider
    hueRange = hueSlider.value(); // Get the hue range value from the slider
    gridCols = gridColSlider.value();
    gridRows = gridRowsSlider.value();

    let spectrum = fft.analyze(); // Analyze the frequency spectrum

    let index = 0; // Index to keep track of the current sphere
    for (let y = 0; y < gridRows; y++) {
        for (let x = 0; x < gridCols; x++) {
            // Map the frequency spectrum to sphere size
            let targetSize = map(spectrum[index % spectrum.length], 0, 255, 10, 100 * sensitivity); // Adjusted max size to fit within canvas
            let sphereSize = lerp(prevSizes[index], targetSize, 0.1); // Easing with lerp
            prevSizes[index] = sphereSize; // Update previous size

            let scaleNum = globeScale * 0.005; // Scale factor for the sphere size

            // Map the grid position to canvas coordinates
            let posX = map(x, 0, gridCols - 1, -width / 2 + sphereSize * scaleNum, width / 2 - sphereSize * scaleNum);
            let posY = map(y, 0, gridRows - 1, -height / 2 + sphereSize * scaleNum, height / 2 - sphereSize * scaleNum);

            // Get noise value for z position
            let noiseVal = noise(noiseOffsets[index] + frameCount * 0.01); // Get noise value
            let targetZ = map(noiseVal, 0, 1, -200, 200); // Constrained z position range
            let zPos = lerp(prevZPositions[index], targetZ, 0.1); // Easing with lerp
            prevZPositions[index] = zPos; // Update previous z position

            // Update position vector
            positions[index].set(posX, posY, zPos);

            // Collision detection and resolution
            for (let j = 0; j < index; j++) {
                let distance = positions[index].dist(positions[j]); // Calculate distance between spheres
                let minDist = (sphereSize + prevSizes[j]) * scaleNum; // Minimum distance to avoid overlap
                if (distance < minDist) {
                    let overlap = minDist - distance; // Calculate overlap
                    let direction = p5.Vector.sub(positions[index], positions[j]).normalize(); // Direction of the force
                    let force = direction.mult(overlap * 0.05); // Apply a small force
                    velocities[index].add(force); // Add force to velocity
                    velocities[j].sub(force); // Subtract force from the other sphere's velocity
                }
            }

            // Apply velocities to positions
            positions[index].add(velocities[index]);
            velocities[index].mult(0.9); // Dampen velocities for smooth movement

            noStroke(); // No outline for the spheres
            let targetHue = map(spectrum[index % spectrum.length], 0, 255, 0, hueRange); // Map spectrum to hue

            //LOGIC TO TOGGLE ALPHA---------------------
            let targetAlpha = alphaOn ? 0.2 : 1.0; // Set alpha based on alphaOn



            let targetColor = color(targetHue, 100, 80, targetAlpha); // Target color with appropriate alpha
            let sphereColor = lerpColor(prevColors[index], targetColor, 0.1); // Easing with lerpColor
            prevColors[index] = sphereColor; // Update previous color

            //SET TEXTURE
            tint(sphereColor, targetAlpha);
            texture(imgArray[ranTextIndex]);
            //fill(sphereColor); // Transparent material with eased color
            directionalLight(targetHue, 100, 70, 0, 0, -1); // Add directional light

            push(); // Save the current transformation matrix
            translate(positions[index].x, positions[index].y, positions[index].z); // Move on x, y, and z axis
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

            noiseOffsets[index] += 0.01; // Update noise offset
            index++; // Move to the next sphere
        }
    }

    //blendMode(SCREEN); // Set blend mode to soft light
    //console.log(ranTextIndex);

}

// Function to resume audio context on mouse press
function mousePressed() {
    getAudioContext().resume();
}