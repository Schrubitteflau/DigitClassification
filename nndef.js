let layer_defs = [];
let data_augmentation = 24;
let img_size = 28;          // Dimensions d'une image en pixels (carrée)
let input_dim = Number.isInteger(data_augmentation) ? data_augmentation : img_size;
console.log("input_dim : " + input_dim);
layer_defs.push({type:'input', out_sx: input_dim, out_sy: input_dim, out_depth:1});
layer_defs.push({type:'conv', sx:5, filters:8, stride:1, pad:2, activation:'relu'});
layer_defs.push({type:'pool', sx:2, stride:2});
layer_defs.push({type:'conv', sx:5, filters:16, stride:1, pad:2, activation:'relu'});
layer_defs.push({type:'pool', sx:3, stride:3});
layer_defs.push({type:'softmax', num_classes:10});

let net = null, trainer = null;

function preprocessing_binary(sample)
{
    // On fait une copie de l'objet
    let s = { input: Object.assign([], sample.input), output: Object.assign([], sample.output) };
    
    for (let i = 0; i < s.input.length; i++)
    {
        s.input[i] = s.input[i] < 0.5 ? 0 : 1;
    }

    return s;
}

function no_preprocessing(sample)
{
    return sample;
}



initNN();

function initNN()
{
    net = new convnetjs.Net();
    net.makeLayers(layer_defs);

    trainer = new convnetjs.SGDTrainer(net, {method:'adadelta', batch_size:20, l2_decay:0.001});
}

function getLabel(sample)
{
    return sample.output.indexOf(1);
}

function getPrediction()
{
    return net.getPrediction();
}

function createVol(sample)
{
    // Volume (matrice) de dimensions (img_size * img_size * 1), initialisée à 0
    let vol = new convnetjs.Vol(img_size, img_size, 1, 0.0);

    vol.w = sample.input;

    if (Number.isInteger(data_augmentation))
    {
        vol = convnetjs.augment(vol, data_augmentation);
    }

    return vol;
}

function train(sample)
{
    let inputVol = createVol(sample);
    let y = getLabel(sample);

    inputVol.w = sample.input;

    return trainer.train(inputVol, y);
}

function predict(sample)
{
    let inputVol = createVol(sample);
    let y = getLabel(sample);

    inputVol.w = sample.input;

    // On n'obtient pas une réponse unique mais plutôt des probabilités : telle probabilité que ce soit la classe 0, 1, ... 9
    let prob = net.forward(inputVol);
    // On récupère la probabilité la plus grande
    let max = 0;
    for (let i = 1; i < prob.w.length; i++)
    {
        if (prob.w[i] > prob.w[max])
        {
            max = i;
        }
    }

    prob.expected = y;
    prob.predicted = max;

    return prob;
}