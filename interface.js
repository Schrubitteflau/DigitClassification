let autoButton = document.getElementById("autoButton");
let autoNumberInput = document.getElementById("autoNumber");
let progressBar = document.getElementById("currentProgress");
let status = document.getElementById("status");
let trainingRadio = document.getElementById("modeTraining");
let testingRadio = document.getElementById("modeTesting");
let singleTestingButton = document.getElementById("singleTesting");
let doneTrainingsElt = document.getElementById("doneTrainings");
let doneTestsElt = document.getElementById("doneTests");
let successfulTestsElt = document.getElementById("successfulTests");
let missedTestsElt = document.getElementById("missedTests");
let testRatioElt = document.getElementById("testRatio");
let resetStatsButton = document.getElementById("resetStats");
let accuracyElt = document.getElementById("accuracy");
let singleTestingCanvas = document.getElementById("singleTestingDigit");
let singleTestingRedimCanvas = document.getElementById("redimTestingDigit");

// Vaut true si on est en train d'effectuer une série d'entraînement ou de tests
let isWorking = false;
let progression = 0;
let workingCount = 0;
let mode = "training";

let currentTestingSample = null;

let successfulTests = 0;
let missedTests = 0;
let doneTrainings = 0;
let goodPredictions = 0;

trainingRadio.checked = true;

Object.defineProperty(window, "autoNumber", { get: () => parseInt(autoNumberInput.value, 10) });


function work()
{
    if (mode === "training")
    {
        let sample = getTrainingSample();
        let ret = train(sample);

        if (getLabel(sample) === getPrediction())
        {
            goodPredictions++;
        }

        doneTrainings++;

        return ret;
    }
    else if (mode === "testing")
    {
        let sample = getTestingSample();
        let ret = predict(sample);

        if (ret.predicted === ret.expected)
        {
            successfulTests++;
        }
        else
        {
            missedTests++;
        }

        return ret;
    }
}

function refreshDOM()
{
    progressBar.value = progression;
    progressBar.innerText = progression + "%";

    doneTrainingsElt.innerText = doneTrainings;
    accuracyElt.innerText = doneTrainings > 0 ? goodPredictions / doneTrainings : "-";

    doneTestsElt.innerText = successfulTests + missedTests;
    successfulTestsElt.innerText = successfulTests;
    missedTestsElt.innerText = missedTests;
    testRatioElt.innerText = (successfulTests + missedTests === 0 ? "-" : successfulTests / (successfulTests + missedTests));

    if (isWorking)
    {
        if (mode === "training")
        {
            if (progression === 0)
            {
                status.innerText = workingCount + " entraînements en cours...";
            }
            else if (progression === 100)
            {
                status.innerText = workingCount + " entraînements terminés";
            }
            
        }
        else if (mode === "testing" && isWorking)
        {
            if (progression === 0)
            {
                status.innerText = workingCount + " tests en cours...";
            }
            else if (progression === 100)
            {
                status.innerText = workingCount  + " tests terminés";
            }
        }
    }
}

autoButton.addEventListener("click", function()
{
    if (isWorking)
        return;

    isWorking = true;
    workingCount = autoNumber;

    for (let i = 0; i < workingCount; i++)
    {
        let stats = work();

        progression = (i + 1) / workingCount * 100;

        refreshDOM();
    }

    workingCount = 0;
    progression = 0;
    isWorking = false;
});

trainingRadio.addEventListener("click", function()
{
    mode = "training";
    autoButton.value = "Entraîner";
});

testingRadio.addEventListener("click", function()
{
    mode = "testing";
    autoButton.value = "Tester";
});

resetStatsButton.addEventListener("click", function()
{
    successfulTests = 0;
    missedTests = 0;
    doneTrainings = 0;
    goodPredictions = 0;

    refreshDOM();
});

singleTestingButton.addEventListener("click", function()
{
    currentTestingSample = getTestingSample();
    let prediction = predict(currentTestingSample);

    mnist.draw(currentTestingSample.input, singleTestingCanvas.getContext("2d"));

    document.getElementById("singleTestingPrediction").innerText = prediction.predicted;
    document.getElementById("singleTestingExpected").innerText = prediction.expected;
});

singleTestingCanvas.addEventListener("mouseenter", function()
{
    singleTestingRedimCanvas.getContext("2d").drawImage(this, 0, 0, 500, 500);

    singleTestingRedimCanvas.style.display = "block";
});

singleTestingCanvas.addEventListener("mouseleave", function()
{
    singleTestingRedimCanvas.style.display = "none";
});

document.getElementById("transferToDrawable").addEventListener("click", function()
{
    console.log("Transfert du sample de test simple vers le canvas de dessin...");

    drawable.fromArray(currentTestingSample.input);

    drawable.drawAll();
});