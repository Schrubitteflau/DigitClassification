// A faire : draw automatique sur la partie concernée lors d'un changement de valeur (set), éventuellement réglable avec un booléen autoDraw
// Probleme avec le return des callback utilisateur
// Apply filter : prend une matrice et applique le filtre en additionnant les valeurs
function DrawableCanvas(tx, ty, unitPx = 16)
{
    if (!new.target)
    {
        throw new TypeError("DrawableCanvas() must be called with `new`");
    }
    else if (!Number.isInteger(tx))
    {
        throw new TypeError("Missing parameter `tx` when calling drawableCanvas()");
    }
    else if (!Number.isInteger(ty))
    {
        throw new TypeError("Missing parameter `ty` when calling drawableCanvas()");
    }

    this.canvas = document.createElement("canvas");
    this.width = tx;
    this.height = ty;
    this.unitPx = unitPx;

    this.canvas.width = tx * unitPx;
    this.canvas.height = ty * unitPx;

    this.context = this.canvas.getContext("2d");

    this.data = [];

    this.clear();
}

// Permet de récupérer la valeur voulue dans la matrice data
DrawableCanvas.prototype.get = function(x, y)
{
    return this.data[x][y];
}

// Permet de modifier la valeur voulue dans la matrice data
DrawableCanvas.prototype.set = function(x, y, value)
{
    if (value > 1)
    {
        value = 1;
    }
    else if (value < 0)
    {
        value = 0;
    }

    this.data[x][y] = value;
}

// Permet de récupérer la valeur voulue dans la matrice data, à partir des coordonées x et y
DrawableCanvas.prototype.at = function(x, y)
{
    let realX = Math.floor(x / this.unitPx);
    let realY = Math.floor(y / this.unitPx);

    return { x: realX, y: realY, value: this.get(realX, realY) };
}

// Affiche le rectangle correspondant au point de la matrice
DrawableCanvas.prototype.draw = function(x, y)
{
    let c = this.data[x][y] * 255;

    this.context.fillStyle = `rgb(${c},${c},${c})`;
    this.context.fillRect(x * this.unitPx, y * this.unitPx, this.unitPx, this.unitPx);
}

// Rafraîchis tout le canvas
DrawableCanvas.prototype.drawAll = function()
{
    for (let x = 0; x < this.width; x++)
    {
        for (let y = 0; y < this.height; y++)
        {
            this.draw(x, y);
        }
    }
}

// Ajoute le canvas au DOM
DrawableCanvas.prototype.appendTo = function(parentNode)
{
    if (!parentNode instanceof HTMLElement)
    {
        throw new TypeError("`parentNode` must be an instance of HTMLElement");
    }

    parentNode.appendChild(this.canvas);

    return this.canvas;
}

DrawableCanvas.prototype.addEvent = function(type, callback)
{
    let that = this;

    if (type === "mousepressed")
    {
        return new MousePressedEvent(this.canvas, callback);
    }
    else
    {
        let f = function(e) { callback.call(that, e); };

        this.canvas.addEventListener(type, f);

        // If the programer wants to use removeEventListener()
        return f;
    }
}

DrawableCanvas.prototype.disableRightClick = function()
{
    this.canvas.oncontextmenu = function() { return false; }
}

DrawableCanvas.prototype.clear = function()
{
    for (let x = 0; x < this.width; x++)
    {
        this.data[x] = [];
        for (let y = 0; y < this.height; y++)
        {
            this.data[x][y] = 0;
        }
    }
}

DrawableCanvas.prototype.toArray = function()
{
    let output = [];

    for (let x = 0; x < this.width; x++)
    {
        for (let j = 0; j < this.height; j++)
        {
            output.push(this.data[x][j]);
        }
    }

    return output;
}

DrawableCanvas.prototype.fromArray = function(arr)
{
    if (arr.length !== this.width * this.height)
    {
        throw new Error("Invalid size");
    }

    for (let i = 0; i < this.height; i++)
    {
        for (let j = 0; j < this.width; j++)
        {
            this.set(i, j, arr[j * this.height + i]);
        }
    }
}

// Code très sale pour obtenir les données dans le bon format pour la prédiction
DrawableCanvas.prototype.toSample = function()
{
    let inputSample = [];
    let arr = this.toArray();
    let arr2 = [];

    for (let i = 0; i < this.height; i++)
    {
        arr2[i] = [];
    }


    for (let i = 0; i < this.height; i++)
    {
        for (let j = 0; j < this.width; j++)
        {
            arr2[i][j] = arr[j * this.height + i];
        }
    }

    for (let a of arr2)
    {
        for (let v of a)
        {
            inputSample.push(v);
        }
    }

    return { input: inputSample, output: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] };
}

// Additionne les valeurs de la matrice, en prenant pour centre la position (x, y)
// La matrice doit avoir la même taille en hauteur et en largeur, et cette taille doit être impaire (à partir de 3)
DrawableCanvas.prototype.apply = function(x, y, matrix)
{
    let wSize = matrix[0].length;
    let hSize = matrix.length;
    let middleY = (matrix.length - 1) / 2;
    let middleX = (matrix[0].length - 1) / 2;

    // Pas réelle de vérification du format de la matrice car ça rendrait le code lourd (tous les niveaux sont de la même taille etc)
    if (!Number.isInteger(middleX) || !Number.isInteger(middleY))
    {
        throw new Error("Matrice incorrecte");
    }


    // x réel : x + paddingX (this.data)
    // y réel : y + paddingY (this.data)

    // x dans la matrice : paddingX
    // y dans la matrice : paddingY
    for (let paddingY = 0; paddingY + middleY > -1 && y + paddingY > -1 && y + paddingY < this.height; paddingY--)
    {
        for (let paddingX = 0; paddingX + middleX > -1 && x + paddingX > -1; paddingX--)
        {
            let v = this.data[x + paddingX][y + paddingY];
            this.set(x + paddingX, y + paddingY, v + matrix[paddingY + middleY][paddingX + middleX]);
        }

        for (let paddingX = 1; paddingX + middleX < wSize && x + paddingX < this.width; paddingX++)
        {
            let v = this.data[x + paddingX][y + paddingY];
            this.set(x + paddingX, y + paddingY, v + matrix[paddingY + middleY][paddingX + middleX]);
        }
    }

    for (let paddingY = 1; paddingY + middleY < hSize && y + paddingY < this.height && y + paddingY > -1; paddingY++)
    {
        for (let paddingX = 0; paddingX + middleX > -1 && x + paddingX > -1; paddingX--)
        {
            let v = this.data[x + paddingX][y + paddingY];
            this.set(x + paddingX, y + paddingY, v + matrix[paddingY + middleY][paddingX + middleX]);
        }

        for (let paddingX = 1; paddingX + middleX < wSize && x + paddingX < this.width; paddingX++)
        {
            let v = this.data[x + paddingX][y + paddingY];
            this.set(x + paddingX, y + paddingY, v + matrix[paddingY + middleY][paddingX + middleX]);
        }
    }
}


// Le mieux serait qu'un évènement soit déclenché en permanence, et pas uniquement lorsque la souris bouge, mais cela convient ici
// Mais aussi passer le this en evènement : function(e){} où e contiendrait l'évènement généré par le navigateur, mais aussi this
// Déclencher evènement avec requestAnimationFrame() et le remplir en instanciant un new MouseEvent() en mettant tout ce qu'il faut dedans
function MousePressedEvent(element, callback)
{
    if (!new.target)
    {
        throw new TypeError("MousePressedEvent() must be called with `new`");
    }
    else if (!element instanceof HTMLElement)
    {
        throw new TypeError("`element` must be an instance of HTMLElement")
    }
    else if (!callback instanceof Function)
    {
        throw new TypeError("`callback` must be an instance of Function");
    }

    this.isMousePressed = false;

    this.mouseDownCallback = null;
    this.mouseUpCallback = null;
    this.mouseMoveCallback = null;
    this.mouseLeaveCallback = null;

    this.currentEvent = null;
    this.mousePressedCallback = callback;

    this.element = element;

    this.init();
}

MousePressedEvent.prototype.init = function()
{
    let that = this;

    this.mouseDownCallback = function(e)
    {
        that.currentEvent = e;
        that.isMousePressed = true;
        that.mousePressedCallback.call(that.element, e);
    }

    this.mouseUpCallback = function()
    {
        that.currentEvent = null;
        that.isMousePressed = false;
    }

    this.mouseMoveCallback = function(e)
    {
        if (that.isMousePressed)
        {
            that.currentEvent = e;
            that.mousePressedCallback.call(that.element, e);
        }
    }

    this.mouseLeaveCallback = function()
    {
        that.currentEvent = null;
        that.isMousePressed = false;
    }

    this.element.addEventListener("mousedown", this.mouseDownCallback);
    this.element.addEventListener("mouseup", this.mouseUpCallback);
    this.element.addEventListener("mousemove", this.mouseMoveCallback);
    this.element.addEventListener("mouseleave", this.mouseLeaveCallback);
}

MousePressedEvent.prototype.destroy = function()
{
    this.element.removeEventListener("mousedown", this.mouseDownCallback);
    this.element.removeEventListener("mouseup", this.mouseUpCallback);
    this.element.removeEventListener("mousemove", this.mouseMoveCallback);
    this.element.removeEventListener("mouseleave", this.mouseLeaveCallback);

    this.isMousePressed = false;

    this.mouseDownCallback = null;
    this.mouseUpCallback = null;
    this.mouseMoveCallback = null;
    this.mouseLeaveCallback = null;

    this.currentEvent = null;
}

MousePressedEvent.prototype.getRelativePositions = function()
{
    if (this.isMousePressed === false || this.currentEvent === null)
    {
        return null;
    }

    let rect = this.element.getBoundingClientRect();

    return { x: Math.floor(this.currentEvent.clientX - rect.left), y: Math.floor(this.currentEvent.clientY - rect.top) };
}