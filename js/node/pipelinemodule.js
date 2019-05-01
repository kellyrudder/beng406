

const BaseModule = require('basemodule.js');
const bis_genericio = require('bis_genericio');
const BisWebTextObject = require('bisweb_textobject.js');
const path=bis_genericio.getpathmodule();
const fs=bis_genericio.getfsmodule();
// -------------------------------------------------------------------------


const longhelptext =`
{
    "command" : "biswebnode",
    "variables": [
        {
            "name" : "input",
            "files" : [
                "MNI_2mm_orig.nii.gz",
                "MNI_2mm_resliced.nii.gz", 
                "MNI_2mm_scaled.nii.gz"
            ]
        },
        {
            "name" : "out1",
            "depends": [  "%input%" ]
        },
        {
            "name": "out2",
            "depends": [ "%out1%" ]
        },
        {
            "name": "out3",
            "depends": [ "%out2%" ,"%input%" ]
        }
    ],
    "jobs": [
        {
            "name": "Smooth",
            "subcommand": "smoothImage",
            "suffix": "smoothed.nii.gz",
            "options": "--debug true --input %input% --output %out1%"
        },
        {
            "name": "Threshold",
            "subcommand": "thresholdImage",
            "suffix": "thresholded.nii.gz",
            "options": "--input %out1% --output %out2%",
            "paramfile" : "t.param"
        },
        {
            "name": "Add",
            "subcommand": "combineImages",
            "suffix": "added.nii",
            "options": "--input %input% --second %out2% --output %out3% --mode add --weight1 1.0 --weight2 1.0"
        }
    ]
}`;


const endASCII = 'z'.charCodeAt(0);

// -------------------------------------------------------------------------
let stripVariable = function (variable) {
    return variable.slice(1, variable.length - 1);
};



/**
 * Takes a series of actions and forms a sequence parseable by 'make'. 
 * 
 * @param {String} pipelineOptions - Data File Input as JSON dictionary
 * @return {String}  The Makefile for the set of jobs (null if failed);
 */
let makePipeline = function(pipelineOptions,odir='') {

    if (odir.length<1) {
        console.log('Error: no output directory specified');
        return null;
    }
    
    let defaultCommand = pipelineOptions.command || "";
    
    //--------------------------------------------------------------------------------------------------------
    // Scan input file for proper formatting
    //--------------------------------------------------------------------------------------------------------
    
    //check to see if appendText and name for each job are unique
    // Store jobs in appendTexts
    let appendTexts = {}, names = {};
    for (let job of pipelineOptions.jobs) {
        let appendText = job.suffix, name = job.name, subcommand = job.subcommand || '';
        
        if (!name) {
            if (appendText) {
                console.log('Error: job with appendText', appendText, 'does not have a name');
            } else {
                console.log('Error: job', job, 'does not have a name or appendText');
            }
            
            return null;
        } 

        if (!appendTexts[appendText] && !names[name]) {
            appendTexts[appendText] = { 'text' : appendText, 'subcommand' : subcommand, 'name' : name};
            names[name] = name;
        } else {
            let duplicate = appendTexts[appendText] ? appendTexts[appendText].name : names[name];
            console.log('Error: appendTexts and names of jobs must be unique. Jobs', duplicate, 'and', job.name, 'have same appendText or name.');
            return null;
        }
    }

    // Rest of code expects .variables so move
    pipelineOptions.variables=pipelineOptions.inputs;
    
    // -------------- replace variable file lists with filenames ---------------
    // ------
    console.log('+++ checking for external files in variables');
    for (let variable of pipelineOptions.variables) {
        if (variable.filename) {
            try {
                let dat=fs.readFileSync(variable.filename, 'utf-8');
                try {
                    let flist=JSON.parse(dat);
                    let fnames=flist.filenames || [];
                    let comment = flist.comment || 'no comment provided';
                    console.log('+++ Read ',fnames.length,'filenames from file', variable.filename, ' for variable', variable.name);
                    console.log('+++ Comment = ',comment);
                    variable.files=fnames;
                } catch(e) {
                    console.log('Failed to parse', variable.filename,'error=',e);
                    return null;
                }
            } catch(e) {
                console.log('Failed to read',variable.filename,'error',e);
                return null;
            }
        }
    }

    // Add more variables from jobs
    // ----------------------------
    for (let job of pipelineOptions.jobs) {
        for (let output of job.outputs) {
            pipelineOptions.variables.push({ 'name' : output.name, 'depends': output.depends });
        }
    }
    console.log('variables=',JSON.stringify(pipelineOptions.variables,null,2));
    
    let expandedVariables = {};
    
    //inputs, outputs, and formatted commands for EACH command produced by EACH job
    let allJobOutputs = [];
    
    //the commands associated with EACH job in object form { 'job' : [job name], 'outputs' : [output files produced by job]}
    let jobsWithOutputs = [];
    
    for (let job of pipelineOptions.jobs) {
        
        //the entry in jobsWithOutputs for this job
        let jobWithOutputs = {
            'name' : job.name,
            'outputs' : []   
        };
        
        let variablesReferencedByCurrentJob = []; //variables resolved in scope of current job are used to generate output names appropriate to the current job
        let inputsUsedByJob = [];
        
        //a variable is generated by a job if the symbolic reference to that variable first appears in that job, e.g. if you have a variable 'out1', if it is first referenced by a job 'job1' then out1 is considered a variable generated by job1
        let variablesGeneratedByJob = [];
        let variablesWithDependencies = [];
        let optionsArray = [];
        
        //construct array of variables from array of options (if applicable)
        if (job.options) {
            optionsArray = job.options.split(' ');
            for (let option of optionsArray) {
                //add a key to the expanded variable map for each variable specified in the job's options
                //variables are denoted as keys of variables specified in JSON surrounded by '%'. 
                if (option.charAt(0) === '%' && option.charAt(option.length - 1) === '%') {
                    let variableName = stripVariable(option);
                    variablesReferencedByCurrentJob.push(variableName);
                    if (!expandedVariables[variableName]) expandedVariables[variableName] = [];
                }
            }
        }
        console.log('____________________\n___ Job Name=',job.name,'\n__ Variables=',variablesReferencedByCurrentJob);
        
        //expand variable names into arrays

        for (let variableName of variablesReferencedByCurrentJob) {

            //            console.log('.... Looking for variableName=',variableName,' referenced by current job',job.name);
            //find appropriate entry in variables specified in JSON
            for (let j = 0; j <= pipelineOptions.variables.length; j++) {
                
                //return an error if we reach the end without finding the variable
                if (j === pipelineOptions.variables.length) {
                    console.log('Variable ' + variableName + ' is not contained in the file ' + filename);
                    return null;
                }
                
                if (pipelineOptions.variables[j].name === variableName) {
                    //let variable = pipelineOptions.variables[j];

                    
                    //a variable with its files specified should be added to the dictionary of expanded variables
                    //the fact that its files are present already also indicates that it is an input 
                    if (pipelineOptions.variables[j].files) { // && expandedVariables[variableName].length === 0) {
                        expandedVariables[variableName] = pipelineOptions.variables[j].files;
                        inputsUsedByJob.push({ 'name' : variableName, 'index' : j});
                    } else if (pipelineOptions.variables[j].depends) {
                        //expand list of dependencies, if necessary.
                        variablesWithDependencies.push({ 'name': variableName, 'index': j });

                    } else {
                        console.log('____ Not Adding variableName as depenency',variableName);
                        console.log("Files=",pipelineOptions.variables[j].files);
                        console.log("Expanded=",expandedVariables[variableName]);
                    }
                    j+= pipelineOptions.variables.length + 1;
                }
            }
        }
        
        //expand dependencies into lists of files if necessary and parse variables used by the job into input and output
        //note that an input is any variable that has its file list available to the job (this relies on jobs being specified in the order in which they run in the JSON file)
        
        //determine the number of commands to produce for the job based on the variables, e.g. if a variable contains five names five commands should be produced
        //note that a variable that does not contain one name will contain exactly the same number of names as any other variable that does not specify one name
        let numOutputs = 0;
        for (let key of Object.keys(expandedVariables)) {
            if (expandedVariables[key].length > numOutputs) numOutputs = expandedVariables[key].length;
        }

        for (let variable of variablesWithDependencies) {

            //console.log('\n\n-----------------------------\n');
            console.log('__ Variable = ',variable);
            //if names have already been generated then the output is produced by a node upstream, so don't overwrite the names
            if (expandedVariables[variable.name].length === 0) {
                let dependencies = pipelineOptions.variables[variable.index].depends;
                console.log('__ Depedencies=',dependencies);
                for (let dependency of dependencies) {
                    dependency = stripVariable(dependency);
                    //console.log('Processing dependency=',dependency);
                    if (!expandedVariables[dependency]) {
                        console.log("Error: dependency", dependency, "cannot be resolved by job", job.command);
                        return null;
                    }
                }

                let outputFilenames = [];
                for (let i = 0; i < numOutputs; i++) {
                    
                    let inplist=[];
                    //                    console.log('Inputs used by Job=',inputsUsedByJob);
                    inputsUsedByJob.forEach( (input) => {
                        let fn=(expandedVariables[input.name].length > 1 ? expandedVariables[input.name][i] : expandedVariables[input.name][0]);
                        let lst=fn.split('.');
                        if (lst[lst.length-1]==='gz')
                            lst.pop();
                        lst.pop();
                        let fname=lst.join('.');
                        fname=fname.trim().replace(/__op__/,'_').replace(/__/g,'_');
                        inplist.push(path.basename(fname));
                    });

                    //console.log('Inputs used by Job=',inputsUsedByJob,inplist);
                    
                    //generate output names
                    let outputFilename = inplist.join('__') + '__op__'+job.suffix;
                    if (odir.length>0)
                        outputFilename=(path.join(odir,path.basename(outputFilename)));
                    outputFilenames.push(outputFilename);
                    //console.log('Output=',outputFilenames,'deps=',dependencies,'inplist=',inplist);
                }
                expandedVariables[variable.name] = outputFilenames;
                variablesGeneratedByJob.push(variable);
            } else {
                inputsUsedByJob.push(variable);
            }
        }
        
        //replace entry in optionsArray with appropriate expanded variable
        for (let i = 0; i < optionsArray.length; i++) {
            let option = optionsArray[i];
            
            if (option.charAt(0) === '%' && option.charAt(option.length-1) === '%') {
                let variable = stripVariable(option);
                optionsArray[i] = expandedVariables[variable];
            }
            
        }
        
        //construct the inputs, outputs, and command in the way that 'make' expects
        for (let i = 0; i < numOutputs; i++) {
            let commandArray = [], formattedJobOutput = { 'inputs' : [], 'outputs' : [], 'command' : undefined };
            for (let option of optionsArray) {
                //add appropriate entry from expanded variable if necessary
                let expandedOption = Array.isArray(option) ? ( option.length > 1 ?  option[i] : option[0]) : option;
                commandArray.push(expandedOption);
            }
            
            inputsUsedByJob.forEach( (input) => {
                input = expandedVariables[input.name].length > 1 ? expandedVariables[input.name][i] : expandedVariables[input.name][0];
                //console.log('Input=',input);
                formattedJobOutput.inputs.push(input);
            });
            
            variablesGeneratedByJob.forEach( (output) => {
                output = expandedVariables[output.name].length > 1 ? expandedVariables[output.name][i] : expandedVariables[output.name][0];
                formattedJobOutput.outputs.push(output);
                jobWithOutputs.outputs.push(output);
            });
            
            //command can either be the default command, the command specified for the set of jobs, or the command specified for an individual job.
            //the command for an individual job takes highest precedence, then the command for the set, then the default.
            let command = job.command ? job.command : defaultCommand;
            let subcommand = job.subcommand ? job.subcommand : '';
            let paramfile = job.paramfile || '';
            if (paramfile.length>0) {
                formattedJobOutput.inputs.push(paramfile);
                paramfile=' --paramfile '+paramfile;
             
            }
            
            formattedJobOutput.command = command + ' ' + subcommand + ' ' + commandArray.join(' ')+paramfile;
            allJobOutputs.push(formattedJobOutput);
        }
        
        jobsWithOutputs.push(jobWithOutputs);
    }
    
    //add 'make all' 
    let makefile = '#-----------------------------------------------\n#\n';
    makefile+="# All Jobs\n#\nall : ";
    for (let job of jobsWithOutputs) {
        makefile = makefile + job.name + ' ';
    }
    makefile+="\n\n";
    
    
    //add 'make [job]' for each job
    for (let job of jobsWithOutputs) {
        //        console.log('job', job);
        let name = job.name;
        makefile +='#-----------------------------------------------\n#\n';
        makefile += '# execute job '+name+'\n#\n';
        makefile +=  name + ' : ';
        
        for (let output of job.outputs) {
            makefile += output + ' ';
        }
        makefile += '\n\n';
    }

    makefile +='#-----------------------------------------------\n#\n';
    makefile +='# Create individual output files\n#\n';
    //make the rest of the commands with job names set to the name of outputs
    let onames='';
    for (let o of allJobOutputs) {
        for (let output of o.outputs) {
            let outlog=output+'.results';
            makefile += output + ' : ' + o.inputs.join(' ') + '\n\t' + o.command + ' > '+outlog +' 2>&1 \n\n';
            onames=onames+' '+output+' '+outlog;
        }
    }

    //add 'make clean'
    makefile += '#----------------------------------- \n# clean all outputs\n#\n';
    makefile = makefile + 'clean:\n\t rimraf '+onames+'\n\n';

    
//    console.log('makefile', makefile);
    return makefile;
};


/*let getFileExtension = function (type) {
    switch (type) {
        case 'image': return '.nii.gz';
        case 'matrix': return '.matr';
        case 'transform':
        case 'transformation': return '.grd';
    }
};*/



// -----------------------------------------------------------------------------------------------------

class PipelineModule extends BaseModule {
    constructor() {
        super();
        this.name = 'Hash';
    }

    createDescription() {

        return {
            "name": "Create Pipeline file",
            "description": "This module creates a makefile from a pipeline json file. Use --sample true to get an example pipeline file",
            "author": "Zach Saltzman and Xenios Papademetris",
            "version": "1.0",
            "inputs": [],
            "outputs": [
                {
                    'type': 'text',
                    'shortname' : 'o',
                    'name': 'Results',
                    'description': 'output makefile',
                    'varname': 'output',
                    'required': true,
                    'extension': '.txt'
                },
            ],
            "buttonName": "Execute",
            "shortname": "info",
            "params": [
                {
                    "name": "input",
                    "shortname" : "i",
                    "description": "Name of the input filename",
                    "advanced": false,
                    "type": "string",
                    "varname": "input",
                    "default": ""
                },
                {
                    "name": "odir",
                    "shortname" : "d",
                    "description": "Output directory",
                    "advanced": false,
                    "type": "string",
                    "varname": "odir",
                    "default": ""
                },
                {
                    "name": "sample",
                    "description": "Produce sample file",
                    "advanced": false,
                    "type": "boolean",
                    "varname": "sample",
                    "default": false,
                },
            ]
        };
    }

    directInvokeAlgorithm(vals) {

        
        return new Promise((resolve, reject) => {

            let inp=vals.input || '';
            
            if (vals.sample || inp.length<1 ) {
                console.log('____ No input file specified, here is a sample input file');
                console.log(longhelptext);
                console.log('\n\n');
                reject('');
                return;
            }

            vals.odir=vals.odir || '';
            if (vals.odir.length<1) {
                console.log('____ No output directory specified, specify this using the --odir flag');
                reject('');
                return;
                
            };

            bis_genericio.makeDirectory(vals.odir).then( (m) => {
                let d=path.resolve(path.normalize(vals.odir));
                if (m)
                    console.log('++++ Created output directory',d);
                else
                    console.log('++++ Output directory',d,'already exists, use with care.');
                
                bis_genericio.read(vals.input).then( (obj) => {
                    let dat=null;
                    try { 
                        dat=JSON.parse(obj.data);
                    } catch(e) {
                        console.log(e);
                        reject(e);
                        return;
                    }
                    let out=makePipeline(dat,vals.odir);
                    if (out!==null) {
                        this.outputs['output']=new BisWebTextObject(out);
                        this.outputs['output'].forceTextSave(); // No JSON!
                        resolve();
                    } else {
                        reject('Something went wrong');
                    }
                }).catch( (e) => {
                    console.log('Error',e,e.stack);
                    reject(e);
                });
            }).catch( (e) => { 
                console.log('Error',e,e.stack);
                reject(e);
            });
        });
    }

}

module.exports = PipelineModule;
