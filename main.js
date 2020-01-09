let trainingAmount = 50000;  // Nombre d'images à charger pour l'entraînement du réseau de neurones
let testAmount = 2000;      // Nombre d'images à charger pour tester le réseau de neurones

// Récupération d'un set d'images
let set = mnist.set(trainingAmount, testAmount);


// Les données dans trainingSet et testSet sont différentes et dans un ordre aléatoire : prêt pour la phase d'entraînement et les tests
let trainingSet = set.training;
let testSet = set.test;

let trainingIteration = -1;
let testIteration = -1;

let preprocessing = no_preprocessing;
document.getElementById("noPreprocessingRadio").checked = true;


function getTestingSample()
{
    testIteration++;

    if (testIteration >= testSet.length)
    {
        return pre_processing(testSet[Math.floor(Math.random() * testSet.length)]);
    }

    return preprocessing(testSet[testIteration]);
}

function getTrainingSample()
{
    trainingIteration++;

    if (trainingIteration >= trainingSet.length)
    {
        return pre_processing(trainingSet[Math.floor(Math.random() * trainingSet.length)]);
    }
    
    return preprocessing(trainingSet[trainingIteration]);
}


let drawable = new DrawableCanvas(28, 28);
drawable.disableRightClick();
drawable.appendTo(document.getElementById("drawableCanvas"));
drawable.drawAll();

document.getElementById("clearDrawableCanvas").addEventListener("click", function()
{
    drawable.clear();
    drawable.drawAll();
});

document.getElementById("predictDrawableCanvas").addEventListener("click", function()
{
    let sample = drawable.toSample();
    let prediction = predict(sample);
    let predictedDrawableDigitElt = document.getElementById("predictedDrawableDigit");

    console.log("Prédiction chiffre dessiné : ", prediction);

    predictedDrawableDigitElt.innerText = "";

    for (let i = 0; i < prediction.w.length; i++)
    {
        let max = Math.max(...prediction.w);
        let index = prediction.w.indexOf(max);

        predictedDrawableDigitElt.innerText += "Chiffre : " + index + ", probabilité : " + max + "\n";
        prediction.w[index] = -1;
    }
});

function areArrayEqual(arr1, arr2)
{
    if (arr1.length !== arr2.length)
    {
        throw new Error("Size of arr1 and arr2 are not equal");
    }

    for (let i = 0; i < arr1.length; i++)
    {
        if (arr1[i] !== arr2[i])
        {
            return i;
        }
    }

    return -1;
}

function changeFilter(n)
{
    drawFilter = filters[n];
}

let filters = [
    [ [ 0.25, 0.5, 0.25 ], [ 0.5, 1, 0.5 ], [ 0.25, 0.5, 0.25 ] ],
    [ [ 0, 0, 0 ], [ 0, 0.2, 0.33 ], [ 0, 0.33, 1 ] ],
    [ [ 0, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 0 ] ],
    [ [ 0, 1, 0 ], [ 1, 1, 1 ], [ 0, 1, 0 ] ]
];

let drawFilter = filters[0];
let eraseFilter = [ [ -1, -1, -1], [ -1, -1, -1 ], [ -1, -1, -1 ] ];
let lastX = -1, lastY = -1;

let mousePressedEvent = drawable.addEvent("mousepressed", function(e)
{
    let coords = mousePressedEvent.getRelativePositions();
    let box = drawable.at(coords.x, coords.y);
    let _x = box.x, _y = box.y;

    if (lastX !== _x || lastY !== _y)
    {
        lastX = _x;
        lastY = _y;

        // Clic gauche
        if (e.buttons === 1)
        {
            drawable.apply(_x, _y, drawFilter);
        }
        // Clic droit
        else if (e.buttons === 2)
        {
            drawable.apply(_x, _y, eraseFilter);
        }

        drawable.drawAll();
    }
});