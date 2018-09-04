
const path=require('path');
const timers = require('timers');
const util = require('bis_util');
const WebSocket=require('ws');
const genericio = require('bis_genericio.js');

const globalInitialServerPort=require('bis_wsutil').initialPort;


const BaseFileServer=require('bis_basefileserver');


// .................................................. This is the class ........................................

class BisWSWebSocketFileServer extends BaseFileServer {

    constructor(opts={}) {
        super(opts);
    }

    


    // -----------------------------------------------------------------------------------
    // Socket Wrappers
    // -----------------------------------------------------------------------------------
    
    /**
     * send JSON data
     * @param{Socket} socket - the socket to use
     * @param{String} type - either binary or the name of the package
     * @param{Object} obj - the dictionary to send
     * @returns {Promise} 
     */
    sendCommand(socket,type,obj) {

        
        return new Promise( (resolve,reject) => {

            let res=(m) => {
                resolve(m);
            };
           
            try {
                if (type!=='binary') {
                    let payload =JSON.stringify({
                        'type' : type,
                        'payload' : obj,
                    });
                    socket.send(payload, { binary : false },res);
                } else {
                    socket.send(obj, { binary: true},res);
                }
            } catch(e) {
                reject(e);
            }
        });
    }
    

    /** Attach Socket Event 
     *
     * @param{Socket} socket - the socket to use
     * @param{String} eventname - the name of the event
     * @param{Function} fn - the event handler
     */
    attachSocketEvent(socket,eventname,fn) {
        console.log('..... \t\t attaching socket event='+eventname+' to '+socket);
        socket.on(eventname, fn);
    }

    /** Remove Socket Event 
     *
     * @param{Socket} socket - the socket to use
     * @param{String} eventname - the name of the event
     * @param{Function} fn - the event handler
     */
    removeSocketEvent(socket,eventname,fn) {
        socket.removeEventListener(eventname, fn);
    }


    /** Close Socket Event
     * @param{Socket} socket - the socket to close
     * @param{Boolean} destroy - if true call socket.destroy() in addition
     */
    closeSocket(socket,destroy=false) {
        socket.close();
        if (destroy)
            socket.terminate();
    }

    
    
    // End of Socket Wrapper
    // -----------------------------------------------------------------------------------
    //
    // Begin Server Wrapper
    /** Stop Server
     * @param{Server} server - the server to stop
     */
    stopServer(server) {
        server.close();
    }

    /**  decodes text from socket
     * @param{Blob} text - the string to decode
     * @param{Number} length - the length of the string
     * @returns {String} - the decoded string
     */
    decodeUTF8(text,length) {
        return text;
    }

    getSocketInfo(socket) {

        try {
            return socket.Server._connectionKey;
        } catch(e) {
            return "()"
        }
    }

    // --------------------------------------------------------------------------


    // End of Server Wrapper
    // -----------------------------------------------------------------------------------
    
    /**
     * Creates the server instance, binds the handshake protocol to its 'connection' event, and begins listening on port 24000 (control port for the transfer).
     * Future sockets may be opened after this method has been called if the server is made to listen for the eonnection. 
     * 
     * Client and server *must* open a socket on a control port in order to communicate -- the control port will listen for commands from the server, interpret them, then serve the results.
     * Client and server may also open a transfer port in the case that the client requests to transfer data to the server. 
     * 
     * @param {String} hostname - The name of the domain that will be attempting to connect to the server, i.e. the client address. 
     * @param {Number} port - The control port for the exchanges between the client and server. 
     * @param {Boolean} datatransfer - if true this is a data transfer server
     * @returns A Promise
     */
    startServer(hostname='localhost', port=globalInitialServerPort, datatransfer = true) {

        const self=this;

        return new Promise ( (resolve,reject) => {
        
            console.log("Creating Server=",hostname,port);
            
            this.netServer = new WebSocket.Server({
                'host' : hostname,
                'port' : port
            }, () => {
                
                this.datatransfer=datatransfer;
                this.hostname=hostname;
                this.port=port;
                
                this.netServer.on('connection', (socket) => {
                    
                    console.log('..... Connected server=',this.netServer._server._connectionKey);
                    
                    this.attachSocketEvent(socket,'close', () => {
                        
                        if (this.terminating) {
                            console.log('..... Terminating');
                        } else  if (!self.datatransfer) {
                            console.log('.....\n..... Restarting server as connections went down to zero');
                            self.createPassword();
                        }
                    });
                    
                    if (this.datatransfer) {
                        console.log('._._._._._._- \t Data Transfer is ON: We are ready to respond',port,' datatransfer=',self.datatransfer,self.hostname,self.port,this.netServer._serv);
                        self.prepareForDataFrames(socket);
                    } else {
                        console.log('..... We are ready to respond on port='+port);
                        setTimeout( () => {
                            self.authenticate(socket)
                        },500);
                    }
                });
                
                
                
                this.netServer.on('listening', () => {
                    if (datatransfer) {
                        this.datatransfer=true;
                        this.portNumber=port;
                        console.log('._._._._._._- \tStarting transfer data server on ',port);
                    } else {
                        this.datatransfer=false;
                        this.portNumber=port;
                        this.hostname=hostname;
                        this.createPassword();
                        if (this.opts.insecure) {
                            console.log(".....\t IN INSECURE MODE");
                        }
                        if (this.opts.nolocalhost) 
                            console.log(".....\t Allowing remote connections");
                        else
                            console.log(".....\t Allowing only local connections");
                        if (this.opts.readonly)
                            console.log(".....\t Running in 'read-only' mode");
                        
                        console.log('.....\t Providing access to:',this.opts.baseDirectoriesList.join(', '));
                        console.log('.....\t\t  The temp directory is set to:',this.opts.tempDirectory);
                        
                        console.log('..................................................................................');
                    }
                });
                
                this.netServer.on('error', (m) => {
                    console.log('..... server error',m);
                    reject();
                });

                setTimeout( () => {
                    resolve(this.portNumber);
                },100);
            });
        });
    }
    
    
    authenticate(socket) {

        let readOTP = (msg) => {

            let password=msg;
            console.log('..... password sent by client=('+password+')');

            if ( this.checkPassword(password) || (this.opts.insecure && password.length<1)) {
                this.prepareForControlFrames(socket);
                this.removeSocketEvent(socket,'messsage', readOTP);
                this.sendCommand(socket,'goodauth', '');
                this.createPassword(2);
                socket.removeEventListener('message',readOTP);
                console.log('..... Authenticated OK\n.....');
                console.log("Done preparing",socket._events);
                
            } else {
                console.log('..... The token you entered is incorrect.');
                this.createPassword(1);
                this.sendCommand(socket,'badauth', '');
            }
        };


        socket.on('message',readOTP);
        this.sendCommand(socket,'authenticate', 'wss').then( (m) => {
            console.log("message sent");
        });
    }


    /**
     * Prepares the control socket to receive chunks of data from the client. 
     * This involves XORing the payload and decoding it to UTF-8, then performing file I/O based on the contents.
     * 
     * @param {Net.Socket} socket - Node.js net socket between the client and server for the transmission.
     */
    prepareForControlFrames(socket) {

        console.log("Preparing for Control Frames",socket._events);
        
        socket.on('error', (error) => {
            console.log('..... an error occured', error);
        });
        
        //socket listener is stored here because it gets replaced during file transfer
        let handleMessage= ((message) => {
            if (!message) {
                console.log('..... Bad Frame ',this.getSocketInfo(socket));
                console.log('..... Received bad frame, sending nogood');
                this.sendCommand(socket,'nogood', 'badframe');
                return;
            }
            
            console.log("Received message type=",typeof message);
            
            this.handleTextRequest(message, null, socket);
        });

        socket.on('message',handleMessage);
    }
    
    

    // .....................................................................................................................................................................
    // .................................................. Receive File From Client ................................................................................
    // .....................................................................................................................................................................
    
    /**
     * Prepares the transfer socket to receive from the client. 
     * Client and server engage in chunked transfer, meaning that the client will send a chunk of data, the server will acknowledge, and then the client will transfer the next chunk.
     * They will exchange messages in this way until the transfer is complete, or an unrecoverable error occurs.
     * 
     * @param {Net.Socket} socket - Node.js net socket between the client and the server for transmission.
     */
    prepareForDataFrames(socket) {
        
        //server can send mangled packets during transfer that may parse as commands that shouldn't occur at that time, 
        //e.g. a mangled packet that parses to have an opcode of 8, closing the connection. so unbind the default listener and replace it after transmission.
        
        console.log('._._._._._._- \t receiving data on socket',this.getSocketInfo(socket),socket.protocol);
        const self=this;
        
        socket.on('messsage', (chunk) => {
            console.log('._._._._._._- \t receiving data on socket inside');
            
            console.log('Chunk',typeof chunk);
            
            let controlFrame = chunk.slice(0, 14);
            let parsedControl = wsutil.parseControlFrame(controlFrame);
            //        console.log('.....','parsed control frame', parsedControl);
            
            if (!parsedControl.mask) {
                console.log('..... Received a transmission with no mask from client, dropping packet.');
                return;
            }
            
            let decoded = new Uint8Array(parsedControl.payloadLength);
            //decode the raw data (undo the XOR)
            for (let i = 0; i < parsedControl.payloadLength; i++) {
                decoded[i] = chunk[i + parsedControl.datastart] ^ parsedControl.mask[i % 4];
            }
            
            switch (parsedControl.opcode) {
            case 2:
                if (this.opts.verbose)
                    console.log('..... adding packet with control', JSON.stringify(parsedControl));
                try {
                    addToCurrentTransfer(decoded, parsedControl, socket);
                } catch(e) {
                    console.log('.....',"Addition error",e);
                }
                if (this.timeout) {
                    timers.clearTimeout(this.timeout);
                    this.timeout = null;
                }
                break;
            case 8:
                this.closeSocket(socket,true);

                if (self.datatransfer) {
                    console.log('._._._._._._-\n._._._._._._- received close from client, ending data connection on port',self.portNumber,' data=',self.datatransfer,'\n._._._._._._-');
                    self.stopServer(self.netServer);
                }  else {
                    console.log('.....\n..... received close from client, ending data connection on port',self.portNumber,' data=',self.datatransfer,'\n.....');
                }
                break;
            default: 
                console.log('..... dropping packet with control', JSON.stringify(parsedControl));
                if (!this.timeout) {
                    this.timeout = self.setSocketTimeout( () => {
                        console.log('..... timed out waiting for client');
                        this.closeSocket(socket,false);
                    });
                }
            }
        });
        
        
        let getWriteLocation=function(name,dataInProgress) {
            
            let i=0;
            while (i<self.opts.baseDirectoriesList.length) {
                if (name.indexOf(self.opts.baseDirectoriesList[i])===0) {
                    return name;
                }
                i=i+1;
            }
            
            if (name.indexOf("/")===0) {
                let f=name.lastIndexOf("/");
                name=name.substr(f+1,name.length);
            }
            
            name=path.join(self.opts.baseDirectoriesList[0],dataInProgress.name);
            return name;
        };
        
        function addToCurrentTransfer(upload, control, socket) {
            
            let dataInProgress=self.fileInProgress;

            if (self.opts.verbose)
                console.log('._._._._._._- \t\t offset=',dataInProgress.offset,'Lengths: total=',dataInProgress.data.length,
                            'piecel=',upload.length);
            
            if ( (upload.length!==dataInProgress.packetSize) &&
                 (dataInProgress.offset+upload.length!== dataInProgress.totalSize)) {
                console.log('._._._._._._-','\t bad packet size', upload.length, ' should be =', dataInProgress.packetSize, ' or ', dataInProgress.totalSize-dataInProgress.offset);
                return;
            }
            
            
            //        for (let i=0;i<upload.length;i++)
            //  dataInProgress.data[i+dataInProgress.offset]=upload[i];
            dataInProgress.data.set(upload,dataInProgress.offset);
            dataInProgress.offset+=upload.length;

            //check to see if what we've received is complete 
            if (dataInProgress.offset >= dataInProgress.totalSize) {


                let checksum=util.SHA256(new Uint8Array(dataInProgress.data));
                if (checksum!== dataInProgress.checksum) {
                    console.log('._._._._._._-','Bad Checksum', checksum, ' vs' ,dataInProgress.checksum);
                    self.sendCommand(socket,'uploadfailed',`${checksum}`);
                    dataInProgress=null;
                    return;
                }
                
                if (!dataInProgress.isbinary) {
                    dataInProgress.data=genericio.binary2string(dataInProgress.data);
                }

                let writeLocation = getWriteLocation(dataInProgress.name,dataInProgress);
                if (path.sep==='\\')
                    writeLocation=util.filenameUnixToWindows(writeLocation);
                console.log('._._._._._._- \t writing to file', writeLocation,'\n._._._._._._- \t\t size=',dataInProgress.data.length,'\n._._._._._._- \t\t checksum matched=',checksum);
                
                genericio.write(writeLocation, dataInProgress.data, dataInProgress.isbinary).then( () => {
                    self.sendCommand(socket,'uploadcomplete', 'file saved in '+writeLocation+' (isbinary='+dataInProgress.isbinary+')').then( () => {
                        dataInProgress.data=null;
                        console.log('._._._._._._- \t message sent -- file saved in ',writeLocation,' binary=',dataInProgress.isbinary);
                    });


                }).catch( (e) => {
                    console.log('._._._._._._- an error occured', e);
                    self.sendCommand(socket,'error', e);
                    self.closeSocket(socket,true);
                });
            } else {
                //console.log('._._._._._._- received chunk,', dataInProgress.receivedFile.length, 'received so far.');
                try {
                    self.sendCommand(socket,'nextpacket', '');
                } catch(e) {
                    console.log('._._._._._._-','\n\n\n\n\n ._._._._._._-................................... \n\n\n\n\n Error Caught =');
                    self.closeSocket(socket,true);
                }
            }
        }  
    }

    
    /**
     * Handles an file upload from the client and saves the file to the server machine once the transfer is complete. File transfer occurs in chunks to avoid overloading the network.
     * The first transmission will indicate the total size of the transmission and what size the packets are so the server machine will know when transfer is complete. 
     * 
     * Client transmissions are handled by prepareForDataFrames.
     * 
     * @param {Object|Uint8Array} upload - Either the first transmission initiating the transfer loop or a chunk.
     * @param {Object} control - Parsed WebSocket header for the file request. 
     * @param {Net.Socket} socket - The control socket that will negotiate the opening of the data socket and send various communications about the transfer. 
     */
    getFileFromClientAndSave(upload, control, socket) {

        if (this.opts.readonly) {
            console.log('.....','Server is in read-only mode and will not accept writes.');
            this.sendCommand(socket,'uploadmessage', {
                'name' : 'serverreadonly',
                'id' : upload.id
            });
            return;
        }

        //spawn a new server to handle the data transfer
        console.log('.... .... Beginning data transfer', this.portNumber+1,'upload=',upload.filename);

        if (!this.validateFilename(upload.filename)) {
            this.sendCommand(socket,'uploadmessage', {
                name : 'badfilename',
                payload : 'filename '+upload.filename+' is not valid',
                id : upload.id,
            });
            return;
        }
        
        let tserver=new BisWSWebSocketFileServer({ verbose : this.opts.verbose,
                                                   readonly : false,
                                                   baseDirectoriesList: this.opts.baseDirectoriesList,
                                                   tempDiretory : this.opts.tempDirectory,
                                                 });
        tserver.startServer(this.hostname, this.portNumber+1,true).then( (p) => {

            console.log(p);
            tserver.createFileInProgress(upload);
            let cmd={
                'name' : 'datasocketready',
                'port' : p,
                'id' : upload.id
            };
            console.log('._._._._._._- \t Sending back',JSON.stringify(cmd));
            this.sendCommand(socket,'uploadmessage', cmd);
        });
    }
}


module.exports=BisWSWebSocketFileServer;
