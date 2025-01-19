/**
 * PSEUDO-SCALE TASK
 */
const GLOBAL_OPTS = {
    stimLengthMs : 200,
    rampLengthMs : 10,
    refFreqHz : 400,
    pCatchTrial : 0.1,
    lambdaLims : [50, 200],
    betaLims : [0.75, 1.5],
    maxValLims : [8, 12]
}

class Utils{
    /**
     * 
     * @param {String} filename 
     * @param {PseudoScaleTask[]} experimentArray 
     * @param {HTMLElement} elementToAppendTo
     */
    static writeData(filename, experimentArray, elementToAppendTo){
        let stringToSave = "expId s r c lambda beta maxVal\n";

        for(let i = 0; i < experimentArray.length; i++){
            for(let j = 0; j < experimentArray[i].s.length; j++){
                // TODO: Check that all the arrays are of the same length!
                let curString = `${i} ${experimentArray[i].s[j]} ` +
                `${experimentArray[i].r[j]} ${experimentArray[i].c[j]} ` +
                `${experimentArray[i].lambdaPx} ${experimentArray[i].beta} ` +
                `${experimentArray[i].maxVal}\n`;

                stringToSave += curString;
            }
        }

        let fileURL = URL.createObjectURL(new Blob([stringToSave]));
        let fileLink = document.createElement("a");
        fileLink.download = filename;
        fileLink.href = fileURL;

        elementToAppendTo.appendChild(fileLink);
        fileLink.click();
    }

    /**
     * A convenience function for creating SVG elements.
     * 
     * Create them by giving the type of the element
     * and then an object of attribute names and values. 
     * 
     * Returns the SVG object.
     * 
     * @param {String} elementType 
     * @param {Object} attributes 
     * @returns 
     */
    static createSVGElement(elementType, attributes){
        let newEl = document.createElementNS(
            "http://www.w3.org/2000/svg", elementType);
    
        if(attributes != null){
            let attrArray = Object.entries(attributes);
    
            for(let i = 0; i < attrArray.length; i++){
                if(attrArray[i][0] === "textContent"){
                    newEl.textContent = attrArray[i][1];
                } else {
                    newEl.setAttribute(attrArray[i][0], attrArray[i][1]);
                }
            }
        }
    
        return newEl;
    }
}

class SineWaveTools{
 
    /**
     * 
     *  Generates a sine wave with the given frequency and other parameters. 
     *  Note that the length is indeed given in samples. Phase is given in 
     *  radians.
     * 
     * @param {Object} pars  
     * @param {Number} pars.freq Frequency (Hz) 
     * @param {Number} pars.durationSamples 
     * @param {Number} pars.amplitude Between 0 and 1
     * @param {Number} pars.sampleRate 
     * @param {Number} pars.phase In radians; can be omitted
     * @returns Float32Array of samples.
     */
    static generateSine(pars){

        if(pars.phase === undefined) pars.phase = 0;

        let x = new Float32Array(pars.durationSamples);

        let stepSize = (pars.durationSamples / pars.sampleRate) / x.length;
        
        for(let i = 0; i < x.length; i++){
            x[i] = Math.sin(2 * Math.PI * (i * stepSize) * 
                pars.freq + pars.phase) * pars.amplitude;
        }
        
        return x;    
    }

    /**
     * Creates a linear sequence of numbers from 0 to 1.
     * @param {Number} length 
     * @returns Array of numbers from 0 to 1
     */
    static createLinearRamp(length){
        let ramp = new Float32Array(length);
        let stepSize = 1.0 / (length - 1);
        
        for(let i = 0; i < length; i++){
            ramp[i] = i * stepSize;
        }
        
        return ramp;
    }

    /**
     * Creates an envelope that spans the length of the signal. 
     * Uses the supplied ramp function to create a sequence of
     * numbers from 0 to 1 which is used to raise the signal level
     * to 1 in the beginning and then lower it back to 0 in the end.
     * You can use the createLinearRamp function above.
     * @param {Number} lengthOfRamp 
     * @param {Number} lengthOfSignal 
     * @param {Function} rampFunction 
     * @returns The envelope
     */
    static createEnvelope(lengthOfRamp, lengthOfSignal, rampFunction){
        if(lengthOfSignal < (lengthOfRamp * 2)) {
            throw "Error in creating envelope: Length of ramps exceeds length of signal";
        }

        let start = rampFunction(lengthOfRamp);
        let end = new Float32Array(start);
        end.reverse();
        
        let middle = new Float32Array(lengthOfSignal - lengthOfRamp * 2).fill(1);
        
        return new Float32Array([...start, ...middle, ...end]);
    }

    /**
     * Elementwise summation of two vectors. If one of the
     * vectors is shorter, it's begun again from the start 
     * @param {Float32Array} v1 
     * @param {Float32Array} v2 
     * @returns Float32Array
     */
    static sumFloat32Arrays(v1, v2){
        let v3;

        if(v1.length > v2.length){
            v3 = new Float32Array(v1.length);
            
            for(let i = 0; i < v1.length; i++){
                v3[i] = v1[i] + v2[i % v2.length];
            }
        } else if(v1.length < v2.length){
            v3 = new Float32Array(v2.length);
            
            for(let i = 0; i < v2.length; i++){
                v3[i] = v1[i % v1.length] + v2[i];
            }
        } else{
            v3 = new Float32Array(v2.length);
            
            for(let i = 0; i < v2.length; i++){
                v3[i] = v1[i] + v2[i];
            }       
        }

        return(v3);
    }

    /**
     * Elementwise multiplication of two vectors. If one of the
     * vectors is shorter, it's begun again from the start
     * @param {Float32Array} v1 
     * @param {Float32Array} v2 
     * @returns Float32Array
     */
    static multiplyFloat32Arrays(v1, v2){
        let v3;

        if(v1.length > v2.length){
            v3 = new Float32Array(v1.length);
            
            for(let i = 0; i < v1.length; i++){
                v3[i] = v1[i] * v2[i % v2.length];
            }
        } else if(v1.length < v2.length){
            v3 = new Float32Array(v2.length);
            
            for(let i = 0; i < v2.length; i++){
                v3[i] = v1[i % v1.length] * v2[i];
            }
        } else{
            v3 = new Float32Array(v2.length);
            
            for(let i = 0; i < v2.length; i++){
                v3[i] = v1[i] * v2[i];
            }       
        }

        return(v3);
    }

    /**
     * A convenience function for playing buffered sounds
     * @param {Float32Array} samples 
     * @param {AudioContext} audioCtx 
     */
    static playBufferedSound(samples, audioCtx){
        let source = audioCtx.createBufferSource();    
        let buffer = audioCtx.createBuffer(1, samples.length, audioCtx.sampleRate);
            
        buffer.copyToChannel(samples, 0);     
        source.loop   = false;  
        source.buffer = buffer;
            
        source.connect(audioCtx.destination);
            
        source.start(0);
    }

    static appendFloat32Arrays(a1, a2){
        let final = new Float32Array(a1.length + a2.length);

        for(let i = 0; i < a1.length; i++){
            final[i] = a1[i];
        }

        for(let i = 0; i < a2.length; i++){
            final[i + a1.length - 1] = a2[i];
        }

        return final;
    }
}

/**
 * The PseudoScaleTest class dispatches "stimulus" events which
 * this catches and manifests into actual sounds.
 */
class StimulusPlayer{
    constructor(){
        this.audioCtx = new AudioContext();
        this.stimLengthSamples = Math.round(
            this.audioCtx.sampleRate * (GLOBAL_OPTS.stimLengthMs / 1000));
        this.rampLengthSamples = Math.round(
            this.audioCtx.sampleRate * (GLOBAL_OPTS.rampLengthMs / 1000));
        
        window.addEventListener("stimulus", e => this.playStimulus(e));
    }

    playStimulus(e){
        let envelope = SineWaveTools.createEnvelope(
            this.rampLengthSamples, 
            this.stimLengthSamples,
            SineWaveTools.createLinearRamp
        );

        let testTone = SineWaveTools.generateSine({
            freq : GLOBAL_OPTS.refFreqHz + e.detail,
            durationSamples : this.stimLengthSamples,
            amplitude : 0.5,
            sampleRate : this.audioCtx.sampleRate,
            phase : 0.0
        });

        let refTone = SineWaveTools.generateSine({
            freq : GLOBAL_OPTS.refFreqHz,
            durationSamples : this.stimLengthSamples,
            amplitude : 0.5,
            sampleRate : this.audioCtx.sampleRate,
            phase : 0.0
        });

        testTone = SineWaveTools.multiplyFloat32Arrays(testTone, envelope);
        refTone  = SineWaveTools.multiplyFloat32Arrays(refTone, envelope);

        SineWaveTools.playBufferedSound(
            SineWaveTools.appendFloat32Arrays(refTone, testTone), this.audioCtx);
    }
}


/**
 * - Creates DOM elements
 * - Initiates event listeners 
 * - Stores data
 * 
 */
class PseudoScaleTask{
    constructor(){
        this.svgElement = document.createElementNS(
            "http://www.w3.org/2000/svg", "svg");

        /* bgGroup  : pitch text, visual criterion
           dotGroup : stimulus dots
           respBoxGroup : this is the Yes/No box for giving responses
         */
        this.bgGroup      = Utils.createSVGElement("g");
        this.dotGroup     = Utils.createSVGElement("g");
        this.respBoxGroup = Utils.createSVGElement("g");

        this.svgElement.replaceChildren(this.bgGroup, this.dotGroup, this.respBoxGroup);

        // A shitty pseudo-enum:
        this.states = {
            waitingForResponse : "waitingForResponse",
            playingStimulus    : "playingStimulus",
            waitingForClick    : "waitingForClick"
        }
    }

    initialize(){
        this.initializeDOMElements();
        this.initializeExperiment();
    }

    initializeExperiment(){
        this.curTrial = 0;

        this.s = new Array();
        this.r = new Array();
        this.c = new Array();

        this.lambdaPx = Math.random() * 
            (GLOBAL_OPTS.lambdaLims[1] - GLOBAL_OPTS.lambdaLims[0]) +
            GLOBAL_OPTS.lambdaLims[0];

        this.beta = Math.random() * 
            (GLOBAL_OPTS.betaLims[1] - GLOBAL_OPTS.betaLims[0]) + 
            GLOBAL_OPTS.betaLims[0];

        this.maxVal = Math.random() * 
            (GLOBAL_OPTS.maxValLims[1] - GLOBAL_OPTS.maxValLims[0]) + 
            GLOBAL_OPTS.maxValLims[0];
    }

    initializeDOMElements(){
        this.svgElement.style.height = document.body.clientHeight - 
            this.svgElement.getBoundingClientRect().y - 10;
            // That -10 is included since otherwise the calculated
            // value is too large. Oh woe...

        this.widthPx  = this.svgElement.getBoundingClientRect().width;
        this.heightPx = this.svgElement.getBoundingClientRect().height;

        let dirArrow = Utils.createSVGElement("text", 
            {
                "textContent" : "pitch🢂",
                "transform" : `rotate(270 ${this.widthPx/2} ${this.heightPx/1.15})`,
                "x" : this.widthPx/2,
                "y" : this.heightPx/1.15,
                "font-size" : "80",
                "letter-spacing"  : "30",
                "opacity"  : "0.2",
                "dominant-baseline" : "middle",
                "font-variant" : "small-caps"
            }
        );

        this.bgGroup.appendChild(dirArrow);

        //

        this.visualCriterion = Utils.createSVGElement("line",
            {
                "x1" : 0,
                "x2" : this.widthPx,
                "y1" : 100, 
                "y2" : 100,
                "stroke" : "crimson",
                "stroke-width" : "5"
            }
        );

        this.visualCriterion.addEventListener("mouseenter", () => {
            if(this.dragging) return;
            document.documentElement.style.cursor = "grab";
        });

        this.visualCriterion.addEventListener("mouseleave", () => {
            if(this.dragging) return;
            document.documentElement.style.cursor = "default";
        });

        this.visualCriterion.addEventListener("mousedown", () => {
            if(this.state != this.states.waitingForClick) return;
                this.elementToDrag = this.visualCriterion;
                document.documentElement.style.cursor = "grabbing";
            });

        this.bgGroup.appendChild(this.visualCriterion);

        this.mouseDown = false;
        this.dragging  = false;
        this.elementToDrag = -1;

        this.svgElement.addEventListener("mousedown", 
            e => this.handleMouseDown(e));
        this.svgElement.addEventListener("mouseup",   
            e => this.handleMouseUp(e));
        this.svgElement.addEventListener("mousemove", 
            e => this.handleMouseMove(e));

        this.state = this.states.waitingForClick;
    }

    handleMouseDown(e){
        if(this.state != this.states.waitingForClick) return;

        this.mouseDown = true;
    }

    handleMouseUp(e){
        if(this.state != this.states.waitingForClick) return;
        
        if(this.dragging){
            this.saveCriterion();
        } else{
            this.state = this.states.playingStimulus;
            this.dispatchStimulusEvent(e);

            let coords = this.calibrateCoords(
                {
                    x : e.clientX,
                    y : e.clientY
                });
            
            let newDot = Utils.createSVGElement("circle", 
                {
                    cx : coords.x,
                    cy : coords.y,
                    fill : "black",
                    stroke : "black",
                    r : 5
                }
            );
    
            this.dotGroup.appendChild(newDot);
    
            setTimeout(() => {
                this.state = this.states.waitingForResponse;
    
                this.displayResponseBox({
                    x : coords.x,
                    y : coords.y
                });
            }, GLOBAL_OPTS.stimLengthMs * 2);
        }

        this.mouseDown = false;
        this.dragging  = false;
        document.documentElement.style.cursor = "default";
        this.elementToDrag = -1;
    }

    handleMouseMove(e){
        if(this.state === this.states.waitingForClick)

        if(this.mouseDown){
            this.dragging = true;
        }

        if(this.elementToDrag != -1 & this.dragging){
            let y = this.calibrateCoords(
                {
                    x : e.clientX,
                    y : e.clientY
                }
            ).y;
            this.visualCriterion.setAttribute("y1", y);
            this.visualCriterion.setAttribute("y2", y);
        }
    }

    calibrateCoords(coords){
        let bcr = this.svgElement.getBoundingClientRect();

        return {
            x : coords.x - bcr.x,
            y : coords.y - bcr.y
        };
    }

    /**
     * The input y coordinate should be in pixels, in the 
     * coordinate system where (0, 0) is top left.
     * @param {Number} y 
     * @returns 
     */
    yCoordinateToStimulus(y){
        let yCoord = this.heightPx - y;

        if(yCoord < this.lambdaPx) return 0;

        let yCoordProp = (yCoord - this.lambdaPx) / 
            (this.heightPx - this.lambdaPx);

        let s = Math.pow(yCoordProp, this.beta) * this.maxVal;

        return s;
    }

    /**
     * This dispatches a custom event which has
     * the current stimulus value as its "detail" attribute. 
     * The class StimulusPlayer catches these and plays the stimuli.
     * @param {MouseEvent} e 
     */
    dispatchStimulusEvent(e){
        let s =  this.yCoordinateToStimulus(
            this.calibrateCoords(
                {
                    x : e.clientX,
                    y : e.clientY
                }
            ).y);

        if(Math.random() < GLOBAL_OPTS.pCatchTrial){
            if(Math.random() < 0){
                s = 0;
            } else {
                s = Math.random() * s;
            }
        }
    
        this.s[this.curTrial] = s;

        window.dispatchEvent(new CustomEvent("stimulus", {detail : s}));
    }

    displayResponseBox(coordinates){
        let boxWidth = this.widthPx/10;
        let boxHeight = this.heightPx/10;

        let boxFrame = Utils.createSVGElement("rect", 
            {
                x : coordinates.x - boxWidth/2,
                y : coordinates.y - boxHeight/2,
                width  : boxWidth,
                height : boxHeight,
                fill : "white",
                stroke  : "black",
                "stroke-width" : "1"
            });

        let noText = Utils.createSVGElement("text",
            {
                textContent : "No",
                y : coordinates.y,
                x : coordinates.x - boxWidth/4,
                "text-anchor" : "middle",
                "dominant-baseline" : "middle",
                "font-size" : "30",
                "font-variant" : "small-caps"
            }
        );
        document.getElementById("experimentScreen")
        let yesText = Utils.createSVGElement("text",
            {
                textContent : "Yes",
                y : coordinates.y,
                x : coordinates.x + boxWidth/4,
                "text-anchor" : "middle",
                "dominant-baseline" : "middle",
                "font-size" : "30",
                "font-variant" : "small-caps"
            }
        );

        noText.addEventListener("mouseenter", () => {
            noText.setAttribute("fill", "red");
        });

        noText.addEventListener("mouseleave", () => {
            noText.setAttribute("fill", "black");
        });

        yesText.addEventListener("mouseenter", () => {
            yesText.setAttribute("fill", "red");
        });

        yesText.addEventListener("mouseleave", () => {
            yesText.setAttribute("fill", "black");
        });

        noText.addEventListener("click", () => {
            this.respBoxGroup.replaceChildren([]);
            this.registerResponse(0);
        });

        yesText.addEventListener("click", () => {
            this.respBoxGroup.replaceChildren([]);
            this.registerResponse(1);
        });

        this.respBoxGroup.appendChild(boxFrame);
        this.respBoxGroup.appendChild(noText);
        this.respBoxGroup.appendChild(yesText);
    }


    /**
     * This function is called after each response
     * that the participant gives, obviously, but note
     * that ALSO the value of the visual criterion
     * is saved at this point: the participant might not 
     * move it on each trial but we still want to have
     * its location saved.
     * @param {Number} response 
     */
    registerResponse(response){
        this.state = this.states.waitingForClick;
        this.r[this.curTrial] = response;
        this.saveCriterion();
        this.curTrial++;
    }

    saveCriterion(){
        let y = parseInt(this.visualCriterion.getAttribute("y1"));
        // HOX:
        // The y coordinate of the criterion -- at this point --
        // is ALREADY CALIBRATED!!! DO NOT ATTEMPT TO RE-CALIBRATE IT!

        this.c[this.curTrial] = this.yCoordinateToStimulus(y);
    }
}

class PseudoScaleGUI{
    constructor(){
        document.getElementById("beginPracticeBtn").addEventListener("click", () => {
            this.stimulusPlayer = new StimulusPlayer();
            document.getElementById("welcomeScreen").style.display = "none";
            document.getElementById("practiceScreen").style.display = "block";
            this.practiceTask.initialize();
        });
        document.getElementById("endPracticeBtn").addEventListener("click", () => {
            document.getElementById("practiceScreen").style.display = "none";
            document.getElementById("intermissionScreen").style.display = "block";

        });
        document.getElementById("beginExpBtn").addEventListener("click", () => {
            document.getElementById("intermissionScreen").style.display = "none";
            document.getElementById("experimentScreen").style.display = "block";
            this.currentTask = new PseudoScaleTask();
            document.getElementById("experimentScreen").appendChild(this.currentTask.svgElement);
            this.currentTask.initialize();
        });

        this.practiceTask = new PseudoScaleTask();

        document.getElementById("practiceScreen").appendChild(
            this.practiceTask.svgElement
        );

        document.getElementById("nextTaskBtn").addEventListener("click", () => {
            this.completedTasks.push(this.currentTask);
            this.currentTask = -1;
            document.getElementById("experimentScreen").lastChild.remove();

            if(this.completedTasks.length >= 5){
                document.getElementById("experimentScreen").style.display = "none";
                document.getElementById("goodbyeScreen").style.display = "block";
                this.writeData();
                return;
            }

            this.currentTask = new PseudoScaleTask();
            document.getElementById("experimentScreen").appendChild(this.currentTask.svgElement);
            this.currentTask.initialize();
            document.getElementById("taskCounter").innerText = `${this.completedTasks.length + 1}/5`;
        });

        this.currentTask = -1;
        this.completedTasks = [];
    }

    writeData(){
        let id = Math.random() * Number.MAX_SAFE_INTEGER;
        Utils.writeData(
            `expData${id}.txt`, 
            this.completedTasks,
            document.getElementById("goodbyeScreen")
        );
    }

    createShamData(){
        for(let i = 0; i < 5; i++){
            this.completedTasks[i] = new PseudoScaleTask();
            this.completedTasks[i].initializeExperiment();

            for(let j = 0; j < 20; j++){
                this.completedTasks[i].s[j] = Math.random() * 10;
                this.completedTasks[i].r[j] = Math.round(Math.random());
                this.completedTasks[i].c[j] = Math.random() * 10;
            }
        }
    }
}

let psGUI = new PseudoScaleGUI();
